import test from "node:test";
import assert from "node:assert/strict";
import voicesContent from "../src/data/wall-street-meets-ethereum.json" with { type: "json" };
import { voices } from "../src/content.ts";
import { initVoices, renderVoices } from "../src/components/voices.ts";
import { installDom } from "./dom.ts";

test("the section renders the supplied copy in order as ordinary stacked cards", () => {
  assert.deepEqual(
    voices.map((voice) => voice.id),
    ["larry-fink", "emma-landriault", "matthew-dawson"],
  );
  const window = installDom(renderVoices());
  try {
    const section = document.querySelector("section#ethereum")!;
    assert.equal(section.querySelector("h2")?.textContent, voicesContent.title);
    assert.equal(section.querySelector(".voices-heading p")?.textContent, voicesContent.subtitle);
    const cards = [...section.querySelectorAll<HTMLElement>(".voice")];
    assert.equal(cards.length, 3);
    cards.forEach((card, index) => {
      const speaker = voicesContent.speakers.find((entry) => entry.id === voicesContent.animation.order[index])!;
      assert.equal(card.querySelector("blockquote p")?.textContent, speaker.quote);
      assert.equal(card.querySelector(".voice-name")?.textContent, speaker.name);
      assert.equal(card.querySelector(".voice-role")?.textContent, speaker.role);
      const source = card.querySelector<HTMLAnchorElement>("a.voice-source")!;
      assert.equal(source.getAttribute("href"), speaker.sourceUrl);
      assert.equal(source.textContent, speaker.sourceLabel);
      assert.equal(source.getAttribute("target"), "_blank");
      assert.equal(source.getAttribute("rel"), "noopener noreferrer");
      const img = card.querySelector("img")!;
      assert.equal(img.getAttribute("alt"), speaker.alt);
      assert.equal(img.getAttribute("src"), `/${speaker.imagePath}`);
      assert.equal(img.getAttribute("width"), "1254");
      assert.equal(img.getAttribute("height"), "1254");
      assert.equal(img.getAttribute("loading"), "lazy");
      assert.equal(img.getAttribute("sizes"), "(max-width: 800px) 220px, 360px");
      assert.deepEqual(
        img.getAttribute("srcset")!.split(", ").map((candidate) => candidate.split(" ")[1]),
        ["320w", "480w", "640w", "960w", "1254w"],
      );
      assert.ok(img.getAttribute("srcset")!.endsWith(`/${speaker.imagePath} 1254w`), "The full-size candidate is the supplied WebP.");
      for (const attribute of ["hidden", "inert", "aria-hidden"])
        assert.ok(!card.hasAttribute(attribute), `Prerendered card ${index} has ${attribute}.`);
    });
    assert.equal(section.querySelectorAll("[hidden], [inert], [aria-hidden]").length, 0);
    assert.deepEqual(
      [...section.querySelectorAll("[data-voice-select]")].map((button) => [
        button.textContent,
        button.getAttribute("type"),
        button.getAttribute("aria-pressed"),
      ]),
      [
        ["Larry Fink", "button", "true"],
        ["Emma Landriault", "button", "false"],
        ["Matthew Dawson", "button", "false"],
      ],
    );
    assert.match(section.querySelector(".voices-progress")?.textContent ?? "", /^01 \/ 03$/);
    assert.ok(!section.classList.contains("is-pinned"), "Pinning is enabled only by the controller.");
  } finally {
    void window.happyDOM.close();
  }
});

interface Harness {
  section: HTMLElement;
  panels: HTMLElement[];
  buttons: HTMLButtonElement[];
  scrolls: ScrollToOptions[];
  geometry: { top: number; innerHeight: number };
  scroll(): void;
  dispose: () => void;
  close(): void;
}

const header = 80;
const height = 3150;
const stage = 820;
const topAt = (p: number): number => header - p * (height - stage);

