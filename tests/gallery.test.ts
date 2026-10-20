import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { memes, moodImages } from "../src/content.ts";
import {
  categories,
  chooseCategory,
  expandGallery,
  filterMoods,
  shareUrl,
} from "../src/lib/gallery.ts";
import type { Category } from "../src/lib/gallery.ts";
import {
  initGallery,
  initImageStrips,
  renderArchive,
  renderGalleryIntro,
  renderMemeDialog,
  renderStrip,
} from "../src/components/gallery.ts";
import { initBook, renderBook } from "../src/components/book.ts";
import { imageProfiles } from "../src/lib/image-profiles.ts";
import { emulateNativeDialog, installDom } from "./dom.ts";

test("gallery pages grow by eight and category changes restart at eight", () => {
  let state = chooseCategory("All Shibas");
  const counts = [state.visible];
  while (state.visible < 67) {
    state = expandGallery(state, 67);
    counts.push(state.visible);
  }
  assert.deepEqual(counts, [8, 16, 24, 32, 40, 48, 56, 64, 67]);
  state = chooseCategory("Shiba Society");
  assert.equal(state.visible, 8);
});

test("the moods gallery filters hold the new collections and keep Shiba Society", () => {
  assert.deepEqual(
    [...categories],
    ["All Shibas", "Wall Street", "Ethereum", "Trading Desk", "Shiba Culture", "Shiba Society"],
  );
  const ids = (category: Category) => filterMoods(moodImages, category).map((image) => image.id);
  assert.deepEqual(ids("Wall Street"), [
    "wall-street-01-boardroom-diplomacy",
    "wall-street-02-the-arrival",
    "wall-street-03-corner-office-nap",
    "wall-street-04-after-hours-business",
    "wall-street-05-coffee-by-the-bull",
    "wall-street-06-private-dinner",
  ]);
  assert.deepEqual(ids("Ethereum"), [
    "ethereum-01-the-first-necklace",
    "ethereum-02-the-community-embrace",
    "ethereum-03-at-home-on-ethereum",
    "ethereum-04-through-the-storm",
    "ethereum-05-the-builders-garden",
    "ethereum-06-ethereum-rising",
    "ethereum-07-repairing-together",
    "ethereum-08-the-ethereum-circle",
  ]);
  assert.deepEqual(ids("Trading Desk"), [
    "trading-desk-01-full-setup",
    "trading-desk-02-chart-study",
    "trading-desk-03-the-waiting-game",
    "trading-desk-05-three-traders-three-opinions",
    "trading-desk-06-done-for-today",
  ]);
  assert.deepEqual(ids("Shiba Culture"), [
    "shiba-culture-01-riders-of-the-first-dawn",
    "shiba-culture-02-the-shiba-of-giza",
    "shiba-culture-03-shiba-of-the-golden-garden",
    "shiba-culture-04-the-guardian-fresco",
    "shiba-culture-05-bronze-ascendant",
    "shiba-culture-06-beyond-the-frame",
    "shiba-culture-07-the-shiba-geographer",
    "shiba-culture-08-the-opening-move",
  ]);
  const society = memes.filter((meme) => meme.category === "Community");
  assert.equal(society.length, 10);
  assert.deepEqual(ids("Shiba Society"), society.map((meme) => meme.id));
  const all = ids("All Shibas");
  assert.equal(all.length, 37);
  assert.equal(new Set(all).size, 37);
  assert.deepEqual(
    all,
    ["Wall Street", "Ethereum", "Trading Desk", "Shiba Culture", "Shiba Society"].flatMap((category) =>
      ids(category as Category),
    ),
  );
  assert.equal(new Set(moodImages.map((image) => image.path)).size, 37);
  assert.equal(new Set([...memes, ...moodImages].map((image) => image.id)).size, 67 + 27);
  const frame = moodImages.find((image) => image.id === "shiba-culture-06-beyond-the-frame")!;
  assert.equal(frame.path, "images/memes/shiba-culture-06-beyond-the-frame.png");
  assert.equal(frame.caption, "Beyond the Frame");
  assert.equal(
    frame.alt,
    "An armored Shiba on a rearing horse thrusts an Ethereum-shaped spear downward; the gripping paw, spear and horse's raised legs project beyond a gold frame.",
  );
  const arrival = moodImages.find((image) => image.id === "wall-street-02-the-arrival")!;
  assert.equal(arrival.path, "images/memes/wall-street-02-the-arrival.png");
  assert.equal(arrival.caption, "The Arrival");
  assert.equal(arrival.alt, "An ivory-suited Shiba steps from a graphite car outside a bank.");
});

