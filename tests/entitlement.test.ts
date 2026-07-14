import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allowanceMinutes,
  planKeyFromName,
  PLAN_MINUTES,
  TRIAL_MINUTES,
} from "../netlify/shared/entitlement.mjs";

test("planKeyFromName maps nicknames to plan keys", () => {
  assert.equal(planKeyFromName("Premium (4-day tester)"), "premium");
  assert.equal(planKeyFromName("Professional"), "professional");
  assert.equal(planKeyFromName("Pro"), "professional");
  assert.equal(planKeyFromName("Basic"), "basic");
  assert.equal(planKeyFromName(null), "basic"); // safe default
});

test("allowance: trialing (paid $9.99 trial) is capped at 60 min", () => {
  assert.equal(allowanceMinutes({ status: "trialing", plan: null }), TRIAL_MINUTES);
});

test("allowance: active plans get their bucket", () => {
  assert.equal(allowanceMinutes({ status: "active", plan: "Basic" }), PLAN_MINUTES.basic);
  assert.equal(allowanceMinutes({ status: "active", plan: "Professional" }), PLAN_MINUTES.professional);
  assert.equal(allowanceMinutes({ status: "active", plan: "Premium" }), PLAN_MINUTES.premium);
});

test("allowance: tester gets full Premium bucket regardless of status", () => {
  assert.equal(allowanceMinutes({ status: "trialing", plan: null, tester_days: 4 }), PLAN_MINUTES.premium);
});

test("allowance: canceled / none get 0 (no live line)", () => {
  assert.equal(allowanceMinutes({ status: "canceled", plan: "Premium" }), 0);
  assert.equal(allowanceMinutes(null), 0);
});
