/**
 * Verify a Stripe webhook signature without the Stripe SDK.
 *
 * Stripe sends `Stripe-Signature: t=<ts>,v1=<sig>[,v1=<sig>...]`. The signed
 * payload is `${t}.${rawBody}`, HMAC-SHA256'd with the endpoint secret. We
 * compare (timing-safe) against any provided v1 signature and enforce a
 * timestamp tolerance to block replays.
 */
import crypto from "node:crypto";

export function verifyStripeSignature(rawBody, sigHeader, secret, toleranceSec = 300) {
  if (!secret || !sigHeader) return false;

  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const t = parts.t;
  const v1 = sigHeader
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.trim().slice(3));
  if (!t || v1.length === 0) return false;

  // Replay guard.
  const ts = Number(t);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(readNow() / 1000);
  if (Math.abs(nowSec - ts) > toleranceSec) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`, "utf8")
    .digest("hex");
  const a = Buffer.from(expected);
  return v1.some((sig) => {
    const b = Buffer.from(sig);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

// Isolated so the tolerance check has a single clock source.
function readNow() {
  return Date.now();
}

/** True when a Stripe SECRET key is configured (needed to call the Stripe API). */
export function hasStripeSecret() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Cancel a subscription IMMEDIATELY via the Stripe API (DELETE /v1/subscriptions/
 * {id}) so billing stops right away. Requires STRIPE_SECRET_KEY. Returns
 * { ok: true } on success (or if the sub is already gone / not found — the goal
 * "no longer billing" is met either way), { ok: false, error } otherwise.
 */
export async function cancelStripeSubscription(subscriptionId) {
  if (!subscriptionId) return { ok: true, note: "no_subscription" };
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, error: "no_secret_key" };
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) }
    );
    if (res.ok) return { ok: true };
    // 404 = the subscription no longer exists at Stripe -> already not billing.
    if (res.status === 404) return { ok: true, note: "already_gone" };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `stripe_${res.status}`, detail: text.slice(0, 200) };
  } catch (e) {
    return { ok: false, error: "stripe_request_failed", detail: (e && e.message) || String(e) };
  }
}
