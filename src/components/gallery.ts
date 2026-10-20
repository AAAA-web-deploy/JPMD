import { memes } from "../content.ts";
import { siteConfig } from "../config.ts";
import {
  categories,
  chooseCategory,
  downloadName,
  expandGallery,
  filterMemes,
  isCategory,
  PAGE_SIZE,
  shareUrl,
} from "../lib/gallery.ts";
import type { Meme } from "../lib/gallery.ts";
import {
  asset,
  escapeHtml,
  icon,
  image,
  safeExternalUrl,
} from "../lib/html.ts";
import { announce, copyText, downloadFile, mustQuery } from "../lib/browser.ts";

const byId = new Map(memes.map((meme) => [meme.id, meme]));

function shareActions(meme: Meme): string {
  return `<div class="meme-share-actions"><button type="button" data-meme-action="download" data-meme-id="${meme.id}" aria-label="Download image: ${escapeHtml(meme.caption)}">${icon("download")}<span>Download</span></button><button type="button" data-meme-action="copy" data-meme-id="${meme.id}" aria-label="Copy caption: ${escapeHtml(meme.caption)}">${icon("copy")}<span>Copy</span></button><a data-share-meme="${meme.id}" href="${escapeHtml(shareUrl(meme.caption, ""))}" target="_blank" rel="noopener noreferrer" aria-label="Share caption on X: ${escapeHtml(meme.caption)}">${icon("social-x")}<span>Share</span></a></div>`;
}
export function memeCard(meme: Meme): string {
  return `<article class="meme-card" data-meme-card="${meme.id}"><button type="button" class="meme-image-link" data-open-meme="${meme.id}" aria-label="Open image: ${escapeHtml(meme.caption)}">${image(meme.path, meme.alt)}</button><h3>${escapeHtml(meme.caption)}</h3>${shareActions(meme)}</article>`;
}
export function renderGalleryIntro(): string {
  return `<p class="meme-greeting">A sharp suit. Every possible mood.</p><h2 id="meme-title">Meet the many moods of <span>Shiba.</span></h2><p class="meme-intro">Find your reaction. Make it your caption. Take the Shiba with you.</p><div class="meme-filters" role="group" aria-label="Filter memes by category">${categories.map((category) => `<button type="button" data-meme-filter="${escapeHtml(category)}" aria-pressed="${category === "All"}">${escapeHtml(category)}</button>`).join("")}</div><p class="meme-count" data-meme-count aria-live="polite">Showing 8 of 67 images</p><div class="meme-grid" data-meme-grid>${memes.slice(0, PAGE_SIZE).map(memeCard).join("")}</div><button type="button" class="meme-more" data-meme-more>Show 8 more ${icon("plus")}</button>`;
}
export function renderStrip(direction: "left" | "right"): string {
  const items = memes.filter(
    (_, index) => index % 2 === (direction === "left" ? 0 : 1),
  );
  const group = (clone: boolean): string =>
    `<div class="image-strip-group"${clone ? ' aria-hidden="true"' : ""}>${items.map((meme) => `<button type="button" class="strip-image-button" data-open-meme="${meme.id}" aria-label="Open image: ${escapeHtml(meme.caption)}"${clone ? ' tabindex="-1"' : ""}>${image(meme.path, clone ? "" : meme.alt)}</button>`).join("")}</div>`;
  return `<div class="image-strip image-strip-${direction}" aria-label="Shiba image collection moving ${direction}"><div class="image-strip-track">${group(false)}${group(true)}</div></div>`;
}
export function renderArchive(): string {
  return `<section class="meme-archive" aria-labelledby="archive-title"><h2 id="archive-title">The whole <span>pack.</span></h2><p class="meme-intro">67 images. Find the face for your next message.</p><div class="meme-archive-grid">${memes.map((meme) => `<button type="button" data-open-meme="${meme.id}" aria-label="Open image: ${escapeHtml(meme.caption)}">${image(meme.path, meme.alt)}</button>`).join("")}</div></section>`;
}
export function renderMemeDialog(): string {
  return `<dialog class="meme-modal" id="meme-dialog" aria-labelledby="meme-modal-title"><div class="meme-modal-heading"><h3 id="meme-modal-title">Your Shiba moment.</h3><button type="button" data-modal-close aria-label="Close image">${icon("close")}</button></div><img class="meme-modal-image" data-modal-image alt="" width="1254" height="1254" /><label for="meme-caption">Make the caption yours</label><textarea id="meme-caption" rows="3" maxlength="1000" spellcheck="true"></textarea><div class="meme-share-actions"><button type="button" data-modal-download>${icon("download")}Download</button><button type="button" data-modal-copy>${icon("copy")}Copy caption</button><a data-modal-share href="https://x.com/intent/tweet" target="_blank" rel="noopener noreferrer">${icon("social-x")}Share on X</a></div><p class="meme-modal-note">Captions stay separate. The downloaded artwork has no added text.</p></dialog>`;
}

