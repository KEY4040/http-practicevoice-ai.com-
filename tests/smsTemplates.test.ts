import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderTemplate,
  sampleVars,
  DEFAULT_CONFIRMATION_TEMPLATE,
} from "../src/lib/smsTemplates";

test("renderTemplate: fills known tokens", () => {
  const out = renderTemplate("Hi {{patient_name}} at {{clinic_name}}", {
    patient_name: "Sam",
    clinic_name: "Acme",
  });
  assert.equal(out, "Hi Sam at Acme");
});

test("renderTemplate: leaves unknown tokens untouched", () => {
  assert.equal(renderTemplate("Hi {{unknown}}", {}), "Hi {{unknown}}");
});

test("renderTemplate: tolerates spaces in tokens", () => {
  assert.equal(renderTemplate("{{ name }}", { name: "X" }), "X");
});

test("default confirmation renders with no leftover tokens", () => {
  const out = renderTemplate(DEFAULT_CONFIRMATION_TEMPLATE, sampleVars("Bayview Dental"));
  assert.ok(!out.includes("{{"), "no unfilled tokens remain");
  assert.ok(out.includes("Bayview Dental"));
});
