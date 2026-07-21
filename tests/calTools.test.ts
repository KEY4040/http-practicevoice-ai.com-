import { test } from "node:test";
import assert from "node:assert/strict";
import { calTools } from "../netlify/shared/retell-api.mjs";

// Locks the exact Retell general_tools schema for Cal.com booking (verified
// against Retell's SDK): type/name/cal_api_key/event_type_id required, timezone
// optional. If a field name drifts, provisioning silently stops booking — so
// pin it here.

test("calTools: empty when no calendar is connected", () => {
  assert.deepEqual(calTools({}), []);
  assert.deepEqual(calTools({ cal_api_key: "cal_x" }), []); // needs event id too
  assert.deepEqual(calTools({ cal_event_type_id: 123 }), []); // needs key too
});

test("calTools: builds both tools with the exact field names", () => {
  const tools = calTools({
    cal_api_key: "cal_live_abc",
    cal_event_type_id: 6387849,
    cal_timezone: "America/New_York",
  });
  assert.equal(tools.length, 2);
  const check = tools.find((t) => t.type === "check_availability_cal");
  const book = tools.find((t) => t.type === "book_appointment_cal");
  assert.ok(check && book, "both tool types present");
  for (const t of tools) {
    assert.equal(t.name, t.type, "name mirrors the tool type");
    assert.equal(t.cal_api_key, "cal_live_abc");
    assert.equal(t.event_type_id, 6387849);
    assert.equal(typeof t.event_type_id, "number");
    assert.equal(t.timezone, "America/New_York");
  }
});

test("calTools: coerces a string event id to a number and omits timezone when unset", () => {
  const [check] = calTools({ cal_api_key: "cal_x", cal_event_type_id: "6387849" });
  assert.equal(check.event_type_id, 6387849);
  assert.equal(typeof check.event_type_id, "number");
  assert.equal("timezone" in check, false);
});
