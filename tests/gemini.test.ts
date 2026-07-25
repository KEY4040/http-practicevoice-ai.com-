import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPayload,
  buildUserContent,
  cleanScript,
  hasGemini,
  pickModelName,
  RECEPTIONIST_SYSTEM_INSTRUCTION,
} from "../netlify/shared/gemini.mjs";
import { hasClaude } from "../netlify/shared/claude.mjs";

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
  // Relaxed: tolerate no newline after the opening fence and trailing whitespace.
  assert.equal(cleanScript("```text Line one\nLine two```"), "Line one\nLine two");
  assert.equal(cleanScript("```\nHello\n```   "), "Hello");
  // Unfenced text is returned as-is (trimmed), and inner backticks are preserved.
  assert.equal(cleanScript("  Just a script.  "), "Just a script.");
  assert.equal(cleanScript("Use `code` inline."), "Use `code` inline.");
});

test("pickModelName prefers a generateContent flash model and strips the prefix", () => {
  const models = [
    { name: "models/embedding-001", supportedGenerationMethods: ["embedContent"] },
    { name: "models/gemini-1.5-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.0-pro", supportedGenerationMethods: ["generateContent"] },
  ];
  assert.equal(pickModelName(models), "gemini-2.0-flash");
  // Falls back to any generateContent model when no flash is present.
  assert.equal(
    pickModelName([{ name: "models/gemini-2.0-pro", supportedGenerationMethods: ["generateContent"] }]),
    "gemini-2.0-pro"
  );
  // Ignores models that can't generateContent; null when none qualify.
  assert.equal(
    pickModelName([{ name: "models/embedding-001", supportedGenerationMethods: ["embedContent"] }]),
    null
  );
  assert.equal(pickModelName([]), null);
  assert.equal(pickModelName(undefined), null);
});

test("buildUserContent includes services and hours only when present", () => {
  assert.equal(
    buildUserContent({ businessName: "Bayview Dental", industry: "Dental" }),
    "Business Name: Bayview Dental\nIndustry: Dental"
  );
  assert.equal(
    buildUserContent({
      businessName: "Dixon HVAC",
      industry: "HVAC",
      services: ["Repair", "Install", ""],
      hours: "Mon, Tue, 9–5",
    }),
    "Business Name: Dixon HVAC\nIndustry: HVAC\nServices offered: Repair, Install\nHours: Mon, Tue, 9–5"
  );
});

test("hasClaude reflects the ANTHROPIC_API_KEY env", () => {
  const prev = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal(hasClaude(), false);
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  assert.equal(hasClaude(), true);
  if (prev === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = prev;
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
