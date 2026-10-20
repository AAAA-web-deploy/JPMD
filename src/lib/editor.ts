import { CANVAS_SIZE, rotationHandle } from "./geometry.ts";
import type { Overlay } from "./geometry.ts";

export function coverRect(
  width: number,
  height: number,
  size = CANVAS_SIZE,
): { x: number; y: number; width: number; height: number } {
  if (width <= 0 || height <= 0)
    throw new RangeError("Image dimensions must be positive");
  const scale = Math.max(size / width, size / height);
  return {
    x: (size - width * scale) / 2,
    y: (size - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
}

/** The export path deliberately contains no fillText or strokeText operation. */
export function drawScene(
  context: CanvasRenderingContext2D,
  background: HTMLImageElement,
  ears: HTMLImageElement,
  overlays: readonly Overlay[],
  selectedId: number | null,
  selectionGuides = false,
  tinted?: (overlay: Overlay) => CanvasImageSource,
): void {
  const size = context.canvas.width;
  context.clearRect(0, 0, size, size);
  const rect = coverRect(
    background.naturalWidth || background.width,
    background.naturalHeight || background.height,
    size,
  );
  context.drawImage(background, rect.x, rect.y, rect.width, rect.height);
  const aspect =
    (ears.naturalWidth || ears.width) / (ears.naturalHeight || ears.height);
  for (const overlay of overlays) {
    const height = overlay.width / aspect;
    context.save();
    context.translate(overlay.x, overlay.y);
    context.rotate((overlay.angle * Math.PI) / 180);
    context.scale(overlay.flipped ? -1 : 1, 1);
    context.drawImage(
      tinted?.(overlay) ?? ears,
      -overlay.width / 2,
      -height / 2,
      overlay.width,
      height,
    );
    if (selectionGuides && overlay.id === selectedId) {
      context.strokeStyle = "#8a542b";
      context.lineWidth = 3;
      context.setLineDash([10, 8]);
      context.strokeRect(
        -overlay.width / 2 - 6,
        -height / 2 - 6,
        overlay.width + 12,
        height + 12,
      );
    }
    context.restore();
    if (selectionGuides && overlay.id === selectedId) {
      const handle = rotationHandle(overlay, aspect);
      const theta = (overlay.angle * Math.PI) / 180;
      context.save();
      context.strokeStyle = "#8a542b";
      context.fillStyle = "#faf7f2";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(
        overlay.x + (Math.sin(theta) * height) / 2,
        overlay.y - (Math.cos(theta) * height) / 2,
      );
      context.lineTo(handle.x, handle.y);
      context.stroke();
      context.beginPath();
      context.arc(handle.x, handle.y, 12, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
    }
  }
}

function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

/** Validate a local static format before asking the browser to decode its pixels. */
export async function validatePhoto(file: File): Promise<void> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Please choose an image smaller than 20 MB.");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const png =
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  const jpeg =
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255;
  const webp =
    bytes.length >= 12 &&
    fourCC(bytes, 0) === "RIFF" &&
    fourCC(bytes, 8) === "WEBP";
  if (!png && !jpeg && !webp)
    throw new Error("Choose a static PNG, JPEG, or WebP image.");
  if (png) {
    for (let position = 8; position + 12 <= bytes.length;) {
      const length = view.getUint32(position);
      const type = fourCC(bytes, position + 4);
      if (type === "acTL")
        throw new Error(
          "Animated images are not supported. Please choose one static image.",
        );
      if (type === "IDAT" || type === "IEND") break;
      if (length > bytes.length - position - 12) break;
      position += length + 12;
    }
  }
  if (webp) {
    for (let position = 12; position + 8 <= bytes.length;) {
      const type = fourCC(bytes, position);
      const length = view.getUint32(position + 4, true);
      if (type === "ANIM" || type === "ANMF")
        throw new Error(
          "Animated images are not supported. Please choose one static image.",
        );
      if (length > bytes.length - position - 8) break;
      position += 8 + length + (length % 2);
    }
  }
}
