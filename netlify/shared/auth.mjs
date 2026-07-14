/**
 * Shared server-side auth: resolve the signed-in Supabase user from the
 * caller's access token, so money-spending functions can require a real
 * logged-in user (and, where needed, an entitled subscription).
 */
import crypto from "node:crypto";
import { sbSelect } from "./supabase.mjs";

/** Verify a Supabase access token and return the user id, or null. */
export async function getUserId(token) {
  if (!token) return null;
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  try {
    const res = await fetch(`${base}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: key },
    });
    if (!res.ok) return null;
    const user = await res.json().catch(() => null);
    return user?.id || null;
  } catch {
    return null;
  }
}

/** Pull the Bearer token out of an Authorization header. */
export function bearer(req) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

/**
 * Gate for the diagnostic endpoints (retell-debug / retell-repair). These
 * expose config and can mutate Retell / write rows, so they must never be
 * wide open on a live site. Access requires `?token=<DEBUG_TOKEN>` matching
 * the DEBUG_TOKEN env var. FAILS CLOSED: if DEBUG_TOKEN is unset, the detailed
 * / mutating features are disabled entirely.
 */
export function debugAuthorized(req) {
  const secret = process.env.DEBUG_TOKEN;
  if (!secret) return false;
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    if (token.length !== secret.length) return false;
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

/**
 * Statuses that mean "has a valid card / active plan" — the gate for actions
 * that cost real money (buying a phone number, sending SMS). A trial only
 * counts here once it's a real Stripe subscription (card on file).
 */
const ENTITLED = new Set(["trialing", "active", "past_due"]);

/** True when the user has a Stripe subscription that entitles paid actions. */
export async function isEntitled(uid) {
  if (!uid) return false;
  try {
    const rows = await sbSelect(
      "subscriptions",
      `select=status,access_expires_at&user_id=eq.${uid}&limit=1`
    );
    const sub = rows[0];
    if (!sub) return false;
    // Hard expiry wins (time-boxed tester accounts): expired -> not entitled.
    if (sub.access_expires_at) {
      const exp = new Date(sub.access_expires_at).getTime();
      if (Number.isFinite(exp) && exp <= Date.now()) return false;
    }
    return ENTITLED.has(sub.status);
  } catch {
    // Fail CLOSED on the money path — no entitlement proof, no spend.
    return false;
  }
}
