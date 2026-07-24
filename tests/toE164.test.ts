import { test } from "node:test";
import assert from "node:assert/strict";
import { toE164 } from "../netlify/shared/sms.mjs";

test("toE164: formats a US 10-digit number", () => {
  assert.equal(toE164("(415) 555-0100"), "+14155550100");
  assert.equal(toE164("415-555-0100"), "+14155550100");
  assert.equal(toE164("4155550100"), "+14155550100");
});

test("toE164: handles a leading US country code", () => {
  assert.equal(toE164("1 415 555 0100"), "+14155550100");
  assert.equal(toE164("+1 (415) 555-0100"), "+14155550100");
});

test("toE164: passes through already-valid E.164", () => {
  assert.equal(toE164("+14155550100"), "+14155550100");
  assert.equal(toE164("+442071838750"), "+442071838750");
});

test("toE164: leaves un-normalizable input unchanged (Twilio rejects, we log)", () => {
  assert.equal(toE164("12345"), "12345");
  assert.equal(toE164(""), "");
});
