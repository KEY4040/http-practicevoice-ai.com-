import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasActiveAccess,
  trialDaysLeft,
  TRIAL_DAYS,
} from "../src/lib/subscription";

test("hasActiveAccess: trialing/active/past_due grant access", () => {
  for (const status of ["trialing", "active", "past_due"]) {
    assert.equal(hasActiveAccess({ status, plan: null, current_period_end: null }), true);
  }
});

test("hasActiveAccess: canceled/incomplete/null do NOT grant access", () => {
  for (const status of ["canceled", "incomplete", "unpaid", "incomplete_expired"]) {
    assert.equal(hasActiveAccess({ status, plan: null, current_period_end: null }), false);
  }
  assert.equal(hasActiveAccess(null), false);
});

test("trialDaysLeft: full window right after signup", () => {
  const now = new Date("2026-07-13T00:00:00Z");
  assert.equal(trialDaysLeft(now.toISOString(), now), TRIAL_DAYS);
});

test("trialDaysLeft: 0 once the trial has elapsed", () => {
  const created = new Date("2026-07-01T00:00:00Z");
  const now = new Date("2026-07-20T00:00:00Z"); // 19 days later
  assert.equal(trialDaysLeft(created.toISOString(), now), 0);
});

test("trialDaysLeft: counts down mid-trial", () => {
  const created = new Date("2026-07-13T00:00:00Z");
  const now = new Date("2026-07-17T00:00:00Z"); // 4 days in
  assert.equal(trialDaysLeft(created.toISOString(), now), TRIAL_DAYS - 4);
});

test("trialDaysLeft: missing/invalid date never locks the user out", () => {
  assert.equal(trialDaysLeft(null), TRIAL_DAYS);
  assert.equal(trialDaysLeft("not-a-date"), TRIAL_DAYS);
});
