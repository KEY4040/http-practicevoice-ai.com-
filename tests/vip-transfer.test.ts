import { test } from "node:test";
import assert from "node:assert/strict";
import { vipTransfer, vipTransferTool } from "../netlify/shared/retell-api.mjs";

// vipTransfer is the SINGLE gate both the transfer tool and the buildPrompt
// directive use, so they can never diverge (a prompt naming a tool the agent
// lacks, or vice-versa). These cases lock that shared contract.

test("vipTransfer: off unless enabled + valid cell + passphrase", () => {
  assert.deepEqual(vipTransfer({}), { cell: "", passphrase: "" });
  assert.deepEqual(vipTransfer({ vip_enabled: true, vip_passphrase: "blue tiger" }), { cell: "", passphrase: "" });
  assert.deepEqual(vipTransfer({ vip_enabled: true, vip_transfer_to: "(803) 555-1212" }), { cell: "", passphrase: "" });
});

test("vipTransfer: invalid cell -> OFF (this was the prompt/tool divergence bug)", () => {
  // A non-empty but unnormalizable cell ("123") must turn the WHOLE feature off,
  // not just the tool — otherwise the prompt would tell the agent to use a tool
  // it doesn't have. Both the tool and the directive read this one result.
  assert.deepEqual(
    vipTransfer({ vip_enabled: true, vip_transfer_to: "123", vip_passphrase: "blue tiger" }),
    { cell: "", passphrase: "" }
  );
});

test("vipTransfer: fully set -> normalized cell + trimmed passphrase", () => {
  assert.deepEqual(
    vipTransfer({ vip_enabled: true, vip_transfer_to: "(803) 555-1212", vip_passphrase: "  blue tiger  " }),
    { cell: "+18035551212", passphrase: "blue tiger" }
  );
});

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
