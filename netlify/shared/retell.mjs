/**
 * Retell webhook helpers: signature verification + turning a Retell `call`
 * object into the rows we store. Kept separate from the function handler so the
 * mapping is easy to reason about (and unit-test).
 */
import crypto from "node:crypto";

/**
 * Verify a Retell webhook signature.
 *
 * Retell's `x-retell-signature` header is `v=<timestampMs>,d=<hexDigest>`, where
 * digest = HMAC-SHA256(apiKey, rawBody + String(timestampMs)) — the raw body
 * concatenated with the millisecond timestamp, NO separator — with a 5-minute
 * timestamp tolerance. (Verified against Retell's official Node/Python SDKs.)
 *
 * Falls back to the legacy bare-hex form (HMAC of just the body) if a header
 * without the `v=,d=` structure is ever received, so older setups still verify.
 */
const FIVE_MIN_MS = 5 * 60 * 1000;

export function verifySignature(rawBody, signature, apiKey, nowMs = Date.now()) {
  if (!apiKey || !signature) return false;
  const sig = String(signature);

  const m = /v=(\d+),d=(.*)/.exec(sig);
  if (m) {
    const poststamp = Number(m[1]);
    const postDigest = m[2];
    if (!Number.isFinite(poststamp)) return false;
    if (Math.abs(nowMs - poststamp) > FIVE_MIN_MS) return false; // replay guard
    return timingSafeHexEqual(
      crypto.createHmac("sha256", apiKey).update(rawBody + poststamp, "utf8").digest("hex"),
      postDigest
    );
  }

  // Legacy: header is a bare hex HMAC of the body.
  return timingSafeHexEqual(
    crypto.createHmac("sha256", apiKey).update(rawBody, "utf8").digest("hex"),
    sig
  );
}

function timingSafeHexEqual(expectedHex, gotHex) {
  const a = Buffer.from(expectedHex);
  const b = Buffer.from(String(gotHex));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function toTranscript(call) {
  if (Array.isArray(call.transcript_object) && call.transcript_object.length) {
    return call.transcript_object
      .filter((t) => t && typeof t.content === "string")
      .map((t) => ({
        speaker: t.role === "agent" || t.role === "assistant" ? "ai" : "caller",
        text: t.content.trim(),
      }));
  }
  // Fall back to parsing the flat "Agent: …\nUser: …" transcript string.
  if (typeof call.transcript === "string" && call.transcript.trim()) {
    return call.transcript
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(agent|assistant|ai|user|caller|human)\s*:\s*(.*)$/i);
        if (!m) return { speaker: "caller", text: line };
        const role = m[1].toLowerCase();
        const speaker = role === "user" || role === "caller" || role === "human" ? "caller" : "ai";
        return { speaker, text: m[2] };
      });
  }
  return [];
}

function firstSentence(text, max = 60) {
  if (!text) return "";
  const s = text.split(/[.!?\n]/)[0].trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Normalize a Retell `call` payload into the fields we persist.
 *
 * Works with zero configuration (logs every call via keyword heuristics), but
 * gets sharper when the Retell agent's Post-Call Analysis is set up to extract:
 *   appointment_booked (bool), appointment_type, provider, appointment_time,
 *   appointment_datetime (ISO), patient_name, revenue, escalated, reason
 */
export function parseCall(call, opts = {}) {
  const analysis = call.call_analysis || {};
  const custom = analysis.custom_analysis_data || {};
  const summary = (analysis.call_summary || "").trim();
  const transcript = toTranscript(call);
  const inVoicemail = analysis.in_voicemail === true;

  const startMs = Number(call.start_timestamp);
  const endMs = Number(call.end_timestamp);
  const durationSec = Number.isFinite(Number(call.duration_ms))
    ? Math.round(Number(call.duration_ms) / 1000)
    : Number.isFinite(startMs) && Number.isFinite(endMs)
      ? Math.max(0, Math.round((endMs - startMs) / 1000))
      : 0;

  // Prefer the agent's structured booleans. The keyword fallback is advisory:
  // it only fires when there's no explicit flag. We DON'T bail on a bare "no"
  // anywhere in the summary (that wrongly killed real bookings like "No problem,
  // you're all set for Tuesday") — we only bail on phrases that actually mean a
  // booking did NOT happen.
  const NO_BOOKING =
    /\b(un(?:able|available)|couldn'?t|could not|did ?n'?t\s+book|not\s+book|no\s+appointment|no\s+availability|call(?:ed)?\s+back\s+later|cancel(?:l?ed|lation)?|reschedul)\b/i;
  const booked =
    custom.appointment_booked === true ||
    (custom.appointment_booked !== false &&
      !inVoicemail &&
      /\b(booked|scheduled|all set|confirmed)\b/i.test(summary) &&
      !NO_BOOKING.test(summary));
  const NOT_URGENT = /\b(no\s+emergency|not\s+urgent|non-?urgent|routine)\b/i;
  const escalated =
    custom.escalated === true ||
    custom.urgent === true ||
    (custom.escalated !== false &&
      custom.urgent !== false &&
      /\b(emergency|urgent|escalat|on-call|severe pain)\b/i.test(summary) &&
      !NOT_URGENT.test(summary));

  let outcome;
  if (escalated) outcome = "escalated";
  else if (booked) outcome = "booked";
  else if (inVoicemail || (durationSec < 8 && transcript.length <= 1)) outcome = "missed";
  else outcome = "info";

  const apptType = (custom.appointment_type || custom.service || "").toString().trim();
  const apptWhenText = (custom.appointment_time || "").toString().trim();
  const scheduledFor =
    parseDate(custom.appointment_datetime) || parseDate(custom.appointment_time);
  // Only record an appointment when there's real evidence of one — either the
  // agent's explicit flag or actual appointment details. This prevents a stray
  // keyword match from creating a phantom appointment + confirmation text.
  const structuredBooked = custom.appointment_booked === true;
  const hasApptData = Boolean(apptType || scheduledFor || apptWhenText);
  const hasAppointment = structuredBooked || hasApptData;

  const patientName =
    (custom.patient_name || custom.caller_name || "").toString().trim() || null;
  const patientPhone = call.from_number || null;

  // Revenue: explicit value wins; otherwise fall back to a flat per-booking
  // estimate ONLY when there's genuine appointment evidence (never from a bare
  // keyword guess).
  const explicit = Number(custom.revenue ?? custom.estimated_value);
  const fallback = Number(opts.defaultBookingValue);
  let revenue = 0;
  if (Number.isFinite(explicit) && explicit > 0) revenue = explicit;
  else if (
    Number.isFinite(fallback) &&
    (structuredBooked || ((outcome === "booked" || escalated) && hasApptData))
  )
    revenue = fallback;

  return {
    retellCallId: call.call_id || null,
    agentId: call.agent_id || null,
    toNumber: call.to_number || null,
    callerPhone: patientPhone,
    callerName: patientName,
    startedAt: parseDate(startMs) || null,
    durationSec,
    outcome,
    reason:
      (custom.reason || custom.call_reason || "").toString().trim() ||
      firstSentence(summary) ||
      "Call",
    summary,
    transcript,
    revenue,
    appointment: hasAppointment
      ? {
          type: apptType || "Appointment",
          provider: (custom.provider || "").toString().trim() || "Our team",
          scheduledFor,
          whenText: apptWhenText || null,
          patientName,
          patientPhone,
        }
      : null,
  };
}
