import { test } from "node:test";
import assert from "node:assert/strict";
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { credentialUserLine } from "./credential-use";

const credential = {
  id: "c1",
  type_api_name: "vendor_credential",
  name: "Wave",
  status: "active",
  data: {},
  lines: [
    { id: "l1", line_group: "users", data: { user_id: "agent-a" } },
    { id: "l2", line_group: "users", data: { user_id: " agent-b " } },
    { id: "l3", line_group: "users", data: { user_id: "" } },
  ],
} as unknown as RecordInstance;

test("only a user named on a Users line may use the Credential", () => {
  assert.equal(credentialUserLine(credential, "agent-a")?.id, "l1");
  assert.equal(credentialUserLine(credential, "agent-b")?.id, "l2");
  assert.equal(credentialUserLine(credential, "agent-c"), null);
  assert.equal(credentialUserLine(credential, ""), null, "an empty line never matches an empty id");
  assert.equal(credentialUserLine({ ...credential, lines: undefined } as RecordInstance, "agent-a"), null);
});
