import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initThemeToggle,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  themeStorageKey,
  themeToggle,
} from "../src/lib/theme.ts";
import {
  createProgress,
  imageSettled,
  initLoader,
  renderLoader,
} from "../src/components/loader.ts";
import { installDom } from "./dom.ts";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inlineScripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]!);
const [headScript, bodyScript] = inlineScripts;

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as Storage;
}

function fakeSystem(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: dark,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  return {
    query,
    change(next: boolean) {
      query.matches = next;
      listeners.forEach((listener) => listener());
    },
  };
}

test("theme preference: saved valid choice, then the OS, then day; storage failures are safe", () => {
  assert.equal(resolveTheme(null, false), "day");
  assert.equal(resolveTheme(null, true), "night");
  assert.equal(resolveTheme("day", true), "day");
  assert.equal(resolveTheme("night", false), "night");
  assert.equal(readStoredTheme(memoryStorage({ [themeStorageKey]: "night" })), "night");
  assert.equal(readStoredTheme(memoryStorage({ [themeStorageKey]: "sepia" })), null, "Invalid values are ignored.");
  const throwing = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
  } as unknown as Storage;
  assert.equal(readStoredTheme(throwing), null);
  assert.equal(readStoredTheme(null), null);
  assert.equal(storeTheme(throwing, "night"), false);
  const storage = memoryStorage();
  assert.equal(storeTheme(storage, "night"), true);
  assert.equal(storage.getItem(themeStorageKey), "night");
});

test("the inline pre-paint script applies the same resolution before the app loads", () => {
  assert.ok(headScript && bodyScript, "index.html keeps both inline scripts.");
  const cases: [string | null, boolean, string][] = [
    [null, false, "day"],
    [null, true, "night"],
    ["day", true, "day"],
    ["night", false, "night"],
    ["bogus", true, "night"],
  ];
  for (const [saved, dark, expected] of cases) {
    const window = installDom("");
    try {
      document.head.innerHTML = '<meta name="theme-color" content="#faf7f2" />';
      window.localStorage.clear();
      if (saved) window.localStorage.setItem(themeStorageKey, saved);
      window.matchMedia = (() => ({ matches: dark })) as unknown as typeof window.matchMedia;
      new Function(headScript!)();
      const root = document.documentElement;
      assert.equal(root.dataset.theme, expected, `${saved}/${dark}`);
      assert.equal(root.style.colorScheme, expected === "night" ? "dark" : "light");
      assert.equal(
        document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
        expected === "night" ? "#1b1714" : "#faf7f2",
      );
      assert.ok(root.hasAttribute("data-loading"));
      (window as unknown as { __shibaLoader: { release(): void } }).__shibaLoader.release();
    } finally {
      void window.happyDOM.close();
    }
  }
});

test("the toggle persists explicit choices and follows the OS only until then", () => {
  const window = installDom(`<header class="header">${themeToggle()}</header>`);
  const system = fakeSystem(false);
  window.matchMedia = (() => system.query) as unknown as typeof window.matchMedia;
  window.localStorage.clear();
  document.documentElement.dataset.theme = "day";
  try {
    const dispose = initThemeToggle();
    const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]")!;
    const root = document.documentElement;
    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.equal(button.getAttribute("aria-label"), "Night mode");
    system.change(true);
    assert.equal(root.dataset.theme, "night", "Follows the OS before any explicit choice.");
    assert.equal(button.getAttribute("aria-pressed"), "true");
    assert.equal(window.localStorage.getItem(themeStorageKey), null, "Following the OS stores nothing.");
    button.click();
    assert.equal(root.dataset.theme, "day");
    assert.equal(button.title, "Switch to night mode");
    assert.equal(window.localStorage.getItem(themeStorageKey), "day");
    system.change(true);
    system.change(false);
    system.change(true);
    assert.equal(root.dataset.theme, "day", "An explicit choice wins over later OS changes.");
    button.click();
    assert.equal(root.dataset.theme, "night");
    assert.equal(root.style.colorScheme, "dark");
    assert.equal(window.localStorage.getItem(themeStorageKey), "night");
    dispose();
    button.click();
    assert.equal(root.dataset.theme, "night", "Cleanup removes the listener.");
  } finally {
    void window.happyDOM.close();
  }
});

