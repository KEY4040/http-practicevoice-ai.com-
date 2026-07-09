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
