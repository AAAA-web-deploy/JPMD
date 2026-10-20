import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolvePublicFile, securityHeaders } from "../server.ts";

test("production resolver serves assets and protects the source tree without opening a listener", async (t) => {
  const folder = await mkdtemp(path.join(tmpdir(), "shiba-codebase-test-"));
  const root = path.join(folder, "dist");
  await mkdir(root);
  await mkdir(path.join(root, "assets"));
  await writeFile(path.join(root, "index.html"), "<h1>Shiba</h1>");
  await writeFile(
    path.join(root, "assets/app-123.js"),
    "export const ready=true;",
  );
  await writeFile(path.join(folder, "private.txt"), "private");
  try {
    const index = await resolvePublicFile(root, "/");
    assert.equal(index.status, 200);
    assert.equal(index.type, "text/html; charset=utf-8");
    assert.equal(index.cache, "no-cache");
    const js = await resolvePublicFile(root, "/assets/app-123.js?v=1", "HEAD");
    assert.equal(js.status, 200);
    assert.equal(js.type, "text/javascript; charset=utf-8");
    assert.match(js.cache, /immutable/);
    assert.equal((await resolvePublicFile(root, "/missing.png")).status, 404);
    assert.equal(
      (await resolvePublicFile(root, "/%2e%2e/private.txt")).status,
      404,
    );
    assert.equal((await resolvePublicFile(root, "/.env")).status, 404);
    assert.equal((await resolvePublicFile(root, "/%00")).status, 400);
    assert.equal((await resolvePublicFile(root, "/%zz")).status, 400);
    assert.equal((await resolvePublicFile(root, "/", "POST")).status, 405);
    assert.match(
      securityHeaders["Content-Security-Policy"],
      /img-src 'self' blob: data:/,
    );
    try {
      await symlink(
        path.join(folder, "private.txt"),
        path.join(root, "escape.txt"),
      );
      assert.equal((await resolvePublicFile(root, "/escape.txt")).status, 404);
    } catch (error) {
      if (error.code === "EPERM")
        t.diagnostic("Symlink test skipped: OS permission unavailable.");
      else throw error;
    }
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
