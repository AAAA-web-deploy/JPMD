export interface Point {
  x: number;
  y: number;
}
export interface Overlay extends Point {
  id: number;
  width: number;
  angle: number;
  flipped: boolean;
  fur: string | null;
  inner: string | null;
}

export const CANVAS_SIZE = 1000;
export const MAX_OVERLAYS = 12;
export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : minimum),
  );
}
export function defaultOverlay(id = 1): Overlay {
  return {
    id,
    x: 500,
    y: 190,
    width: 660,
    angle: 0,
    flipped: false,
    fur: null,
    inner: null,
  };
}
export function localPoint(point: Point, overlay: Overlay): Point {
  const theta = (-overlay.angle * Math.PI) / 180;
  const dx = point.x - overlay.x,
    dy = point.y - overlay.y;
  return {
    x:
      (dx * Math.cos(theta) - dy * Math.sin(theta)) *
      (overlay.flipped ? -1 : 1),
    y: dx * Math.sin(theta) + dy * Math.cos(theta),
  };
}
export function hitOverlay(
  point: Point,
  overlay: Overlay,
  aspect: number,
): boolean {
  const local = localPoint(point, overlay);
  return (
    Math.abs(local.x) <= overlay.width / 2 + 12 &&
    Math.abs(local.y) <= overlay.width / aspect / 2 + 12
  );
}
export function rotationHandle(overlay: Overlay, aspect: number): Point {
  const theta = (overlay.angle * Math.PI) / 180,
    distance = overlay.width / aspect / 2 + 34;
  return {
    x: overlay.x + Math.sin(theta) * distance,
    y: overlay.y - Math.cos(theta) * distance,
  };
}
export function angleFromPointer(point: Point, overlay: Point): number {
  const angle =
    (Math.atan2(point.y - overlay.y, point.x - overlay.x) * 180) / Math.PI + 90;
  return ((angle + 540) % 360) - 180;
}
export function normalizeOverlay(value: Overlay): Overlay {
  return {
    ...value,
    x: clamp(value.x, 0, 1000),
    y: clamp(value.y, 0, 1000),
    width: clamp(value.width, 40, 1000),
    angle: clamp(value.angle, -180, 180),
  };
}
export function revealProgress(
  top: number,
  height: number,
  viewport: number,
  reducedMotion = false,
): { blend: number; name: number; photo: number } {
  if (reducedMotion) return { blend: 1, name: 1, photo: 1 };
  const progress = clamp(-top / Math.max(1, height - viewport), 0, 1);
  return {
    blend: clamp((progress - 0.12) / 0.42, 0, 1),
    name: clamp((progress - 0.36) / 0.24, 0, 1),
    photo: clamp((progress - 0.6) / 0.22, 0, 1),
  };
}
