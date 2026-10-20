import test from "node:test";
import assert from "node:assert/strict";
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
  renderArchive,
  renderGalleryIntro,
  renderMemeDialog,
} from "../src/components/gallery.ts";
import { initBook, renderBook } from "../src/components/book.ts";
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
  assert.deepEqual(ids("Shiba Culture"), []);
  const society = memes.filter((meme) => meme.category === "Community");
  assert.equal(society.length, 10);
  assert.deepEqual(ids("Shiba Society"), society.map((meme) => meme.id));
  const all = ids("All Shibas");
  assert.equal(all.length, 29);
  assert.equal(new Set(all).size, 29);
  assert.equal(new Set(moodImages.map((image) => image.path)).size, 29);
  assert.equal(new Set([...memes, ...moodImages].map((image) => image.id)).size, 67 + 19);
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
    assert.equal(count(), "Showing 8 of 29 images");
    assert.equal(more.hidden, false);
    more.click();
    more.click();
    more.click();
    assert.equal(cards().length, 29);
    assert.equal(more.hidden, true);
    assert.equal(
      new Set(cards().map((card) => card.getAttribute("data-meme-card"))).size,
      29,
    );
    select("Ethereum");
    assert.equal(cards().length, 8);
    assert.equal(more.hidden, true);
    assert.equal(count(), "Showing 8 of 8 images · Ethereum");
    document
      .querySelector<HTMLButtonElement>('[data-meme-grid] [data-open-meme="ethereum-05-the-builders-garden"]')!
      .click();
    const modalImage = dialog.querySelector<HTMLImageElement>("[data-modal-image]")!;
    assert.equal(dialog.open, true);
    assert.match(modalImage.getAttribute("src")!, /images\/memes\/ethereum-05-the-builders-garden\.png$/);
    assert.equal(modalImage.alt, "Shiba exchanges ideas with researchers in a garden.");
    assert.equal(dialog.querySelector<HTMLTextAreaElement>("#meme-caption")!.value, "The Builders’ Garden");
    dialog.close();
    select("Wall Street");
    assert.equal(cards().length, 6);
    select("Trading Desk");
    assert.equal(cards().length, 5);
    select("Shiba Culture");
    assert.equal(cards().length, 0);
    assert.equal(empty(), 1);
    assert.equal(more.hidden, true);
    assert.equal(count(), "New images coming soon · Shiba Culture");
    assert.equal(
      document.querySelector('[data-meme-filter="Shiba Culture"]')!.getAttribute("aria-pressed"),
      "true",
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
