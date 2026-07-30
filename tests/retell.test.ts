import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifySignature, parseCall, resolveAppointmentWhen, placeLocalDatetime } from "../netlify/shared/retell.mjs";

const KEY = "key_test_abc";
const body = JSON.stringify({ event: "call_analyzed", call: { call_id: "c1" } });

function sign(b: string, ts: number, key = KEY) {
  const d = crypto.createHmac("sha256", key).update(b + ts).digest("hex");
  return `v=${ts},d=${d}`;
}

test("verifySignature: accepts a correctly-signed webhook", () => {
  const ts = Date.now();
  assert.equal(verifySignature(body, sign(body, ts), KEY, ts), true);
});

test("verifySignature: rejects a wrong key", () => {
  const ts = Date.now();
  assert.equal(verifySignature(body, sign(body, ts, "key_wrong"), KEY, ts), false);
});

test("verifySignature: rejects an expired timestamp (>5 min)", () => {
  const ts = Date.now();
  const sig = sign(body, ts - 6 * 60 * 1000);
  assert.equal(verifySignature(body, sig, KEY, ts), false);
});

test("verifySignature: rejects a tampered body", () => {
  const ts = Date.now();
  assert.equal(verifySignature(body + "x", sign(body, ts), KEY, ts), false);
});

test("verifySignature: still accepts the legacy bare-hex form", () => {
  const legacy = crypto.createHmac("sha256", KEY).update(body).digest("hex");
  assert.equal(verifySignature(body, legacy, KEY), true);
});

test("verifySignature: false when key or signature missing", () => {
  assert.equal(verifySignature(body, "", KEY), false);
  assert.equal(verifySignature(body, "v=1,d=abc", ""), false);
});

// --- parseCall: booking / outcome detection ---
function outcomeOf(summary: string, custom: Record<string, unknown> = {}) {
  return parseCall(
    {
      call_id: "x",
      transcript: "Agent: hello\nUser: I'd like to book",
      call_analysis: { call_summary: summary, custom_analysis_data: custom },
    },
    {}
  ).outcome;
}

test("parseCall: 'No problem, you're all set' counts as booked (regression)", () => {
  assert.equal(outcomeOf("No problem — you're all set for Tuesday at 10."), "booked");
});

test("parseCall: explicit confirmation is booked", () => {
  assert.equal(outcomeOf("Appointment confirmed for Friday."), "booked");
});

test("parseCall: 'unable to schedule' is NOT booked", () => {
  assert.notEqual(outcomeOf("We were unable to schedule the caller."), "booked");
});

test("parseCall: 'call back later' is NOT booked", () => {
  assert.notEqual(outcomeOf("They will call back later to book."), "booked");
});

test("parseCall: structured appointment_booked=true wins", () => {
  assert.equal(outcomeOf("caller asked questions", { appointment_booked: true }), "booked");
});

test("parseCall: emergency is escalated, 'no emergency' is not", () => {
  assert.equal(outcomeOf("Caller has severe pain, urgent."), "escalated");
  assert.notEqual(outcomeOf("No emergency, routine cleaning question."), "escalated");
});

test("parseCall: voicemail is a missed call", () => {
  const outcome = parseCall(
    { call_id: "v", call_analysis: { in_voicemail: true, custom_analysis_data: {} } },
    {}
  ).outcome;
  assert.equal(outcome, "missed");
});

test("parseCall: revenue only credited with real booking evidence", () => {
  const noBooking = parseCall(
    { call_id: "r1", call_analysis: { call_summary: "general question", custom_analysis_data: {} } },
    { defaultBookingValue: 200 }
  );
  assert.equal(noBooking.revenue, 0);
  const booked = parseCall(
    {
      call_id: "r2",
      call_analysis: {
        call_summary: "booked",
        custom_analysis_data: { appointment_booked: true, appointment_type: "Cleaning" },
      },
    },
    { defaultBookingValue: 200 }
  );
  assert.equal(booked.revenue, 200);
});

// --- resolveAppointmentWhen: spoken-time -> ISO (so the 24h reminder fires) ---
// Anchor: Monday Jan 5, 2026, 10:00 EST (America/New_York, EST = UTC-5 in Jan).
const ANCHOR = "2026-01-05T15:00:00.000Z";
const NY = { timezone: "America/New_York", openTime: "08:00", closeTime: "17:00" };

