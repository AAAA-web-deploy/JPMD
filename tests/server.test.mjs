import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseRange, resolvePublicFile, securityHeaders } from "../server.ts";

test("byte ranges support media seeking and reject unsatisfiable requests", () => {
  assert.equal(parseRange(undefined, 100), null);
  assert.deepEqual(parseRange("bytes=0-", 100), { start: 0, end: 99 });
  assert.deepEqual(parseRange("bytes=10-19", 100), { start: 10, end: 19 });
  assert.deepEqual(parseRange("bytes=90-500", 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange("bytes=-30", 100), { start: 70, end: 99 });
  assert.equal(parseRange("bytes=100-", 100), "invalid");
  assert.equal(parseRange("bytes=20-10", 100), "invalid");
  assert.equal(parseRange("bytes=-0", 100), "invalid");
  assert.equal(parseRange("bytes=0-1,5-6", 100), "invalid");
  assert.equal(parseRange("items=0-1", 100), "invalid");
});

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
  await mkdir(path.join(root, "videos"));
  await writeFile(path.join(root, "videos/hero.mp4"), "mp4");
  await writeFile(path.join(root, "videos/hero.webm"), "webm");
  try {
    const index = await resolvePublicFile(root, "/");
    assert.equal(index.status, 200);
    assert.equal(index.type, "text/html; charset=utf-8");
    assert.equal(index.cache, "no-cache");
    const js = await resolvePublicFile(root, "/assets/app-123.js?v=1", "HEAD");
    assert.equal(js.status, 200);
    assert.equal(js.type, "text/javascript; charset=utf-8");
    assert.match(js.cache, /immutable/);
    const movie = await resolvePublicFile(root, "/videos/hero.mp4", "HEAD");
    assert.equal(movie.status, 200);
    assert.equal(movie.type, "video/mp4");
    assert.equal(
      (await resolvePublicFile(root, "/videos/hero.webm", "HEAD")).type,
      "video/webm",
    );
    assert.match(securityHeaders["Content-Security-Policy"], /media-src 'self'/);
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
