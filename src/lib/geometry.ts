export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : minimum),
  );
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