export function initGallery(): () => void {
  const app = mustQuery<HTMLElement>("#app");
  const grid = mustQuery<HTMLElement>("[data-meme-grid]");
  const more = mustQuery<HTMLButtonElement>("[data-meme-more]");
  const count = mustQuery<HTMLElement>("[data-meme-count]");
  const dialog = mustQuery<HTMLDialogElement>("#meme-dialog");
  const modalImage = mustQuery<HTMLImageElement>("[data-modal-image]", dialog);
  const caption = mustQuery<HTMLTextAreaElement>("#meme-caption", dialog);
  const modalShare = mustQuery<HTMLAnchorElement>("[data-modal-share]", dialog);
  const modalClose = mustQuery<HTMLButtonElement>("[data-modal-close]", dialog);
  let state = chooseCategory("All");
  let selected: Meme | null = null;
  let returnFocus: HTMLElement | null = null;
  let savedOverflow = "";

  const imageUrl = (meme: Meme): string =>
    new URL(
      asset(meme.path),
      safeExternalUrl(siteConfig.canonicalUrl) ?? window.location.origin,
    ).href;
  function updateShares(): void {
    app
      .querySelectorAll<HTMLAnchorElement>("[data-share-meme]")
      .forEach((anchor) => {
        const meme = byId.get(anchor.dataset.shareMeme ?? "");
        if (meme) anchor.href = shareUrl(meme.caption, imageUrl(meme));
      });
  }
  function renderVisible(): void {
    const filtered = filterMemes(memes, state.category);
    const visible = filtered.slice(0, state.visible);
    grid.innerHTML = visible.map(memeCard).join("");
    count.textContent = `Showing ${visible.length} of ${filtered.length} images${state.category === "All" ? "" : ` · ${state.category}`}`;
    app
      .querySelectorAll<HTMLButtonElement>("[data-meme-filter]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.memeFilter === state.category),
        ),
      );
    const remaining = filtered.length - visible.length;
    more.hidden = remaining <= 0;
    more.innerHTML = `Show ${Math.min(PAGE_SIZE, remaining)} more ${icon("plus")}`;
    updateShares();
  }
  function updateModalShare(): void {
    if (selected) modalShare.href = shareUrl(caption.value, imageUrl(selected));
  }
  function open(meme: Meme, trigger: HTMLElement): void {
    if (dialog.open) return;
    selected = meme;
    returnFocus = trigger;
    savedOverflow = document.body.style.overflow;
    modalImage.src = asset(meme.path);
    modalImage.alt = meme.alt;
    caption.value = meme.caption;
    updateModalShare();
    try {
      dialog.showModal();
    } catch {
      announce(
        "The image viewer could not open in this browser. You can still download the image.",
      );
      return;
    }
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }
  function closed(): void {
    document.body.style.overflow = savedOverflow;
    selected = null;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }
  const click = async (event: MouseEvent): Promise<void> => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("button, a")
        : null;
    if (!button || (button instanceof HTMLButtonElement && button.disabled))
      return;
    if (button.dataset.memeFilter && isCategory(button.dataset.memeFilter)) {
      state = chooseCategory(button.dataset.memeFilter);
      renderVisible();
    } else if (button.hasAttribute("data-meme-more")) {
      state = expandGallery(state, filterMemes(memes, state.category).length);
      renderVisible();
    } else if (button.dataset.openMeme) {
      const meme = byId.get(button.dataset.openMeme);
      if (meme) open(meme, button);
    } else if (button.dataset.memeAction) {
      const meme = byId.get(button.dataset.memeId ?? "");
      if (!meme) return;
      if (button.dataset.memeAction === "download")
        downloadFile(asset(meme.path), downloadName(meme));
      if (button.dataset.memeAction === "copy")
        announce(
          (await copyText(meme.caption))
            ? "Caption copied."
            : "Copy was unavailable. Open the image to select the caption.",
        );
    }
  };
  const modalClick = async (event: MouseEvent): Promise<void> => {
    const target =
      event.target instanceof Element ? event.target.closest("button") : null;
    if (target?.hasAttribute("data-modal-close")) dialog.close();
    else if (selected && target?.hasAttribute("data-modal-download"))
      downloadFile(asset(selected.path), downloadName(selected));
    else if (selected && target?.hasAttribute("data-modal-copy"))
      announce(
        (await copyText(caption.value))
          ? "Caption copied."
          : "Please select and copy the caption manually.",
      );
    else if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }
  };
  app.addEventListener("click", click);
  dialog.addEventListener("click", modalClick);
  dialog.addEventListener("close", closed);
  const cancel = (event: Event): void => {
    event.preventDefault();
    dialog.close();
  };
  dialog.addEventListener("cancel", cancel);
  const escape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !dialog.open) return;
    event.preventDefault();
    dialog.close();
  };
  dialog.addEventListener("keydown", escape);
  caption.addEventListener("input", updateModalShare);
  updateShares();
  return () => {
    if (dialog.open) dialog.close();
    app.removeEventListener("click", click);
    dialog.removeEventListener("click", modalClick);
    dialog.removeEventListener("close", closed);
    dialog.removeEventListener("cancel", cancel);
    dialog.removeEventListener("keydown", escape);
    caption.removeEventListener("input", updateModalShare);
  };
}