test("loader progress counts settled tasks, never decreases, and completes only when sealed", async () => {
  const seen: number[] = [];
  const progress = createProgress((value) => seen.push(value));
  let resolveA!: () => void;
  let rejectB!: (error: Error) => void;
  progress.add(new Promise<void>((resolve) => (resolveA = resolve)));
  progress.add(new Promise<void>((_, reject) => (rejectB = reject)));
  resolveA();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(seen, [0.5]);
  progress.add(new Promise(() => {}).then(() => {}, () => {}) as Promise<void>);
  let finished = false;
  void progress.done.then(() => (finished = true));
  rejectB(new Error("failed image"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(finished, false, "Not sealed and one task pending.");
  assert.ok(seen.every((value, index) => index === 0 || value >= seen[index - 1]!), "Monotonic.");
  assert.ok(seen.at(-1)! < 1);

  const second: number[] = [];
  const sealed = createProgress((value) => second.push(value));
  sealed.add(Promise.resolve());
  sealed.add(Promise.reject(new Error("decode")));
  sealed.seal();
  await sealed.done;
  assert.equal(second.at(-1), 1, "Failures count as settled; sealing finishes at 100%.");
});

test("image readiness: cached images settle at once; failed loads and decodes still settle", async () => {
  const cached = { complete: true, naturalWidth: 10, decode: () => Promise.reject(new Error("decode")) };
  await imageSettled(cached as unknown as HTMLImageElement);
  const listeners = new Map<string, () => void>();
  const pending = {
    complete: false,
    naturalWidth: 0,
    addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
    dispatchEvent: (event: { type: string }) => listeners.get(event.type)?.(),
  };
  let settled = false;
  void imageSettled(pending as unknown as HTMLImageElement).then(() => (settled = true));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(settled, false);
  pending.dispatchEvent({ type: "error" });
  assert.equal(listeners.size, 0, "Both listeners are removed.");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(settled, true);
});

test("the loader completes, then restores interaction; it never runs without a fresh-load flag", async () => {
  const markup = `<div class="site-loader" data-site-loader>${renderLoader()}</div><a class="skip-link" href="#lore">Skip</a><div id="app"><img class="hero-poster" alt="" width="10" height="10" /></div>`;
  const window = installDom(markup);
  try {
    const root = document.documentElement;
    root.setAttribute("data-loading", "");
    for (const element of [document.querySelector(".skip-link")!, document.querySelector("#app")!]) {
      element.setAttribute("inert", "");
      element.setAttribute("data-loader-inert", "");
    }
    const bar = document.querySelector("[data-loader-bar]")!;
    assert.equal(bar.getAttribute("role"), "progressbar");
    assert.ok(bar.getAttribute("aria-label"));
    assert.equal(document.querySelector("[data-loader-percent]")!.getAttribute("aria-hidden"), "true");
    initLoader();
    await new Promise((resolve) => setTimeout(resolve, 700));
    assert.equal(bar.getAttribute("aria-valuenow"), "100");
    assert.equal(document.querySelector("[data-loader-percent]")!.textContent, "100%");
    assert.equal(document.querySelector("[data-loader-status]")!.textContent, "Ready");
    assert.ok(!root.hasAttribute("data-loading"));
    assert.equal(document.querySelectorAll("[inert], [data-loader-inert]").length, 0);
    assert.ok(document.querySelector("[data-site-loader]")!.hasAttribute("hidden"));
    const again = document.querySelector("[data-loader-status]")!;
    again.textContent = "unchanged";
    initLoader();
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.equal(again.textContent, "unchanged", "No replay after the first load (anchors, theme changes, HMR).");
  } finally {
    void window.happyDOM.close();
  }
});

test("the inline watchdog releases the page after 8 s even if the app never starts", () => {
  const window = installDom("");
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    document.head.innerHTML = '<meta name="theme-color" content="#faf7f2" />';
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    new Function(headScript!)();
    document.body.innerHTML = `<div class="site-loader" data-site-loader></div><a class="skip-link" href="#lore">Skip</a><div id="app"><button>Inside</button></div>`;
    new Function(bodyScript!)();
    const root = document.documentElement;
    assert.ok(root.hasAttribute("data-loading"));
    assert.equal(document.querySelectorAll("[inert]").length, 2, "Covered content is inert; the loader is not.");
    assert.ok(!document.querySelector("[data-site-loader]")!.hasAttribute("inert"));
    mock.timers.tick(7999);
    assert.ok(root.hasAttribute("data-loading"));
    mock.timers.tick(1);
    assert.ok(!root.hasAttribute("data-loading"), "Scrolling is unlocked.");
    assert.equal(document.querySelectorAll("[inert], [data-loader-inert]").length, 0);
    assert.ok(document.querySelector("[data-site-loader]")!.hasAttribute("hidden"));
  } finally {
    mock.timers.reset();
    void window.happyDOM.close();
  }
});