function harness(reduced = false): Harness {
  const window = installDom(`<header class="header"></header><main>${renderVoices()}</main>`, reduced);
  const geometry = { top: 400, innerHeight: 640 };
  const rect = (top: number, h: number) => ({ top, height: h, bottom: top + h, left: 0, right: 1440, width: 1440, x: 0, y: top, toJSON() {} });
  const section = document.querySelector<HTMLElement>("#ethereum")!;
  const stageElement = section.querySelector<HTMLElement>("[data-voices-stage]")!;
  const inner = section.querySelector<HTMLElement>("[data-voices-inner]")!;
  const panels = [...section.querySelectorAll<HTMLElement>("[data-voice]")];
  document.querySelector<HTMLElement>(".header")!.getBoundingClientRect = () => rect(0, header) as DOMRect;
  section.getBoundingClientRect = () => rect(geometry.top, height) as DOMRect;
  stageElement.getBoundingClientRect = () => rect(header, stage) as DOMRect;
  panels.forEach((panel, index) => {
    panel.getBoundingClientRect = () => rect(geometry.top + 200 + index * 700, 600) as DOMRect;
  });
  Object.defineProperty(stageElement, "clientHeight", { configurable: true, get: () => stage });
  Object.defineProperty(inner, "offsetHeight", { configurable: true, get: () => geometry.innerHeight });
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => 5000 });
  Object.defineProperty(window, "innerHeight", { configurable: true, get: () => 900 });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, get: () => 20000 });
  const scrolls: ScrollToOptions[] = [];
  window.scrollTo = ((options: ScrollToOptions) => void scrolls.push(options)) as typeof window.scrollTo;
  const globals = globalThis as unknown as Record<string, unknown>;
  // Synchronous frames; returning 0 tells the controller nothing is still pending.
  globals.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  };
  globals.cancelAnimationFrame = () => {};
  const dispose = initVoices();
  return {
    section,
    panels,
    buttons: [...section.querySelectorAll<HTMLButtonElement>("[data-voice-select]")],
    scrolls,
    geometry,
    scroll: () => window.dispatchEvent(new window.Event("scroll")),
    dispose,
    close() {
      delete globals.requestAnimationFrame;
      delete globals.cancelAnimationFrame;
      void window.happyDOM.close();
    },
  };
}

const activeOf = (h: Harness) => ({
  active: h.panels.findIndex((panel) => panel.classList.contains("is-active")),
  hidden: h.panels.map((panel) => panel.hasAttribute("inert") && panel.getAttribute("aria-hidden") === "true"),
  pressed: h.buttons.map((button) => button.getAttribute("aria-pressed")),
  counter: h.section.querySelector("[data-voices-current]")!.textContent,
});

test("pinned controller shows one whole speaker per stage, forward and in reverse", () => {
  const h = harness();
  try {
    assert.ok(h.section.classList.contains("is-pinned"));
    assert.equal(h.section.style.getPropertyValue("--voices-top"), "80px");
    assert.deepEqual(activeOf(h), {
      active: 0,
      hidden: [false, true, true],
      pressed: ["true", "false", "false"],
      counter: "01",
    });
    const path = [0.2, 0.34, 0.5, 0.67, 1, 0.9, 0.6, 0.3, 0];
    const seen = path.map((p) => {
      h.geometry.top = topAt(p);
      h.scroll();
      return activeOf(h);
    });
    assert.deepEqual(
      seen.map((state) => state.active),
      [0, 1, 1, 2, 2, 2, 1, 0, 0],
    );
    for (const state of seen) {
      assert.deepEqual(state.hidden, [0, 1, 2].map((i) => i !== state.active));
      assert.deepEqual(state.pressed, [0, 1, 2].map((i) => String(i === state.active)));
      assert.equal(state.counter, `0${state.active + 1}`);
    }
  } finally {
    h.dispose();
    h.close();
  }
});

test("selectors scroll to the middle of each pinned interval, or to the card when stacked", () => {
  const h = harness();
  try {
    h.geometry.top = 1400;
    h.buttons.forEach((button) => button.click());
    const start = 5000 + 1400 - header;
    assert.deepEqual(
      h.scrolls.map((options) => [Math.round(options.top! - start), options.behavior]),
      [
        [Math.round((height - stage) / 6), "smooth"],
        [Math.round((height - stage) / 2), "smooth"],
        [Math.round(((height - stage) * 5) / 6), "smooth"],
      ],
    );
    h.scrolls.length = 0;
    h.geometry.innerHeight = 900;
    window.dispatchEvent(new Event("resize"));
    assert.ok(!h.section.classList.contains("is-pinned"), "A composition taller than the stage falls back to stacked cards.");
    assert.equal(h.section.querySelectorAll("[inert], [aria-hidden]").length, 0);
    h.buttons[2]!.click();
    assert.deepEqual(h.scrolls, [{ top: 5000 + 1400 + 200 + 1400 - header - 24, behavior: "smooth" }]);
  } finally {
    h.dispose();
    h.close();
  }
});

test("reduced motion keeps stacked cards and cleanup restores the prerendered state", () => {
  const h = harness(true);
  try {
    assert.ok(!h.section.classList.contains("is-pinned"));
    assert.equal(h.section.querySelectorAll("[inert], [aria-hidden], .is-active").length, 0);
    h.buttons[1]!.click();
    assert.equal(h.scrolls[0]?.behavior, "auto");
  } finally {
    h.dispose();
    h.close();
  }
  const pinned = harness();
  try {
    pinned.geometry.top = topAt(0.9);
    pinned.scroll();
    pinned.dispose();
    assert.ok(!pinned.section.classList.contains("is-pinned"));
    assert.equal(pinned.section.querySelectorAll("[inert], [aria-hidden], .is-active").length, 0);
    assert.equal(pinned.section.style.getPropertyValue("--voices-top"), "");
    assert.deepEqual(activeOf(pinned).pressed, ["true", "false", "false"]);
  } finally {
    pinned.close();
  }
});
