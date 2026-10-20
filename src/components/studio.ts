import { announce, downloadFile, mustQuery } from "../lib/browser.ts";
import { asset, icon } from "../lib/html.ts";
import {
  CANVAS_SIZE,
  MAX_OVERLAYS,
  angleFromPointer,
  defaultOverlay,
  hitOverlay,
  normalizeOverlay,
  rotationHandle,
} from "../lib/geometry.ts";
import type { Overlay, Point } from "../lib/geometry.ts";
import { drawScene, validatePhoto } from "../lib/editor.ts";

const basePath = "images/editor/shiba-base.png";
const earsPath = "images/editor/shiba-ears-overlay.png";
const ranges = [
  { key: "width", label: "Size", min: 40, max: 1000, value: 660 },
  { key: "angle", label: "Angle", min: -180, max: 180, value: 0 },
  { key: "x", label: "Horizontal position", min: 0, max: 1000, value: 500 },
  { key: "y", label: "Vertical position", min: 0, max: 1000, value: 190 },
] as const;

export function renderStudio(): string {
  return `<section id="studio" class="studio" aria-labelledby="studio-title"><div class="studio-intro"><p class="eyebrow block">YOUR PHOTO. A LITTLE MORE SHIBA.</p><h2 id="studio-title">MAKE IT YOUR OWN.</h2><p>Add the Shiba ears, find your angle, and save your own static image.</p><p class="studio-private">Your photo stays on this device. No upload to a server.</p></div><div class="studio-workspace" data-studio aria-busy="true"><div class="studio-preview"><canvas width="1000" height="1000" tabindex="0" data-studio-canvas aria-label="Shiba photo studio. Drag an ear layer or use the controls. Arrow keys move the selected layer." style="background-image:url('${asset(basePath)}')">Your browser does not support canvas. The collection is still available above.</canvas><p>Drag to move. Use the round handle to rotate.<br />Arrow keys move the selected ears; Shift moves them further.</p></div><div class="studio-controls"><fieldset><legend>Shape &amp; placement</legend>${ranges.map((range) => `<label for="studio-${range.key}"><span>${range.label}</span><output for="studio-${range.key}" data-output="${range.key}">${range.value}${range.key === "angle" ? "°" : ""}</output><input type="range" id="studio-${range.key}" data-overlay-range="${range.key}" min="${range.min}" max="${range.max}" step="1" value="${range.value}" disabled /></label>`).join("")}<div class="studio-buttons"><button type="button" data-studio-action="flip" disabled>${icon("flip")}Flip</button><button type="button" data-studio-action="angle" disabled>${icon("rotate")}Reset angle</button></div></fieldset><fieldset class="studio-colors"><legend>Make the colors yours</legend><label for="studio-fur">Fur tone<input id="studio-fur" type="color" data-overlay-color="fur" value="#9f6d3b" disabled /></label><label for="studio-inner">Inner ear<input id="studio-inner" type="color" data-overlay-color="inner" value="#eed5ba" disabled /></label></fieldset><div class="studio-buttons"><button type="button" data-studio-action="add" disabled>${icon("plus")}Add ears</button><button type="button" data-studio-action="remove" disabled>${icon("minus")}Remove</button></div><div class="studio-select" role="group" aria-label="Select an ear layer" data-studio-layers></div><p class="studio-status" data-studio-status role="status" aria-live="polite">Loading the studio…</p></div><div class="studio-file-actions"><input class="sr-only" id="studio-upload" data-studio-upload type="file" disabled accept="image/png,image/jpeg,image/webp" aria-label="Choose a static photo" /><label class="studio-upload" for="studio-upload">${icon("plus")}Upload your photo</label><button type="button" class="studio-download" data-studio-action="download" disabled>${icon("download")}Download PNG</button><button type="button" data-studio-action="reset" disabled>${icon("rotate")}Reset studio</button><p>Static PNG · 1000 × 1000 · Original artwork stays unlettered</p></div></div></section>`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "The image could not be decoded. Please choose another static image.",
        ),
      );
    image.src = url;
  });
}

