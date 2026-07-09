/**
 * Retell webhook helpers: signature verification + turning a Retell `call`
 * object into the rows we store. Kept separate from the function handler so the
 * mapping is easy to reason about (and unit-test).
 */
import crypto from "node:crypto";

/**
 * Verify a Retell webhook signature. Retell signs the raw request body with your
 * API key using HMAC-SHA256 (hex). Returns true when it matches.
 */
export function verifySignature(rawBody, signature, apiKey) {
  if (!apiKey || !signature) return false;
  const expected = crypto
    .createHmac("sha256", apiKey)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
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

  const booked =
    custom.appointment_booked === true ||
    (!inVoicemail && /\b(book|booked|schedul|appointment (?:is )?(?:set|confirmed))/i.test(summary));
  const escalated =
    custom.escalated === true ||
    custom.urgent === true ||
    /\b(emergency|urgent|escalat|on-call|severe pain)\b/i.test(summary);

  let outcome;
  if (escalated) outcome = "escalated";
  else if (booked) outcome = "booked";
  else if (inVoicemail || (durationSec < 8 && transcript.length <= 1)) outcome = "missed";
  else outcome = "info";

  const apptType = (custom.appointment_type || custom.service || "").toString().trim();
  const apptWhenText = (custom.appointment_time || "").toString().trim();
  const scheduledFor =
    parseDate(custom.appointment_datetime) || parseDate(custom.appointment_time);
  const hasAppointment = booked || Boolean(apptType || scheduledFor || apptWhenText);

  const patientName =
    (custom.patient_name || custom.caller_name || "").toString().trim() || null;
  const patientPhone = call.from_number || null;

  // Revenue: explicit value wins; otherwise fall back to a flat per-booking
  // estimate if the operator set DEFAULT_BOOKING_VALUE.
  const explicit = Number(custom.revenue ?? custom.estimated_value);
  const fallback = Number(opts.defaultBookingValue);
  let revenue = 0;
  if (Number.isFinite(explicit) && explicit > 0) revenue = explicit;
  else if ((outcome === "booked" || (escalated && hasAppointment)) && Number.isFinite(fallback))
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
