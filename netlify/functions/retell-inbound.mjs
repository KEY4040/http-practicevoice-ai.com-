/**
 * Netlify Function: retell-inbound
 * ---------------------------------------------------------------------------
 * Retell's INBOUND CALL WEBHOOK. Fires the instant a call reaches a customer's
 * number, BEFORE the agent says anything — the deterministic place to decide
 * VIP routing (an LLM-triggered function runs too late for that).
 *
 * Set this as the phone number's "Inbound webhook" in Retell:
 *   https://practicevoice-ai.com/.netlify/functions/retell-inbound
 *
 * Retell POSTs (docs: features/inbound-call-webhook):
 *   { "event": "call_inbound",
 *     "call_inbound": { "agent_id", "agent_version", "from_number", "to_number" } }
 *
 * We look up the clinic by the DIALED number, check the caller against the VIP
 * list, and respond within 10s with:
 *   { "call_inbound": {
 *       "dynamic_variables": { "is_vip": "true"|"false", "vip_cell": "+1..." },
 *       "override_agent_id": "<VIP transfer agent>"   // only if configured
 *   } }
 * All dynamic_variables values MUST be strings (Retell requirement).
 *
 * The agent uses {{is_vip}} / {{vip_cell}} to transfer VIPs immediately. If
 * VIP_TRANSFER_AGENT_ID is set, VIP calls are additionally routed to that
 * dedicated transfer-only agent (fully deterministic — no LLM judgment).
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VIP_TRANSFER_AGENT_ID (optional)
 */
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";
import { verifySignature } from "../shared/retell.mjs";

const nat = (s) => String(s || "").replace(/\D/g, "").slice(-10);
// Normalize any way a customer typed their cell into valid +1 E.164 so a typo
// (missing +1, spaces, dashes, a stray digit) can never break their transfers.
const toE164 = (s) => {
  const ten = nat(s);
  return ten.length === 10 ? `+1${ten}` : "";
};

export default async (req) => {
  if (req.method !== "POST") return json({ call_inbound: {} }, 405);

  // Read the RAW body first — the signature is computed over these exact bytes.
  const raw = await req.text();

  // Default: not a VIP — the normal AI receptionist handles the call. This is
  // also the SAFE response we return whenever the request can't be authenticated,
  // so the owner's private cell is never handed to an unauthenticated caller.
  const safe = { dynamic_variables: { is_vip: "false", vip_cell: "" } };

  // Authenticate: this endpoint returns the owner's transfer cell, so it must
  // only answer genuine Retell requests. Retell signs webhooks with
  // x-retell-signature (HMAC-SHA256). On any failure we fall through to `safe` —
  // never an error (the call must still connect) and never the cell.
  const apiKey = process.env.RETELL_API_KEY;
  const signature =
    req.headers.get("x-retell-signature") || req.headers.get("x-retell-signature-256");
  const authed = Boolean(apiKey && signature && verifySignature(raw, signature, apiKey));

  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ call_inbound: safe });
  }

  if (!authed) {
    if (!apiKey) console.error("[retell-inbound] RETELL_API_KEY not set — treating call as non-VIP.");
    return json({ call_inbound: safe });
  }

  const inb = body.call_inbound || body.data || body;
  const from = inb.from_number || body.from_number;
  const to = inb.to_number || body.to_number;
  const agentId = inb.agent_id || body.agent_id;

  const out = { ...safe };

  try {
    if (hasSupabase() && from && (to || agentId)) {
      const clinic = await resolveClinic(agentId, to);
      if (clinic && clinic.vip_enabled && clinic.vip_transfer_to) {
        const caller = nat(from);
        const list = Array.isArray(clinic.vip_numbers) ? clinic.vip_numbers : [];
        const isVip = caller.length === 10 && list.some((n) => nat(n) === caller);
        if (isVip) {
          out.dynamic_variables = { is_vip: "true", vip_cell: toE164(clinic.vip_transfer_to) };
          // Optional hard route: send VIPs to a dedicated transfer-only agent so
          // the passthrough never depends on the main agent's judgment.
          if (process.env.VIP_TRANSFER_AGENT_ID) {
            out.override_agent_id = process.env.VIP_TRANSFER_AGENT_ID;
          }
        }
      }
    }
  } catch {
    // Never block a call on our lookup — fall through as a normal (non-VIP) call.
  }

  return json({ call_inbound: out });
};

/**
 * Find the clinic for this call — by agent id first (a targeted, indexed lookup),
 * falling back to the dialed number. The agent-id path avoids scanning every
 * clinic on the common case.
 */
async function resolveClinic(agentId, to) {
  const cols = "select=id,retell_number,vip_enabled,vip_transfer_to,vip_numbers";
  if (agentId) {
    const byAgent = await sbSelect(
      "clinics",
      `${cols}&retell_agent_id=eq.${encodeURIComponent(agentId)}&limit=1`
    );
    if (byAgent[0]) return byAgent[0];
  }
  const want = nat(to);
  if (want.length === 10) {
    const rows = await sbSelect("clinics", `${cols}&retell_number=not.is.null`);
    return rows.find((c) => nat(c.retell_number) === want) || null;
  }
  return null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