test("live filter / expansion sequence produces no stale ninth card or duplicate", async () => {
  const window = installDom(
    `<div id="app">${renderGalleryIntro()}${renderArchive()}${renderMemeDialog()}<div id="toast" hidden></div></div>`,
  );
  const dialog = document.querySelector<HTMLDialogElement>("dialog")!;
  emulateNativeDialog(dialog);
  const cleanup = initGallery();
  try {
    const select = (category: string): void =>
      document
        .querySelector<HTMLButtonElement>(`[data-meme-filter="${category}"]`)!
        .click();
    const cards = (): Element[] => [
      ...document.querySelectorAll("[data-meme-grid] [data-meme-card]"),
    ];
    const more = document.querySelector<HTMLButtonElement>("[data-meme-more]")!;
    const count = () => document.querySelector("[data-meme-count]")!.textContent;
    const empty = () => document.querySelectorAll("[data-meme-grid] .meme-empty").length;
    assert.equal(document.querySelectorAll("[data-meme-filter]").length, 6);
    assert.equal(cards().length, 8);
    assert.equal(count(), "Showing 8 of 37 images");
    assert.equal(more.hidden, false);
    more.click();
    more.click();
    more.click();
    assert.equal(more.textContent!.trim(), "Show 5 more");
    more.click();
    assert.equal(cards().length, 37);
    assert.equal(more.hidden, true);
    assert.equal(
      new Set(cards().map((card) => card.getAttribute("data-meme-card"))).size,
      37,
    );
    select("Ethereum");
    assert.equal(cards().length, 8);
    assert.equal(more.hidden, true);
    assert.equal(count(), "Showing 8 of 8 images · Ethereum");
    const cardImage = document.querySelector<HTMLImageElement>(
      '[data-meme-card="ethereum-05-the-builders-garden"] img',
    )!;
    assert.match(cardImage.getAttribute("src")!, /^\/images\/memes\/ethereum-05-the-builders-garden\.png$/);
    assert.match(cardImage.getAttribute("srcset")!, /^\/generated\/images\/memes\/ethereum-05-the-builders-garden-120\.webp 120w, .+-760\.webp 760w$/);
    assert.equal(cardImage.getAttribute("sizes"), imageProfiles.card.sizes);
    assert.equal(cardImage.getAttribute("loading"), "lazy");
    assert.equal(cardImage.getAttribute("decoding"), "async");
    document
      .querySelector<HTMLButtonElement>('[data-meme-grid] [data-open-meme="ethereum-05-the-builders-garden"]')!
      .click();
    const modalImage = dialog.querySelector<HTMLImageElement>("[data-modal-image]")!;
    assert.equal(dialog.open, true);
    assert.match(modalImage.getAttribute("src")!, /images\/memes\/ethereum-05-the-builders-garden\.png$/);
    assert.equal(modalImage.hasAttribute("srcset"), false, "The viewer shows the original artwork.");
    assert.equal(modalImage.alt, "Shiba exchanges ideas with researchers in a garden.");
    assert.equal(dialog.querySelector<HTMLTextAreaElement>("#meme-caption")!.value, "The Builders’ Garden");
    dialog.close();
    select("Wall Street");
    assert.equal(cards().length, 6);
    select("Trading Desk");
    assert.equal(cards().length, 5);
    select("Shiba Culture");
    assert.equal(cards().length, 8);
    assert.equal(empty(), 0);
    assert.equal(more.hidden, true);
    assert.equal(count(), "Showing 8 of 8 images · Shiba Culture");
    assert.equal(
      document.querySelector('[data-meme-filter="Shiba Culture"]')!.getAttribute("aria-pressed"),
      "true",
    );
    assert.deepEqual(
      cards().map((card) => card.querySelector("h3")!.textContent),
      [
        "Riders of the First Dawn",
        "The Shiba of Giza",
        "Shiba of the Golden Garden",
        "The Guardian Fresco",
        "Bronze Ascendant",
        "Beyond the Frame",
        "The Shiba Geographer",
        "The Opening Move",
      ],
    );
    document
      .querySelector<HTMLButtonElement>('[data-meme-grid] [data-open-meme="shiba-culture-06-beyond-the-frame"]')!
      .click();
    assert.equal(dialog.open, true);
    assert.match(modalImage.getAttribute("src")!, /images\/memes\/shiba-culture-06-beyond-the-frame\.png$/);
    assert.equal(dialog.querySelector<HTMLTextAreaElement>("#meme-caption")!.value, "Beyond the Frame");
    dialog.close();
    const share = document.querySelector<HTMLAnchorElement>(
      '[data-share-meme="shiba-culture-02-the-shiba-of-giza"]',
    )!;
    assert.match(
      new URL(share.href).searchParams.get("text")!,
      /^The Shiba of Giza\n.*images\/memes\/shiba-culture-02-the-shiba-of-giza\.png$/,
    );
    select("Shiba Society");
    assert.equal(empty(), 0);
    assert.equal(cards().length, 8);
    more.click();
    assert.equal(cards().length, 10);
    select("All Shibas");
    assert.equal(cards().length, 8);
  } finally {
    cleanup();
    await window.happyDOM.close();
  }
});

