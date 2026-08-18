import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server renders the Kemaritiman portal shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Portal Kemaritiman Polbeng<\/title>/i);
  assert.match(html, /D3 Nautika/);
  assert.match(html, /D3 KPN/);
  assert.match(html, /Panel Admin/);
});

test("portal is wired to database APIs and role authorization", async () => {
  const [page, database, authorization, hosting] = await Promise.all([
    readFile(new URL("page.tsx", import.meta.url), "utf8"),
    readFile(new URL("lib/database.ts", import.meta.url), "utf8"),
    readFile(new URL("lib/authorization.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /fetch\("\/api\/portal"/);
  assert.match(page, /fetch\("\/api\/me"/);
  assert.match(database, /CREATE TABLE IF NOT EXISTS users/);
  assert.match(database, /CREATE TABLE IF NOT EXISTS kpis/);
  assert.match(authorization, /requireRoles/);
  assert.deepEqual(JSON.parse(hosting), { d1: "DB", r2: null });
});
