import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifySignature, parseCall } from "../netlify/shared/retell.mjs";

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