test("archive opens shared viewer; edited caption drives share/copy; cancel restores focus and scrolling", async () => {
  const window = installDom(
    `<div id="app">${renderGalleryIntro()}${renderArchive()}${renderMemeDialog()}<div id="toast" hidden></div></div>`,
  );
  const dialog = document.querySelector<HTMLDialogElement>("dialog")!;
  emulateNativeDialog(dialog);
  let copied = "";
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copied = text;
      },
    },
  });
  const cleanup = initGallery();
  try {
    document.body.style.overflow = "scroll";
    const trigger = document.querySelector<HTMLButtonElement>(
      '.meme-archive [data-open-meme="meme-67"]',
    )!;
    trigger.focus();
    trigger.click();
    assert.equal(dialog.open, true);
    assert.equal(document.body.style.overflow, "hidden");
    assert.match(
      document.querySelector<HTMLImageElement>("[data-modal-image]")!.src,
      /67-wake-me-later\.png$/,
    );
    const caption =
      document.querySelector<HTMLTextAreaElement>("#meme-caption")!;
    caption.value = "My caption & a different angle 🐾";
    caption.dispatchEvent(new Event("input", { bubbles: true }));
    const share = new URL(
      document.querySelector<HTMLAnchorElement>("[data-modal-share]")!.href,
    );
    assert.equal(share.origin, "https://x.com");
    assert.ok(share.searchParams.get("text")!.startsWith(caption.value + "\n"));
    document.querySelector<HTMLButtonElement>("[data-modal-copy]")!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(copied, caption.value);
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    assert.equal(dialog.open, false);
    assert.equal(document.body.style.overflow, "scroll");
    assert.equal(document.activeElement, trigger);
  } finally {
    cleanup();
    await window.happyDOM.close();
  }
});

test("strips pause offscreen and in hidden tabs, then clean up; without IntersectionObserver they keep running", async () => {
  const window = installDom(`<div id="app">${renderStrip("left")}${renderStrip("right")}</div>`);
  let observed: ((entries: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
  const targets: Element[] = [];
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: class {
      constructor(callback: typeof observed) {
        observed = callback;
      }
      observe(target: Element) {
        targets.push(target);
      }
      disconnect() {
        observed = null;
      }
    },
  });
  let hidden = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  try {
    const [left, right] = [...document.querySelectorAll<HTMLElement>(".image-strip")] as [HTMLElement, HTMLElement];
    const before = document.querySelector(".image-strip")!.outerHTML.replace(/ data-strip-[a-z-]+=""/g, "");
    const dispose = initImageStrips();
    assert.deepEqual(targets, [left, right]);
    observed!([
      { target: left, isIntersecting: true },
      { target: right, isIntersecting: false },
    ]);
    assert.equal(left.hasAttribute("data-strip-offscreen"), false);
    assert.equal(right.hasAttribute("data-strip-offscreen"), true);
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    assert.ok(left.hasAttribute("data-strip-tab-hidden") && right.hasAttribute("data-strip-tab-hidden"));
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    observed!([{ target: right, isIntersecting: true }]);
    assert.equal(document.querySelectorAll("[data-strip-offscreen],[data-strip-tab-hidden]").length, 0);
    assert.equal(left.outerHTML, before, "Markup, buttons, and lazy images are untouched.");
    right.setAttribute("data-strip-offscreen", "");
    dispose();
    assert.equal(observed, null);
    assert.equal(right.hasAttribute("data-strip-offscreen"), false);
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    assert.equal(left.hasAttribute("data-strip-tab-hidden"), false, "Listener removed.");

    Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, writable: true, value: undefined });
    hidden = false;
    const disposeFallback = initImageStrips();
    assert.equal(document.querySelectorAll("[data-strip-offscreen]").length, 0);
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    assert.ok(left.hasAttribute("data-strip-tab-hidden"), "The tab pause still works without an observer.");
    disposeFallback();
  } finally {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    await window.happyDOM.close();
  }
});

