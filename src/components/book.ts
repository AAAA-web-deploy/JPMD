import { chapters, story } from "../content.ts";
import { asset, brandText, escapeHtml, icon, image, responsiveAttributes } from "../lib/html.ts";
import { mustQuery } from "../lib/browser.ts";

export function storyView(index: number): string {
  if (index === 0)
    return `<div class="story-cover"><picture><source media="(max-width:599px)"${responsiveAttributes(story.cover.mobileImage, "coverMobile") || ` srcset="${asset(story.cover.mobileImage)}"`} width="1254" height="1254" />${image(story.cover.wideImage, story.cover.wideAlt, "", false, 1774, 887, "coverWide")}</picture><div class="book-cover-title"><span>${escapeHtml(story.cover.eyebrow)}</span><strong>${brandText(story.cover.title)}</strong></div></div>`;
  const chapter = chapters[index - 1];
  if (!chapter) throw new RangeError("Story page is outside the book");
  return `<article class="story-page"><div class="story-art">${image(chapter.image, chapter.alt, "", false, 1254, 1254, "story")}</div><div class="story-page-copy"><span class="story-label">${escapeHtml(chapter.label)}</span><h3>${escapeHtml(chapter.title)}</h3><div class="story-paragraphs">${chapter.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</div><span class="page-number">${String(index).padStart(2, "0")} / 05</span></div></article>`;
}

export function renderBook(): string {
  return `<section id="lore" class="brand-story manual-story" aria-labelledby="story-title"><div class="story-intro"><span class="eyebrow block">${escapeHtml(story.section.eyebrow)}</span><h2 id="story-title">${escapeHtml(story.section.title).replace(/\.\s+/g, ".<br />")}</h2><p>${escapeHtml(story.section.introduction)}</p></div><div class="story-desktop"><div class="story-book" data-book><button type="button" class="book-arrow book-arrow-left" data-book-prev aria-label="Previous page" disabled>${icon("chevron-left")}</button><button type="button" class="book-arrow book-arrow-right" data-book-next aria-label="Next page">${icon("chevron-right")}</button><div class="story-turn" data-book-content>${storyView(0)}</div></div><nav class="chapter-navigation" aria-label="Story chapters"><button type="button" data-book-page="0" aria-current="step" aria-label="Story cover">Cover</button>${chapters.map((c, i) => `<button type="button" data-book-page="${i + 1}" aria-label="Chapter ${i + 1}: ${escapeHtml(c.title)}">${String(i + 1).padStart(2, "0")}</button>`).join("")}</nav><span class="story-status" data-book-status aria-live="polite">Cover</span></div></section>`;
}

export function initBook(): () => void {
  const section = mustQuery<HTMLElement>("#lore");
  const book = mustQuery<HTMLElement>("[data-book]", section);
  const content = mustQuery<HTMLElement>("[data-book-content]", section);
  const previous = mustQuery<HTMLButtonElement>("[data-book-prev]", section);
  const next = mustQuery<HTMLButtonElement>("[data-book-next]", section);
  const status = mustQuery<HTMLElement>("[data-book-status]", section);
  const buttons = [
    ...section.querySelectorAll<HTMLButtonElement>("[data-book-page]"),
  ];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let page = 0,
    locked = false,
    timeout = 0;
  let sheet: HTMLDivElement | null = null;

  function controls(): void {
    previous.disabled = locked || page === 0;
    next.disabled = locked || page === chapters.length;
    buttons.forEach((button) => {
      button.disabled = locked;
      if (Number(button.dataset.bookPage) === page)
        button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    status.textContent =
      page === 0 ? "Cover" : `Chapter ${page} · ${chapters[page - 1]!.title}`;
  }
  function complete(): void {
    window.clearTimeout(timeout);
    content.innerHTML = storyView(page);
    sheet?.remove();
    sheet = null;
    locked = false;
    controls();
  }
  function turn(target: number): void {
    if (locked || target === page || target < 0 || target > chapters.length)
      return;
    const old = page;
    page = target;
    if (reduced.matches) {
      complete();
      return;
    }
    locked = true;
    const backwards = target < old;
    content.innerHTML = storyView(backwards ? old : target);
    sheet = document.createElement("div");
    sheet.className = `story-flipping-sheet manual-flip${backwards ? " backward" : ""}`;
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML = storyView(backwards ? target : old);
    sheet.addEventListener("animationend", complete, { once: true });
    book.append(sheet);
    timeout = window.setTimeout(complete, 780);
    controls();
  }
  const click = (event: Event): void => {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button")
        : null;
    if (!target || target.disabled) return;
    if (target.hasAttribute("data-book-prev")) turn(page - 1);
    else if (target.hasAttribute("data-book-next")) turn(page + 1);
    else if (target.dataset.bookPage !== undefined)
      turn(Number(target.dataset.bookPage));
  };
  const keydown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      turn(page + (event.key === "ArrowRight" ? 1 : -1));
    }
  };
  const motionChanged = (): void => {
    if (reduced.matches && locked) complete();
  };
  section.addEventListener("click", click);
  section.addEventListener("keydown", keydown);
  reduced.addEventListener("change", motionChanged);
  return () => {
    window.clearTimeout(timeout);
    sheet?.remove();
    section.removeEventListener("click", click);
    section.removeEventListener("keydown", keydown);
    reduced.removeEventListener("change", motionChanged);
  };
}
