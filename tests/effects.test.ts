import test from "node:test";
import assert from "node:assert/strict";
import { clamp, revealProgress } from "../src/lib/geometry.ts";

test("scroll reveal is bounded and immediately complete for reduced motion", () => {
  assert.deepEqual(revealProgress(400, 2800, 1000), {
    blend: 0,
    name: 0,
    photo: 0,
  });
  assert.deepEqual(revealProgress(-1800, 2800, 1000), {
    blend: 1,
    name: 1,
    photo: 1,
  });
  assert.deepEqual(revealProgress(400, 2800, 1000, true), {
    blend: 1,
    name: 1,
    photo: 1,
  });
  assert.equal(clamp(Number.NaN, 2, 5), 2);
});
