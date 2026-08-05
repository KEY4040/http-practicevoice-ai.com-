import { test } from "node:test";
import assert from "node:assert/strict";
import { vipTransferTool } from "../netlify/shared/retell-api.mjs";

// The VIP code-word transfer tool is caller-ID-independent: it only attaches
// when VIP is on AND a transfer cell AND a passphrase are all present.

test("vipTransferTool: none of the pieces set -> no tool", () => {
  assert.deepEqual(vipTransferTool({}), []);
  assert.deepEqual(vipTransferTool(null), []);
});

test("vipTransferTool: enabled but no passphrase -> no tool", () => {
  assert.deepEqual(
    vipTransferTool({ vip_enabled: true, vip_transfer_to: "803 555 1212" }),
    []
  );
});

test("vipTransferTool: passphrase but VIP disabled -> no tool", () => {
  assert.deepEqual(
    vipTransferTool({ vip_enabled: false, vip_transfer_to: "8035551212", vip_passphrase: "blue tiger" }),
    []
  );
});

test("vipTransferTool: passphrase set but transfer cell not a valid US number -> no tool", () => {
  assert.deepEqual(
    vipTransferTool({ vip_enabled: true, vip_transfer_to: "123", vip_passphrase: "blue tiger" }),
    []
  );
});

test("vipTransferTool: fully configured -> exact Retell transfer_call schema", () => {
  const tools = vipTransferTool({
    vip_enabled: true,
    vip_transfer_to: "(803) 555-1212",
    vip_passphrase: "  blue tiger  ",
  });
  assert.equal(tools.length, 1);
  const t = tools[0];
  assert.equal(t.type, "transfer_call");
  assert.equal(t.name, "transfer_to_owner");
  // Normalized to +1 E.164, cold (blind) transfer to a fixed literal number.
  assert.deepEqual(t.transfer_destination, { type: "predefined", number: "+18035551212" });
  assert.deepEqual(t.transfer_option, { type: "cold_transfer" });
  assert.equal(typeof t.description, "string");
});