test("resolveAppointmentWhen: 'tomorrow at 2pm' -> next day 14:00 local", () => {
  assert.equal(
    resolveAppointmentWhen("tomorrow at 2pm", ANCHOR, NY),
    "2026-01-06T19:00:00.000Z"
  );
});

test("resolveAppointmentWhen: 'Friday at 9' infers AM from opening hours", () => {
  assert.equal(
    resolveAppointmentWhen("Friday at 9", ANCHOR, NY),
    "2026-01-09T14:00:00.000Z"
  );
});

test("resolveAppointmentWhen: 'today at 2' infers PM (2am is outside hours)", () => {
  assert.equal(
    resolveAppointmentWhen("today at 2", ANCHOR, NY),
    "2026-01-05T19:00:00.000Z"
  );
});

test("resolveAppointmentWhen: 'next Monday at 10:30 am' -> following week", () => {
  assert.equal(
    resolveAppointmentWhen("next Monday at 10:30 am", ANCHOR, NY),
    "2026-01-12T15:30:00.000Z"
  );
});

test("resolveAppointmentWhen: explicit month + day", () => {
  assert.equal(
    resolveAppointmentWhen("march 3 at 9", ANCHOR, NY),
    "2026-03-03T14:00:00.000Z"
  );
});

test("resolveAppointmentWhen: ambiguous hour (fits AM and PM) -> null", () => {
  // Open till 22:00, so both 10:00 and 22:00 are in range -> refuse to guess.
  assert.equal(
    resolveAppointmentWhen("at 10", ANCHOR, {
      timezone: "America/New_York",
      openTime: "08:00",
      closeTime: "22:00",
    }),
    null
  );
});

test("resolveAppointmentWhen: no timezone -> null (can't place a wall clock)", () => {
  assert.equal(resolveAppointmentWhen("Friday at 9", ANCHOR, { openTime: "08:00", closeTime: "17:00" }), null);
});

test("resolveAppointmentWhen: a time already in the past -> null", () => {
  // 9am today, but the call was at 10am -> past -> no reminder time.
  assert.equal(resolveAppointmentWhen("today at 9", ANCHOR, NY), null);
});

test("resolveAppointmentWhen: unparseable text -> null (no clock time)", () => {
  assert.equal(resolveAppointmentWhen("sometime next week", ANCHOR, NY), null);
});

// --- timezone-safe machine datetime (the reminder-timing fix) ---
test("parseCall: an offset-aware datetime is trusted as an absolute instant", () => {
  const p = parseCall(
    { call_id: "x", call_analysis: { custom_analysis_data: { appointment_booked: true, appointment_datetime: "2026-01-09T09:00:00-05:00" } } },
    {}
  );
  assert.equal(p.appointment?.scheduledFor, "2026-01-09T14:00:00.000Z");
  assert.equal(p.appointment?.datetimeLocal, null);
});

test("parseCall: a NAIVE datetime is NOT trusted (kept for tz placement)", () => {
  const p = parseCall(
    { call_id: "x", call_analysis: { custom_analysis_data: { appointment_booked: true, appointment_datetime: "2026-01-09T09:00:00" } } },
    {}
  );
  // Must not be read as UTC — left for the webhook to place in the clinic tz.
  assert.equal(p.appointment?.scheduledFor, null);
  assert.equal(p.appointment?.datetimeLocal, "2026-01-09T09:00:00");
});

test("placeLocalDatetime: naive wall-clock lands in the clinic timezone", () => {
  // 9 AM Eastern (EST, UTC-5) -> 14:00Z, not 09:00Z.
  assert.equal(placeLocalDatetime("2026-01-09T09:00", "America/New_York"), "2026-01-09T14:00:00.000Z");
  // 9 AM Pacific (PST, UTC-8) -> 17:00Z.
  assert.equal(placeLocalDatetime("2026-01-09 09:00:00", "America/Los_Angeles"), "2026-01-09T17:00:00.000Z");
  assert.equal(placeLocalDatetime("2026-01-09T09:00", ""), null);
  assert.equal(placeLocalDatetime("", "America/New_York"), null);
});
