import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { createDownloadTicket, validDownloadTicket } from "./index.js";

const secret = "a".repeat(64);
const session = "b".repeat(64);
const cookie = `__Host-mc_delivery=${session}`;
const fixture = new TextEncoder().encode("%PDF-1.7\nprivate QA fixture\n%%EOF");
const origin = "https://store.example";
function environment() {
  const records = [];
  let approved = true;
  const sessions = new Set([session]);
  const env = {
    DELIVERY_SERVICE_SECRET: secret,
    MATERIAL: {
      head: async () => ({ size: fixture.length }),
      get: async () => ({ body: fixture, size: fixture.length }),
    },
    JOTAFY: {
      fetch: async (request) => {
        assert.equal(request.headers.get("authorization"), `Bearer ${secret}`);
        const input = await request.json();
        if (input.action === "record") {
          records.push(input.event);
          return Response.json({ recorded: true });
        }
        if (input.action === "redeem") {
          sessions.add(input.session);
          return Response.json({ status: "approved", session: input.session });
        }
        return Response.json({
          status:
            approved && sessions.has(input.session)
              ? "approved"
              : "unconfirmed",
        });
      },
    },
    ASSETS: { fetch: async () => new Response("static asset") },
  };
  const waits = [];
  const ctx = { waitUntil: (promise) => waits.push(promise) };
  const call = (path, options = {}) =>
    worker.fetch(new Request(origin + path, options), env, ctx);
  return {
    env,
    ctx,
    call,
    records,
    waits,
    refund: () => {
      approved = false;
    },
  };
}
test("download tickets expire, cannot be tampered with, and are bound to the customer's cookie", async () => {
  const env = { DELIVERY_SERVICE_SECRET: secret };
  const now = 1_800_000_000_000;
  const ticket = await createDownloadTicket(env, session, now);
  assert.equal(
    await validDownloadTicket(env, ticket, session, now + 59000),
    true,
  );
  assert.equal(
    await validDownloadTicket(env, ticket, session, now + 61000),
    false,
  );
  assert.equal(
    await validDownloadTicket(env, ticket, "c".repeat(64), now),
    false,
  );
  assert.equal(
    await validDownloadTicket(env, ticket + "tamper", session, now),
    false,
  );
});
test("anonymous visits and forged approval parameters never expose the private PDF", async () => {
  const { call } = environment();
  const status = await call("/api/delivery/status?paid=true&order=approved");
  assert.deepEqual(await status.json(), {
    status: "unconfirmed",
    ready: false,
  });
  const ticket = await call("/api/delivery/ticket", {
    method: "POST",
    headers: { origin },
  });
  assert.equal(ticket.status, 403);
  assert.equal((await call("/api/delivery/file?ticket=forged")).status, 403);
});
test("authorized download streams bytes as an attachment and refunds revoke even an unexpired ticket", async () => {
  const { call, waits, records, refund } = environment();
  const initialized = await call("/api/delivery/status");
  const initializedCookie = initialized.headers.get("set-cookie");
  assert.match(
    initializedCookie,
    /^__Host-mc_delivery=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure$/,
  );
  const access = await call("/api/delivery/access", {
    method: "POST",
    headers: {
      origin,
      cookie: initializedCookie.split(";")[0],
      "content-type": "application/json",
    },
    body: JSON.stringify({ grant: "d".repeat(64) }),
  });
  assert.equal(access.headers.get("set-cookie"), initializedCookie);
  const ticket = await (
    await call("/api/delivery/ticket", {
      method: "POST",
      headers: { origin, cookie },
    })
  ).json();
  const file = await call(ticket.url, { headers: { cookie } });
  assert.equal(file.status, 200);
  assert.equal(file.headers.get("content-type"), "application/pdf");
  assert.match(file.headers.get("content-disposition"), /^attachment;/);
  assert.match(file.headers.get("cache-control"), /no-store/);
  assert.deepEqual(new Uint8Array(await file.arrayBuffer()), fixture);
  await Promise.all(waits);
  assert(records.includes("download_started"));
  refund();
  assert.equal((await call(ticket.url, { headers: { cookie } })).status, 403);
});
test("cross-origin POSTs are refused and missing services fail closed", async () => {
  const { call, env } = environment();
  assert.equal(
    (
      await call("/api/delivery/ticket", {
        method: "POST",
        headers: { origin: "https://attacker.example", cookie },
      })
    ).status,
    403,
  );
  delete env.JOTAFY;
  assert.equal(
    (await call("/api/delivery/status", { headers: { cookie } })).status,
    503,
  );
});
