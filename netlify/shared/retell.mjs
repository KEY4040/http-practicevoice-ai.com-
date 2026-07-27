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

// ---------------------------------------------------------------------------
// Spoken-time resolver
// ---------------------------------------------------------------------------
// The 24-hour reminder can only be scheduled when an appointment has a real
// datetime (scheduled_for). The reliable source is the Retell agent emitting
// `appointment_datetime` as a full ISO string. When it only captured spoken
// words ("Friday at 9", "tomorrow at 2pm"), parseCall leaves scheduledFor null
// and the reminder would silently never fire. resolveAppointmentWhen is the
// safety net: a CONSERVATIVE best-effort parse that returns an ISO datetime only
// when it is confident, so a reminder never fires for the wrong moment. The
// webhook alerts the owner whenever this returns null, so the booking is never
// silent.

const _WEEKDAYS = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5, sat: 6, saturday: 6,
};
const _MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function _toMinutes(t) {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Parse a clock time from spoken text. Uses explicit am/pm when present; when the
 * meridiem is missing, disambiguates a 1–11 o'clock reading by which of AM/PM
 * falls inside the clinic's opening hours — and gives up (null) when both or
 * neither fit, rather than guess. Returns { h, min } in 24h, or null.
 */
function _parseClock(text, openTime, closeTime) {
  if (/\bnoon\b/.test(text)) return { h: 12, min: 0 };
  if (/\bmidnight\b/.test(text)) return { h: 0, min: 0 };

  // Explicit meridiem wins.
  let m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/);
  if (m) {
    let h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    const pm = /p/.test(m[3]);
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
    return h > 23 || min > 59 ? null : { h, min };
  }

  // "at H(:MM)?" or a bare "H:MM" — no meridiem.
  m = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/) || text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m) {
    const h12 = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (h12 > 23 || min > 59) return null;
    if (h12 === 0 || h12 === 12 || h12 > 12) return { h: h12, min }; // already unambiguous
    const open = _toMinutes(openTime);
    const close = _toMinutes(closeTime);
    if (open == null || close == null) return null; // no hours to disambiguate
    const inRange = (x) => x >= open && x <= close;
    const amOk = inRange(h12 * 60 + min);
    const pmOk = inRange((h12 + 12) * 60 + min);
    if (amOk && !pmOk) return { h: h12, min };
    if (pmOk && !amOk) return { h: h12 + 12, min };
    return null; // ambiguous or neither — don't guess
  }
  return null;
}

/** Calendar Y/M/D (+ weekday 0–6) of an instant, read in a specific timezone. */
function _ymdInZone(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  })
    .formatToParts(date)
    .reduce((a, p) => ((a[p.type] = p.value), a), {});
  const y = Number(parts.year);
  const mo = Number(parts.month);
  const d = Number(parts.day);
  const weekday = _WEEKDAYS[String(parts.weekday || "").toLowerCase()] ??
    new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return { y, m: mo, d, weekday };
}

/** Add n calendar days to a {y,m,d}. Returns {y,m,d,weekday}. */
function _addDays(ymd, n) {
  const b = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  b.setUTCDate(b.getUTCDate() + n);
  return { y: b.getUTCFullYear(), m: b.getUTCMonth() + 1, d: b.getUTCDate(), weekday: b.getUTCDay() };
}

/** The wall-clock time (y/m/d h:min) in timezone `tz`, as a real UTC instant. */
function _zonedWallToIso(y, m, d, h, min, tz) {
  const utcGuess = Date.UTC(y, m - 1, d, h, min);
  const seen = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
    .formatToParts(new Date(utcGuess))
    .reduce((a, p) => ((a[p.type] = p.value), a), {});
  let hh = Number(seen.hour);
  if (hh === 24) hh = 0;
  const asUTC = Date.UTC(Number(seen.year), Number(seen.month) - 1, Number(seen.day), hh, Number(seen.minute), Number(seen.second));
  const instant = utcGuess - (asUTC - utcGuess);
  const dt = new Date(instant);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

/**
 * Best-effort resolve a spoken appointment time to an ISO datetime.
 *
 *   resolveAppointmentWhen("Friday at 9", callStartedAtIso, {
 *     timezone: clinic.cal_timezone, openTime: "08:00", closeTime: "17:00",
 *   }) -> "2026-01-09T14:00:00.000Z"  (or null when not confident)
 *
 * Requires a timezone, a pin-able date (today / tomorrow / a weekday / an
 * explicit month-day), and an unambiguous clock time. Returns null otherwise —
 * the caller then alerts the owner rather than dropping the booking silently.
 */
export function resolveAppointmentWhen(whenText, anchorIso, opts = {}) {
  const text = String(whenText || "").toLowerCase().trim();
  if (!text) return null;
  const tz = opts.timezone;
  if (!tz) return null; // can't place a wall-clock without a timezone
  const anchor = anchorIso ? new Date(anchorIso) : null;
  if (!anchor || Number.isNaN(anchor.getTime())) return null;

  const time = _parseClock(text, opts.openTime, opts.closeTime);
  if (!time) return null;

  const base = _ymdInZone(anchor, tz);
  let target = null;
  if (/\btoday\b/.test(text)) {
    target = { ...base };
  } else if (/\btomorrow\b/.test(text) || /\btmrw\b/.test(text)) {
    target = _addDays(base, 1);
  } else {
    const wd = text.match(/\b(sun(?:day)?|mon(?:day)?|tues?(?:day)?|wed(?:s|nesday)?|thur?s?(?:day)?|fri(?:day)?|sat(?:urday)?)\b/);
    if (wd) {
      const target0 = _WEEKDAYS[wd[1]];
      if (target0 == null) return null;
      let diff = (target0 - base.weekday + 7) % 7;
      if (/\bnext\b/.test(text)) diff = diff === 0 ? 7 : diff + 7;
      target = _addDays(base, diff);
    } else {
      const nameM = text.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
      const numM = text.match(/\b(\d{1,2})\/(\d{1,2})\b/);
      if (nameM) {
        const mo = _MONTHS[nameM[1]];
        const d = Number(nameM[2]);
        if (mo && d >= 1 && d <= 31) target = { y: base.y, m: mo, d };
      } else if (numM) {
        const mo = Number(numM[1]);
        const d = Number(numM[2]);
        if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) target = { y: base.y, m: mo, d };
      }
    }
  }
  if (!target) return null;

  const iso = _zonedWallToIso(target.y, target.m, target.d, time.h, time.min, tz);
  if (!iso) return null;
  // Appointments are in the future; never emit a reminder time at/before the call.
  if (new Date(iso).getTime() <= anchor.getTime()) return null;
  return iso;
}
