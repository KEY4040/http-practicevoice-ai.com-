import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPayload,
  cleanScript,
  hasGemini,
  RECEPTIONIST_SYSTEM_INSTRUCTION,
} from "../netlify/shared/gemini.mjs";

// The generator's request shape and output cleanup are pinned here: if the
// system instruction, payload field names, or fence-stripping drift, the
// script writer silently degrades. Network calls aren't exercised (no key).

test("system instruction carries every required directive", () => {
  const s = RECEPTIONIST_SYSTEM_INSTRUCTION;
  assert.match(s, /third person/i);
  assert.match(s, /warm greeting/i);
  assert.match(s, /name, phone number, and reason/i);
  assert.match(s, /booking or taking a message/i);
  assert.match(s, /confirm the caller's details/i);
  assert.match(s, /Output ONLY the raw script/i);
});

test("buildPayload nests system instruction + user content correctly", () => {
  const p = buildPayload({ businessName: "Bayview Dental", industry: "Dental" });
  assert.equal(p.systemInstruction.parts[0].text, RECEPTIONIST_SYSTEM_INSTRUCTION);
  assert.equal(p.contents[0].role, "user");
  assert.equal(
    p.contents[0].parts[0].text,
    "Business Name: Bayview Dental\nIndustry: Dental"
  );
  assert.ok(p.generationConfig.maxOutputTokens > 0);
});

test("cleanScript strips a wrapping markdown fence but keeps inner text", () => {
  assert.equal(cleanScript("```\nHello world\n```"), "Hello world");
  assert.equal(cleanScript("```text\nLine one\nLine two\n```"), "Line one\nLine two");
  // Unfenced text is returned as-is (trimmed).
  assert.equal(cleanScript("  Just a script.  "), "Just a script.");
});

test("hasGemini reflects the env key", () => {
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  assert.equal(hasGemini(), false);
  process.env.GEMINI_API_KEY = "test_key";
  assert.equal(hasGemini(), true);
  if (prev === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = prev;
});
