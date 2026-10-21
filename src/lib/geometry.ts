export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : minimum),
  );
}

/** Progress through a pinned section: 0 when its top meets the header, 1 when its end reaches the stage. */
export function pinnedProgress(
  top: number,
  height: number,
  stageHeight: number,
  headerHeight: number,
): number {
  return clamp((headerHeight - top) / Math.max(1, height - stageHeight), 0, 1);
}

/** Equal reading intervals: the first third selects 0, the middle 1, the last third (and p = 1) the final stage. */
export function stageIndex(progress: number, stages: number): number {
  return Math.min(stages - 1, Math.floor(clamp(progress, 0, 1) * stages));
}

/** Document Y that places the pinned section at the middle of stage `index` (p = 1/6, 1/2, 5/6 for three). */
export function stageScrollTarget(
  index: number,
  stages: number,
  geometry: {
    scrollY: number;
    top: number;
    height: number;
    stageHeight: number;
    headerHeight: number;
    maxScroll: number;
  },
): number {
  const { scrollY, top, height, stageHeight, headerHeight, maxScroll } = geometry;
  const progress = (index * 2 + 1) / (stages * 2);
  return clamp(
    scrollY + top - headerHeight + progress * (height - stageHeight),
    0,
    Math.max(0, maxScroll),
  );
}
