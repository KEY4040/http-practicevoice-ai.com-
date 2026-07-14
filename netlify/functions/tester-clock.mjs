/**
 * Netlify Function: tester-clock
 * ---------------------------------------------------------------------------
 * Starts a time-boxed tester account's countdown on FIRST sign-in.
 *
 * A tester subscription is created with `tester_days` set (e.g. 4) and
 * `access_expires_at = NULL`. The first time the signed-in tester's app calls
 * this endpoint, we stamp `access_expires_at = now() + tester_days days`. After
 * that the entitlement checks (isEntitled / hasActiveAccess) lock the account
 * out automatically once the window passes — no manual cleanup needed.
 *
 * Idempotent: once access_expires_at is set, subsequent calls are a no-op. Safe
 * to call on every dashboard load; it only ever affects a tester whose clock
 * hasn't started, and never touches a normal Stripe subscription.
 */
import { hasSupabase, sbSelect, sbUpdate } from "../shared/supabase.mjs";
import { getUserId, bearer } from "../shared/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!hasSupabase()) return json({ ok: false, error: "supabase_not_configured" }, 500);

  const uid = await getUserId(bearer(req));
  if (!uid) return json({ ok: false, error: "not_signed_in" }, 401);

  try {
    const rows = await sbSelect(
      "subscriptions",
      `select=tester_days,access_expires_at&user_id=eq.${uid}&limit=1`
    );
    const sub = rows[0];
    // Not a tester, or clock already started -> nothing to do.
    if (!sub || !sub.tester_days || sub.access_expires_at) {
      return json({ ok: true, started: false, expires_at: sub?.access_expires_at ?? null });
    }
    const expires = new Date(Date.now() + Number(sub.tester_days) * 86_400_000).toISOString();
    // Race-safe: only stamp if still NULL, so two tabs can't double-start it.
    const updated = await sbUpdate(
      "subscriptions",
      `user_id=eq.${uid}&access_expires_at=is.null`,
      { access_expires_at: expires }
    );
    const expires_at = updated[0]?.access_expires_at ?? expires;
    return json({ ok: true, started: true, expires_at });
  } catch (err) {
    const msg = ((err && err.message) || String(err)).slice(0, 120);
    return json({ ok: false, error: "clock_failed", detail: msg }, 500);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