test("strip pauses only add paused states and never override hover, focus, or reduced motion", async () => {
  const css = await readFile(new URL("../src/styles/main.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.image-strip:hover \.image-strip-track,\s*\.image-strip:focus-within \.image-strip-track,\s*\.image-strip\[data-strip-offscreen\] \.image-strip-track,\s*\.image-strip\[data-strip-tab-hidden\] \.image-strip-track \{\s*animation-play-state: paused;\s*\}/,
  );
  assert.doesNotMatch(css, /animation-play-state:\s*running/);
  assert.match(css, /animation: image-scroll 113s linear infinite;/);
});

test("share URL safely round-trips punctuation and line breaks", () => {
  const caption = "A&B? #mood\nA second line";
  const image = "https://example.test/images/one.png";
  assert.equal(
    new URL(shareUrl(caption, image)).searchParams.get("text"),
    `${caption}\n${image}`,
  );
});

test("book prevents overlapping turns and keeps cover/last-page boundaries", async () => {
  const window = installDom(`<div id="app">${renderBook()}</div>`);
  const cleanup = initBook();
  try {
    const previous =
      document.querySelector<HTMLButtonElement>("[data-book-prev]")!;
    const next = document.querySelector<HTMLButtonElement>("[data-book-next]")!;
    assert.equal(previous.disabled, true);
    next.click();
    assert.equal(next.disabled, true);
    assert.equal(previous.disabled, true);
    next.click();
    assert.equal(document.querySelectorAll(".story-flipping-sheet").length, 1);
    document
      .querySelector(".story-flipping-sheet")!
      .dispatchEvent(new Event("animationend"));
    assert.equal(next.disabled, false);
    assert.equal(previous.disabled, false);
    assert.equal(
      document
        .querySelector('[aria-current="step"]')
        ?.getAttribute("data-book-page"),
      "1",
    );
    document.querySelector<HTMLButtonElement>('[data-book-page="5"]')!.click();
    document
      .querySelector(".story-flipping-sheet")!
      .dispatchEvent(new Event("animationend"));
    assert.equal(next.disabled, true);
    previous.click();
    document
      .querySelector(".story-flipping-sheet")!
      .dispatchEvent(new Event("animationend"));
    assert.equal(
      document
        .querySelector('[aria-current="step"]')
        ?.getAttribute("data-book-page"),
      "4",
    );
    document.querySelector<HTMLButtonElement>('[data-book-page="0"]')!.click();
    document
      .querySelector(".story-flipping-sheet")!
      .dispatchEvent(new Event("animationend"));
    assert.equal(previous.disabled, true);
    assert.ok(document.querySelector(".story-cover picture source"));
  } finally {
    cleanup();
    await window.happyDOM.close();
  }
});

test("reduced-motion book changes page without a flipping sheet", async () => {
  const window = installDom(`<div id="app">${renderBook()}</div>`, true);
  const cleanup = initBook();
  try {
    document.querySelector<HTMLButtonElement>("[data-book-next]")!.click();
    assert.equal(document.querySelector(".story-flipping-sheet"), null);
    assert.equal(
      document
        .querySelector('[aria-current="step"]')
        ?.getAttribute("data-book-page"),
      "1",
    );
    assert.equal(
      document.querySelector<HTMLButtonElement>("[data-book-next]")!.disabled,
      false,
    );
  } finally {
    cleanup();
    await window.happyDOM.close();
  }
});
