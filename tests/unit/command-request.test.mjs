import test from "node:test";
import assert from "node:assert/strict";
import { sendCommand } from "../../src/lib/command-request.mjs";

for (const body of [null, [], {}, { data: [] }, { data: null }, { data: "saved" }]) {
  test(`does not confirm malformed response ${JSON.stringify(body)}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => Response.json(body));
    await assert.rejects(sendCommand(null, "create_workspace", {}), /not confirmed/);
  });
}
test("interrupted response is not a confirmed save", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response('{"data":'));
  await assert.rejects(sendCommand(null, "create_workspace", {}), /interrupted/);
});
test("HTTP errors preserve the server message", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Stale version" }, { status: 409 }),
  );
  await assert.rejects(sendCommand(null, "save_response", {}), /Stale version/);
});
test("valid result is returned and request ID is preserved", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(JSON.parse(options.body).payload.request_id, "retry-id");
    return Response.json({ data: { id: "created-id" } });
  });
  assert.deepEqual(await sendCommand(null, "create_workspace", { request_id: "retry-id" }), {
    id: "created-id",
  });
});
