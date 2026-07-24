/**
 * Netlify Function: vip-check
 * ---------------------------------------------------------------------------
 * Called by the Retell agent (as a Custom Function) at the START of a call to
 * decide whether the caller is a VIP who should ring STRAIGHT THROUGH to the
 * owner's cell instead of being handled by the AI.
 *
 * Retell Custom Function setup (per agent):
 *   Name:        check_vip
 *   URL:         https://practicevoice-ai.com/.netlify/functions/vip-check
 *   (Retell posts the live call object, which carries from_number/to_number/
 *    agent_id — no args needed.)
 *
 * Returns: { is_vip: boolean, transfer_number: string|null }
 * The agent's prompt then says: if is_vip is true, tell the caller "one second,
 * connecting you" and transfer the call to transfer_number.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";
import { verifySignature } from "../shared/retell.mjs";

const nat = (s) => String(s || "").replace(/\D/g, "").slice(-10);

export default async (req) => {
  if (req.method !== "POST") return json({ is_vip: false }, 405);

  // Read the RAW body first — the signature is computed over these exact bytes.
  const raw = await req.text();

  // The safe response, also returned whenever the request can't be authenticated,
  // so the owner's transfer number is never handed to an unauthenticated caller.
  const safe = { is_vip: false, transfer_number: null };

  // Authenticate: Retell signs its requests with x-retell-signature (HMAC-SHA256).
  // On any failure we return `safe` — never the transfer number.
  const apiKey = process.env.RETELL_API_KEY;
  const signature =
    req.headers.get("x-retell-signature") || req.headers.get("x-retell-signature-256");
  const authed = Boolean(apiKey && signature && verifySignature(raw, signature, apiKey));

  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return json(safe);
  }

  if (!authed) {
    if (!apiKey) console.error("[vip-check] RETELL_API_KEY not set — treating caller as non-VIP.");
    return json(safe);
  }

  // Retell posts { call: {...}, name, args }. Be liberal about where the fields
  // live so it works whether Retell sends them nested or flat.
  const call = body.call || body.data || body;
  const from = call.from_number || body.from_number || body?.args?.from_number;
  const to = call.to_number || body.to_number;
  const agentId = call.agent_id || body.agent_id;

  if (!hasSupabase() || !from) return json({ is_vip: false, transfer_number: null });

  try {
    const clinic = await resolveClinic(agentId, to);
    if (!clinic || !clinic.vip_enabled || !clinic.vip_transfer_to) {
      return json({ is_vip: false, transfer_number: null });
    }
    const caller = nat(from);
    const list = Array.isArray(clinic.vip_numbers) ? clinic.vip_numbers : [];
    const isVip = caller.length === 10 && list.some((n) => nat(n) === caller);
    return json({
      is_vip: isVip,
      transfer_number: isVip ? clinic.vip_transfer_to : null,
    });
  } catch {
    // Never block a call on our lookup — default to "not VIP" (AI handles it).
    return json({ is_vip: false, transfer_number: null });
  }
};

/** Find the clinic for this call by agent id first, then the dialed number. */
async function resolveClinic(agentId, toNumber) {
  const cols = "select=id,retell_number,vip_enabled,vip_transfer_to,vip_numbers";
  if (agentId) {
    const byAgent = await sbSelect(
      "clinics",
      `${cols}&retell_agent_id=eq.${encodeURIComponent(agentId)}&limit=1`
    );
    if (byAgent[0]) return byAgent[0];
  }
  if (toNumber) {
    const want = nat(toNumber);
    if (want.length === 10) {
      const rows = await sbSelect(
        "clinics",
        `${cols}&retell_number=not.is.null`
      );
      const match = rows.find((c) => nat(c.retell_number) === want);
      if (match) return match;
    }
  }
  return null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