export function initStudio(): () => void {
  const root = mustQuery<HTMLElement>("[data-studio]");
  const canvas = mustQuery<HTMLCanvasElement>("[data-studio-canvas]", root);
  const context = canvas.getContext("2d");
  const status = mustQuery<HTMLElement>("[data-studio-status]", root);
  const layers = mustQuery<HTMLElement>("[data-studio-layers]", root);
  const upload = mustQuery<HTMLInputElement>("[data-studio-upload]", root);
  if (!context) {
    root.setAttribute("aria-busy", "false");
    status.textContent =
      "Canvas is unavailable in this browser. You can still use the image collection.";
    return () => {};
  }
  const controller = new AbortController();
  const signal = controller.signal;
  let original: HTMLImageElement | null = null;
  let background: HTMLImageElement | null = null;
  let ears: HTMLImageElement | null = null;
  let overlays = [defaultOverlay()];
  let selectedId: number | null = 1;
  let nextId = 2;
  let busy = true,
    disposed = false,
    frame = 0,
    uploadSequence = 0;
  let objectUrl: string | null = null;
  let drag: {
    kind: "move" | "rotate";
    id: number;
    dx: number;
    dy: number;
    pointer: number;
  } | null = null;
  const tintCache = new Map<string, HTMLCanvasElement>();
  const selected = (): Overlay | undefined =>
    overlays.find((overlay) => overlay.id === selectedId);

  function tinted(overlay: Overlay): CanvasImageSource {
    if (!ears || (!overlay.fur && !overlay.inner)) return ears!;
    const key = `${overlay.fur ?? "original"}:${overlay.inner ?? "original"}`;
    const cached = tintCache.get(key);
    if (cached) return cached;
    const output = document.createElement("canvas");
    output.width = ears.naturalWidth;
    output.height = ears.naturalHeight;
    const draw = output.getContext("2d", { willReadFrequently: true });
    if (!draw) return ears;
    draw.drawImage(ears, 0, 0);
    const pixels = draw.getImageData(0, 0, output.width, output.height);
    const data = pixels.data;
    const rgb = (color: string): readonly [number, number, number] => {
      const value = Number.parseInt(color.slice(1), 16);
      return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    };
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! < 20) continue;
      const r = data[i]!,
        g = data[i + 1]!,
        b = data[i + 2]!;
      if (Math.max(r, g, b) < 35) continue;
      const inner = r > g * 1.12 && b > g * 0.7;
      const color = inner ? overlay.inner : overlay.fur;
      if (!color) continue;
      const [red, green, blue] = rgb(color);
      const light = Math.min(1.35, Math.max(0.28, (r + g + b) / 480));
      data[i] = Math.min(255, red * light);
      data[i + 1] = Math.min(255, green * light);
      data[i + 2] = Math.min(255, blue * light);
    }
    draw.putImageData(pixels, 0, 0);
    if (tintCache.size >= 24) tintCache.clear();
    tintCache.set(key, output);
    return output;
  }
  function draw(): void {
    frame = 0;
    if (background && ears && !disposed)
      drawScene(context!, background, ears, overlays, selectedId, true, tinted);
  }
  function scheduleDraw(): void {
    if (!frame && !disposed) frame = requestAnimationFrame(draw);
  }
  function refresh(): void {
    const active = selected();
    root.setAttribute("aria-busy", String(busy));
    upload.disabled = !original || !ears;
    root
      .querySelectorAll<HTMLInputElement>("[data-overlay-range]")
      .forEach((input) => {
        const key = input.dataset.overlayRange as "width" | "angle" | "x" | "y";
        input.disabled = busy || !active;
        if (active) input.value = String(Math.round(active[key]));
        const output = root.querySelector<HTMLOutputElement>(
          `[data-output="${key}"]`,
        );
        if (output)
          output.value = active
            ? `${Math.round(active[key])}${key === "angle" ? "°" : ""}`
            : "—";
      });
    root
      .querySelectorAll<HTMLInputElement>("[data-overlay-color]")
      .forEach((input) => {
        input.disabled = busy || !active;
        const key = input.dataset.overlayColor as "fur" | "inner";
        input.value = active?.[key] ?? (key === "fur" ? "#9f6d3b" : "#eed5ba");
      });
    root
      .querySelectorAll<HTMLButtonElement>("[data-studio-action]")
      .forEach((button) => {
        const action = button.dataset.studioAction;
        button.disabled =
          busy ||
          (["flip", "angle", "remove"].includes(action ?? "") && !active) ||
          (action === "add" && overlays.length >= MAX_OVERLAYS);
      });
    layers.innerHTML = overlays
      .map(
        (overlay, index) =>
          `<button type="button" data-select-layer="${overlay.id}" aria-pressed="${overlay.id === selectedId}">Ears ${index + 1}</button>`,
      )
      .join("");
    scheduleDraw();
  }
  function patch(values: Partial<Overlay>): void {
    overlays = overlays.map((overlay) =>
      overlay.id === selectedId
        ? normalizeOverlay({ ...overlay, ...values })
        : overlay,
    );
    refresh();
  }
  function remove(): void {
    overlays = overlays.filter((overlay) => overlay.id !== selectedId);
    selectedId = overlays.at(-1)?.id ?? null;
    refresh();
  }
  function reset(): void {
    uploadSequence += 1;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    background = original;
    overlays = [defaultOverlay()];
    selectedId = 1;
    nextId = 2;
    busy = false;
    upload.value = "";
    tintCache.clear();
    status.textContent = "Studio reset. Your photo has been removed.";
    refresh();
  }
  function save(): void {
    if (!background || !ears || busy) return;
    const output = document.createElement("canvas");
    output.width = output.height = CANVAS_SIZE;
    const outputContext = output.getContext("2d");
    if (!outputContext) {
      announce("PNG export is unavailable in this browser.");
      return;
    }
    try {
      drawScene(outputContext, background, ears, overlays, null, false, tinted);
      output.toBlob((blob) => {
        if (!blob) {
          announce("The PNG could not be created. Please try again.");
          return;
        }
        const url = URL.createObjectURL(blob);
        downloadFile(url, "shiba-studio.png");
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
        announce("Your static PNG is ready.");
      }, "image/png");
    } catch {
      announce("PNG export failed. Please try a different local photo.");
    }
  }
  function point(event: PointerEvent): Point | null {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const scale = Math.min(rect.width, rect.height) / CANVAS_SIZE;
    const offsetX = (rect.width - CANVAS_SIZE * scale) / 2;
    const offsetY = (rect.height - CANVAS_SIZE * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }
  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (busy || !ears) return;
      const p = point(event);
      if (!p) return;
      const aspect = ears.naturalWidth / ears.naturalHeight;
      const active = selected(),
        handle = active ? rotationHandle(active, aspect) : null;
      if (active && handle && Math.hypot(p.x - handle.x, p.y - handle.y) < 30)
        drag = {
          kind: "rotate",
          id: active.id,
          dx: 0,
          dy: 0,
          pointer: event.pointerId,
        };
      else {
        const hit = [...overlays]
          .reverse()
          .find((overlay) => hitOverlay(p, overlay, aspect));
        if (!hit) return;
        selectedId = hit.id;
        drag = {
          kind: "move",
          id: hit.id,
          dx: p.x - hit.x,
          dy: p.y - hit.y,
          pointer: event.pointerId,
        };
        refresh();
      }
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    },
    { signal },
  );
  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const p = point(event),
        active = selected();
      if (!p || !active) return;
      if (drag.kind === "rotate")
        patch({ angle: Math.round(angleFromPointer(p, active)) });
      else patch({ x: p.x - drag.dx, y: p.y - drag.dy });
    },
    { signal },
  );
  const release = (event: PointerEvent): void => {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    drag = null;
    canvas.style.cursor = "grab";
  };
  canvas.addEventListener("pointerup", release, { signal });
  canvas.addEventListener("pointercancel", release, { signal });
  canvas.addEventListener(
    "keydown",
    (event) => {
      const active = selected();
      if (!active || busy) return;
      const step = event.shiftKey ? 20 : 5;
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        if (event.key === "ArrowLeft") patch({ x: active.x - step });
        if (event.key === "ArrowRight") patch({ x: active.x + step });
        if (event.key === "ArrowUp") patch({ y: active.y - step });
        if (event.key === "ArrowDown") patch({ y: active.y + step });
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        remove();
      }
    },
    { signal },
  );
  root.addEventListener(
    "input",
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || busy) return;
      if (input.dataset.overlayRange)
        patch({ [input.dataset.overlayRange]: Number(input.value) });
      if (input.dataset.overlayColor)
        patch({ [input.dataset.overlayColor]: input.value });
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>("button")
          : null;
      if (!target || target.disabled || busy) return;
      if (target.dataset.selectLayer) {
        selectedId = Number(target.dataset.selectLayer);
        refresh();
        return;
      }
      const active = selected();
      switch (target.dataset.studioAction) {
        case "flip":
          if (active) patch({ flipped: !active.flipped });
          break;
        case "angle":
          patch({ angle: 0 });
          break;
        case "add":
          if (overlays.length < MAX_OVERLAYS) {
            const item = defaultOverlay(nextId++);
            overlays.push(item);
            selectedId = item.id;
            refresh();
          }
          break;
        case "remove":
          remove();
          break;
        case "reset":
          reset();
          break;
        case "download":
          save();
          break;
      }
    },
    { signal },
  );
  upload.addEventListener(
    "change",
    async () => {
      const file = upload.files?.[0];
      if (!file) return;
      const sequence = ++uploadSequence;
      let pendingUrl: string | null = null;
      busy = true;
      status.textContent = "Opening your photo locally…";
      refresh();
      try {
        await validatePhoto(file);
        pendingUrl = URL.createObjectURL(file);
        const incoming = await loadImage(pendingUrl);
        if (sequence !== uploadSequence || disposed) return;
        if (incoming.naturalWidth * incoming.naturalHeight > 40_000_000)
          throw new Error(
            "Please choose a photo with fewer than 40 million pixels.",
          );
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = pendingUrl;
        pendingUrl = null;
        background = incoming;
        status.textContent = "Your photo is ready. It stays on this device.";
      } catch (error) {
        if (sequence === uploadSequence && !disposed)
          status.textContent =
            error instanceof Error
              ? error.message
              : "The photo could not be opened.";
      } finally {
        if (pendingUrl) URL.revokeObjectURL(pendingUrl);
        if (sequence === uploadSequence && !disposed) {
          busy = false;
          upload.value = "";
          refresh();
        }
      }
    },
    { signal },
  );
  void Promise.all([loadImage(asset(basePath)), loadImage(asset(earsPath))])
    .then(([base, overlay]) => {
      if (disposed) return;
      original = base;
      background = base;
      ears = overlay;
      busy = false;
      canvas.style.backgroundImage = "none";
      status.textContent = "Ready. Use the Shiba or add your own photo.";
      refresh();
    })
    .catch(() => {
      if (disposed) return;
      root.setAttribute("aria-busy", "false");
      status.textContent =
        "The studio images could not load. Please refresh or use the collection above.";
    });
  return () => {
    disposed = true;
    controller.abort();
    cancelAnimationFrame(frame);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    tintCache.clear();
  };
}
