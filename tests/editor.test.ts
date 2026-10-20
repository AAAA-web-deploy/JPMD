import test from "node:test";
import assert from "node:assert/strict";
import {
  angleFromPointer,
  defaultOverlay,
  hitOverlay,
  normalizeOverlay,
  revealProgress,
  rotationHandle,
} from "../src/lib/geometry.ts";
import { coverRect, drawScene, validatePhoto } from "../src/lib/editor.ts";

test("rotated and flipped overlay hit testing uses the same local coordinates", () => {
  const overlay = { ...defaultOverlay(), width: 300, angle: 90 };
  assert.equal(
    hitOverlay({ x: overlay.x, y: overlay.y + 120 }, overlay, 3),
    true,
  );
  assert.equal(
    hitOverlay({ x: overlay.x + 120, y: overlay.y }, overlay, 3),
    false,
  );
  assert.equal(
    hitOverlay(
      { x: overlay.x, y: overlay.y + 120 },
      { ...overlay, flipped: true },
      3,
    ),
    true,
  );
  const handle = rotationHandle({ ...overlay, angle: 0 }, 3);
  assert.deepEqual(handle, { x: 500, y: 106 });
  assert.equal(angleFromPointer({ x: 600, y: 190 }, overlay), 90);
});

test("sliders and dragging cannot create out-of-range overlay geometry", () => {
  const item = normalizeOverlay({
    ...defaultOverlay(),
    x: -99,
    y: 1200,
    width: 3000,
    angle: -200,
  });
  assert.deepEqual(
    [item.x, item.y, item.width, item.angle],
    [0, 1000, 1000, -180],
  );
  assert.equal(normalizeOverlay({ ...item, width: Number.NaN }).width, 40);
});

test("photo crop preserves the source aspect while filling a square", () => {
  assert.deepEqual(coverRect(2000, 1000), {
    x: -500,
    y: 0,
    width: 2000,
    height: 1000,
  });
  assert.deepEqual(coverRect(500, 1000), {
    x: 0,
    y: -500,
    width: 1000,
    height: 2000,
  });
  assert.throws(() => coverRect(0, 100), RangeError);
});

test("clean export drawing omits selection handles and all lettering", () => {
  const calls: string[] = [];
  const context = {
    canvas: { width: 1000, height: 1000 },
    clearRect() {
      calls.push("clear");
    },
    drawImage() {
      calls.push("image");
    },
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    setLineDash() {},
    strokeRect() {
      calls.push("selection");
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {
      calls.push("stroke");
    },
    arc() {},
    fill() {
      calls.push("handle");
    },
  } as unknown as CanvasRenderingContext2D;
  const photo = {
    naturalWidth: 1254,
    naturalHeight: 1254,
    width: 1254,
    height: 1254,
  } as HTMLImageElement;
  const ears = {
    naturalWidth: 2048,
    naturalHeight: 683,
    width: 2048,
    height: 683,
  } as HTMLImageElement;
  drawScene(context, photo, ears, [defaultOverlay()], 1, false);
  assert.deepEqual(calls, ["clear", "image", "image"]);
  calls.length = 0;
  drawScene(context, photo, ears, [defaultOverlay()], 1, true);
  assert.ok(calls.includes("selection"));
  assert.ok(calls.includes("handle"));
});

test("local upload accepts a static PNG and rejects GIF and animation containers", async () => {
  const staticPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKZkAAAAASUVORK5CYII=",
    "base64",
  );
  await assert.doesNotReject(() =>
    validatePhoto(new File([staticPng], "still.png", { type: "image/png" })),
  );
  await assert.rejects(
    () =>
      validatePhoto(new File(["GIF89a"], "moving.gif", { type: "image/gif" })),
    /static PNG/,
  );
  const animatedPng = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.from([0, 0, 0, 0]),
    Buffer.from("acTL"),
    Buffer.alloc(4),
  ]);
  await assert.rejects(
    () =>
      validatePhoto(
        new File([animatedPng], "moving.png", { type: "image/png" }),
      ),
    /Animated images/,
  );
  const animatedWebp = Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.alloc(4),
    Buffer.from("WEBPANIM"),
    Buffer.alloc(4),
  ]);
  await assert.rejects(
    () =>
      validatePhoto(
        new File([animatedWebp], "moving.webp", { type: "image/webp" }),
      ),
    /Animated images/,
  );
});

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
});
