import test from "node:test";
import assert from "node:assert/strict";
import { clamp, pinnedProgress, stageIndex, stageScrollTarget } from "../src/lib/geometry.ts";

const header = 80;
const height = 3150;
const stage = 820;
const travel = height - stage;
/** Section top (viewport px) for normalized progress p. */
const topAt = (p: number): number => header - p * travel;

test("pinned progress is measured below the header and clamped", () => {
  assert.equal(pinnedProgress(500, height, stage, header), 0);
  assert.equal(pinnedProgress(topAt(0), height, stage, header), 0);
  assert.equal(pinnedProgress(topAt(0.5), height, stage, header), 0.5);
  assert.equal(pinnedProgress(topAt(1), height, stage, header), 1);
  assert.equal(pinnedProgress(-9000, height, stage, header), 1);
  assert.equal(pinnedProgress(0, 500, 820, 80), 1, "A section shorter than its stage never divides by zero or less.");
  assert.equal(clamp(Number.NaN, 2, 5), 2);
});

test("three equal reading stages: entry shows the first, completion the last", () => {
  const at = (p: number) => stageIndex(pinnedProgress(topAt(p), height, stage, header), 3);
  assert.equal(at(0), 0);
  assert.equal(at(1 / 3 - 0.001), 0);
  assert.equal(at(1 / 3 + 0.001), 1);
  assert.equal(at(2 / 3 - 0.001), 1);
  assert.equal(at(2 / 3 + 0.001), 2);
  assert.equal(at(1), 2);
  assert.equal(stageIndex(Number.NaN, 3), 0);
});

test("reverse scrolling walks back through the same stages", () => {
  const forward: number[] = [];
  for (let p = 0; p <= 1.0001; p += 0.05)
    forward.push(stageIndex(pinnedProgress(topAt(p), height, stage, header), 3));
  const backward: number[] = [];
  for (let p = 1; p >= -0.0001; p -= 0.05)
    backward.push(stageIndex(pinnedProgress(topAt(p), height, stage, header), 3));
  assert.deepEqual(backward, [...forward].reverse());
  assert.deepEqual([...new Set(backward)], [2, 1, 0]);
});

test("selector destinations land in the middle of each speaker's interval", () => {
  const scrollY = 6000;
  const top = 1400;
  const targets = [0, 1, 2].map((index) =>
    stageScrollTarget(index, 3, { scrollY, top, height, stageHeight: stage, headerHeight: header, maxScroll: 20000 }),
  );
  const sectionStart = scrollY + top - header;
  [travel / 6, travel / 2, (travel * 5) / 6].forEach((offset, index) =>
    assert.ok(Math.abs(targets[index]! - (sectionStart + offset)) < 1e-6),
  );
  targets.forEach((target, index) => {
    const topThere = top - (target - scrollY);
    const p = pinnedProgress(topThere, height, stage, header);
    assert.equal(stageIndex(p, 3), index);
    assert.ok(Math.abs(p - (2 * index + 1) / 6) < 1e-9);
  });
  assert.equal(
    stageScrollTarget(2, 3, { scrollY, top, height, stageHeight: stage, headerHeight: header, maxScroll: 7000 }),
    7000,
    "Destinations stay within the page.",
  );
  assert.equal(
    stageScrollTarget(0, 3, { scrollY: 0, top: -500, height, stageHeight: stage, headerHeight: header, maxScroll: 7000 }),
    0,
  );
});
