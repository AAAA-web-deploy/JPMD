import { siteConfig } from "../config.ts";
import { escapeHtml as e, image } from "../lib/html.ts";

/** Loader body for the static [data-site-loader] element in index.html (outside the inert site). */
export function renderLoader(): string {
  return `<div class="site-loader-inner"><div class="site-loader-logo">${image("images/brand/header-mascot.png", "", "", true, 1536, 1024, "header")}</div><div class="site-loader-track" role="progressbar" aria-label="Loading ${e(siteConfig.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-loader-bar><span class="site-loader-fill" data-loader-fill></span></div><p class="site-loader-percent" aria-hidden="true" data-loader-percent>0%</p><p class="site-loader-status" role="status" data-loader-status>Loading…</p></div>`;
}

export interface ProgressTracker {
  add(task: Promise<unknown>): void;
  /** No more tasks will be added; `done` resolves once every added task has settled. */
  seal(): void;
  readonly done: Promise<void>;
}

/** Progress counts settled tasks (fulfilled or rejected), never decreases, and reaches 1 only when sealed and settled. */
export function createProgress(onChange: (fraction: number) => void): ProgressTracker {
  let total = 0;
  let settled = 0;
  let shown = 0;
  let sealed = false;
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  const report = (): void => {
    const complete = sealed && settled === total;
    const next = complete ? 1 : Math.min(0.99, total ? settled / total : 0);
    if (next > shown) {
      shown = next;
      onChange(shown);
    }
    if (complete) finish();
  };
  return {
    add(task) {
      total++;
      task.then(
        () => {},
        () => {},
      ).then(() => {
        settled++;
        report();
      });
    },
    seal() {
      sealed = true;
      report();
    },
    done,
  };
}

/** Settles when the image has loaded and decoded, or failed. Cached images settle immediately. */
export function imageSettled(img: HTMLImageElement): Promise<void> {
  const decode = (): Promise<void> =>
    img.naturalWidth > 0 && typeof img.decode === "function" ? img.decode().catch(() => {}) : Promise.resolve();
  if (img.complete) return decode();
  return new Promise<void>((resolve) => {
    const settle = (): void => {
      img.removeEventListener("load", settle);
      img.removeEventListener("error", settle);
      resolve();
    };
    img.addEventListener("load", settle);
    img.addEventListener("error", settle);
  }).then(decode);
}

function stylesheetSettled(link: HTMLLinkElement): Promise<void> {
  if (link.sheet) return Promise.resolve();
  return new Promise((resolve) => {
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });
}

/** Images the visitor sees first: the hero poster plus visible images intersecting the viewport. Lazy offscreen images are left alone. */
export function initialImages(root: ParentNode = document): HTMLImageElement[] {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return [...root.querySelectorAll<HTMLImageElement>("#app img")].filter((img) => {
    if (img.classList.contains("hero-poster")) return true;
    const rect = img.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (rect.bottom <= 0 || rect.top >= height || rect.right <= 0 || rect.left >= width) return false;
    return img.checkVisibility?.({ visibilityProperty: true, opacityProperty: false }) ?? true;
  });
}

interface LoaderGlobal {
  release?: (fade?: boolean) => void;
}

export const loaderMinimumMs = 250;

/**
 * Drives the overlay installed by index.html. Runs only on a fresh document load (html[data-loading]),
 * so anchor navigation, filters, theme changes and HMR never replay it. Release is the inline script's
 * shared function, which the 8 s watchdog also uses.
 */
export function initLoader(): () => void {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>("[data-site-loader]");
  if (!root.hasAttribute("data-loading") || !overlay) return () => {};
  if (!overlay.querySelector("[data-loader-bar]")) overlay.innerHTML = renderLoader();
  const bar = overlay.querySelector<HTMLElement>("[data-loader-bar]");
  const fill = overlay.querySelector<HTMLElement>("[data-loader-fill]");
  const percent = overlay.querySelector<HTMLElement>("[data-loader-percent]");
  const status = overlay.querySelector<HTMLElement>("[data-loader-status]");
  let cancelled = false;

  const progress = createProgress((fraction) => {
    const value = Math.round(fraction * 100);
    fill?.style.setProperty("--loader-progress", String(fraction));
    bar?.setAttribute("aria-valuenow", String(value));
    if (percent) percent.textContent = `${value}%`;
  });
  progress.add(Promise.resolve());
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    progress.add(stylesheetSettled(link));
  if (document.fonts?.ready) progress.add(document.fonts.ready);
  for (const img of initialImages()) progress.add(imageSettled(img));
  progress.seal();

  void progress.done.then(async () => {
    const wait = loaderMinimumMs - performance.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    if (cancelled) return;
    if (status) status.textContent = "Ready";
    const release = (window as unknown as { __shibaLoader?: LoaderGlobal }).__shibaLoader?.release;
    if (release) release(true);
    else releaseLoader(true);
  });
  return () => {
    cancelled = true;
  };
}

/** Fallback with the same effect as the inline release (used when index.html's script is absent, e.g. tests). */
export function releaseLoader(fade = false): void {
  const root = document.documentElement;
  if (!root.hasAttribute("data-loading")) return;
  const x = window.scrollX;
  const y = window.scrollY;
  const overlay = document.querySelector<HTMLElement>("[data-site-loader]");
  overlay?.classList.toggle("is-leaving", fade);
  root.removeAttribute("data-loading");
  for (const element of document.querySelectorAll("[data-loader-inert]")) {
    element.removeAttribute("inert");
    element.removeAttribute("data-loader-inert");
  }
  if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
  const hide = (): void => {
    overlay?.classList.remove("is-leaving");
    overlay?.setAttribute("hidden", "");
  };
  if (fade) setTimeout(hide, 300);
  else hide();
}
