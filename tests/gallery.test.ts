import test from "node:test";
import assert from "node:assert/strict";
import { memes } from "../src/content.ts";
import {
  chooseCategory,
  expandGallery,
  filterMemes,
  shareUrl,
} from "../src/lib/gallery.ts";
import {
  initGallery,
  renderArchive,
  renderGalleryIntro,
  renderMemeDialog,
} from "../src/components/gallery.ts";
import { initBook, renderBook } from "../src/components/book.ts";
import { emulateNativeDialog, installDom } from "./dom.ts";

test("gallery pages end at 67 and category changes restart at eight", () => {
  let state = chooseCategory("All");
  const counts = [state.visible];
  while (state.visible < 67) {
    state = expandGallery(state, 67);
    counts.push(state.visible);
  }
  assert.deepEqual(counts, [8, 16, 24, 32, 40, 48, 56, 64, 67]);
  state = chooseCategory("Bearish");
  assert.equal(
    filterMemes(memes, state.category).slice(0, state.visible).length,
    5,
  );
  state = chooseCategory("All");
  assert.equal(state.visible, 8);
  assert.equal(
    new Set(filterMemes(memes, state.category).map((meme) => meme.id)).size,
    67,
  );
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
    select("Bullish");
    more.click();
    assert.equal(cards().length, 16);
    select("Bearish");
    assert.equal(cards().length, 5);
    assert.equal(more.hidden, true);
    select("All");
    assert.equal(cards().length, 8);
    assert.equal(more.hidden, false);
    for (let n = 0; n < 8; n++) more.click();
    assert.equal(cards().length, 67);
    assert.equal(more.hidden, true);
    assert.equal(
      new Set(cards().map((card) => card.getAttribute("data-meme-card"))).size,
      67,
    );
    select("Community");
    assert.equal(cards().length, 8);
    more.click();
    assert.equal(cards().length, 10);
    select("All");
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
