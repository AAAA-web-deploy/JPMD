import { voices, voicesSection } from "../content.ts";
import { mustQuery } from "../lib/browser.ts";
import { clamp, pinnedProgress, stageIndex, stageScrollTarget } from "../lib/geometry.ts";
import { escapeHtml as e, image, safeExternalUrl } from "../lib/html.ts";

const counter = (index: number): string => String(index + 1).padStart(2, "0");

/** #ethereum: three ordinary stacked cards in the markup; initVoices() upgrades them to pinned reading stages. */
export function renderVoices(): string {
  const panels = voices
    .map((voice, index) => {
      const source = safeExternalUrl(voice.sourceUrl);
      return `<article class="voice" id="voice-${voice.id}" data-voice="${index}" aria-labelledby="voice-name-${voice.id}"><div class="voice-portrait">${image(voice.image, voice.alt, "", false, voice.width, voice.height, "voices")}</div><figure class="voice-copy"><blockquote class="voice-quote"><p>${e(voice.quote)}</p></blockquote><figcaption><strong class="voice-name" id="voice-name-${voice.id}">${e(voice.name)}</strong><span class="voice-role">${e(voice.role)}</span>${source ? `<a class="voice-source" href="${e(source)}" target="_blank" rel="noopener noreferrer" aria-label="${e(voice.sourceLabel)} for ${e(voice.name)} (opens in a new tab)">${e(voice.sourceLabel)}</a>` : ""}</figcaption></figure></article>`;
    })
    .join("");
  const selectors = voices
    .map(
      (voice, index) =>
        `<button type="button" class="voices-selector" data-voice-select="${index}" aria-controls="voice-${voice.id}" aria-pressed="${index === 0}">${e(voice.name)}</button>`,
    )
    .join("");
  return `<section id="ethereum" class="voices" aria-labelledby="voices-title" data-voices><div class="voices-stage" data-voices-stage><div class="voices-inner" data-voices-inner><header class="voices-heading"><h2 id="voices-title">${e(voicesSection.title)}</h2><p>${e(voicesSection.subtitle)}</p></header><div class="voices-panels">${panels}</div><div class="voices-controls"><p class="voices-progress"><span data-voices-current>${counter(0)}</span> / ${counter(voices.length - 1)}</p><div class="voices-selectors" role="group" aria-label="Speakers">${selectors}</div></div></div></div></section>`;
}

type Mode = "pinned" | "stacked";

export function initVoices(): () => void {
  const section = mustQuery<HTMLElement>("[data-voices]");
  const stage = mustQuery<HTMLElement>("[data-voices-stage]", section);
  const inner = mustQuery<HTMLElement>("[data-voices-inner]", section);
  const current = mustQuery<HTMLElement>("[data-voices-current]", section);
  const panels = [...section.querySelectorAll<HTMLElement>("[data-voice]")];
  const buttons = [...section.querySelectorAll<HTMLButtonElement>("[data-voice-select]")];
  const header = document.querySelector<HTMLElement>(".header");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const supportsObserver = typeof IntersectionObserver !== "undefined";
  let mode: Mode = "stacked";
  let active = -1;
  let frame = 0;
  let headerHeight = 0;
  let near = !supportsObserver;
  let entered = false;
  let prepared = false;
  let running: Animation[] = [];

  function prepareImages(): void {
    if (prepared) return;
    prepared = true;
    for (const img of section.querySelectorAll<HTMLImageElement>(".voice-portrait img")) {
      img.loading = "eager";
      img.decode?.().catch(() => {});
    }
  }

  function stopAnimations(): void {
    for (const animation of running) animation.cancel();
    running = [];
  }

  function animateIn(panel: HTMLElement, duration: number): void {
    stopAnimations();
    const portrait = panel.querySelector<HTMLElement>(".voice-portrait");
    const copy = panel.querySelector<HTMLElement>(".voice-copy");
    if (!portrait?.animate || !copy?.animate) return;
    const easing = "cubic-bezier(0.2, 0.7, 0.2, 1)";
    running = [
      portrait.animate(
        [
          {
            opacity: 0,
            transform: `translateY(${voicesSection.portraitTranslationPx}px) scale(${voicesSection.portraitStartScale})`,
          },
          { opacity: 1, transform: "none" },
        ],
        { duration, easing },
      ),
      copy.animate(
        [
          { opacity: 0, transform: `translateY(${voicesSection.quoteTranslationPx}px)` },
          { opacity: 1, transform: "none" },
        ],
        { duration, easing },
      ),
    ];
    for (const animation of running) animation.finished.catch(() => {});
  }

  function highlight(index: number): void {
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    current.textContent = counter(index);
  }

  /** Stacked cards are ordinary content: no hidden, inert, or transformed panels. */
  function restorePanels(): void {
    stopAnimations();
    for (const panel of panels) {
      panel.classList.remove("is-active");
      panel.removeAttribute("inert");
      panel.removeAttribute("aria-hidden");
    }
  }

  function show(index: number): void {
    if (index === active) return;
    const first = active === -1;
    active = index;
    panels.forEach((panel, i) => {
      const on = i === index;
      panel.classList.toggle("is-active", on);
      panel.toggleAttribute("inert", !on);
      if (on) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");
    });
    highlight(index);
    const panel = panels[index];
    if (!first && panel) animateIn(panel, voicesSection.transitionMs);
  }

  function update(): void {
    frame = 0;
    if (mode === "pinned") {
      const rect = section.getBoundingClientRect();
      const progress = pinnedProgress(rect.top, rect.height, stage.getBoundingClientRect().height, headerHeight);
      show(stageIndex(progress, panels.length));
      return;
    }
    const line = headerHeight + window.innerHeight * 0.35;
    let index = 0;
    panels.forEach((panel, i) => {
      if (panel.getBoundingClientRect().top <= line) index = i;
    });
    highlight(index);
  }

  const queue = (): void => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onScroll = (): void => {
    if (!near) {
      if (supportsObserver) return;
      if (section.getBoundingClientRect().top < window.innerHeight * 2) prepareImages();
    }
    queue();
  };

  function layout(): void {
    headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
    section.style.setProperty("--voices-top", `${headerHeight}px`);
    let next: Mode = reduced.matches ? "stacked" : "pinned";
    section.classList.toggle("is-pinned", next === "pinned");
    // Too short for the whole composition (small screens, large text, zoom): keep the stacked cards.
    if (next === "pinned" && inner.offsetHeight > stage.clientHeight) next = "stacked";
    section.classList.toggle("is-pinned", next === "pinned");
    section.dataset.voicesMode = next;
    if (next !== mode) {
      mode = next;
      active = -1;
      restorePanels();
    }
    if (frame) cancelAnimationFrame(frame);
    update();
  }

  function select(event: Event): void {
    const button = (event.currentTarget as HTMLButtonElement | null) ?? null;
    const index = Number(button?.dataset.voiceSelect);
    const panel = panels[index];
    if (!panel) return;
    prepareImages();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const top =
      mode === "pinned"
        ? stageScrollTarget(index, panels.length, {
            scrollY: window.scrollY,
            top: section.getBoundingClientRect().top,
            height: section.getBoundingClientRect().height,
            stageHeight: stage.getBoundingClientRect().height,
            headerHeight,
            maxScroll,
          })
        : clamp(window.scrollY + panel.getBoundingClientRect().top - headerHeight - 24, 0, Math.max(0, maxScroll));
    window.scrollTo({ top, behavior: reduced.matches ? "auto" : "smooth" });
  }

  const nearObserver = supportsObserver
    ? new IntersectionObserver(
        ([entry]) => {
          near = entry?.isIntersecting ?? true;
          if (near) {
            prepareImages();
            queue();
          }
        },
        { rootMargin: "100% 0px" },
      )
    : null;
  const entryObserver = supportsObserver
    ? new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting || entered) return;
        entered = true;
        const panel = panels[active];
        if (mode === "pinned" && panel && entry.boundingClientRect.top > headerHeight)
          animateIn(panel, voicesSection.entryMs);
      })
    : null;
  const headerObserver =
    header && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => layout()) : null;

  layout();
  nearObserver?.observe(section);
  entryObserver?.observe(section);
  if (header) headerObserver?.observe(header);
  for (const button of buttons) button.addEventListener("click", select);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", layout, { passive: true });
  reduced.addEventListener("change", layout);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    nearObserver?.disconnect();
    entryObserver?.disconnect();
    headerObserver?.disconnect();
    for (const button of buttons) button.removeEventListener("click", select);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", layout);
    reduced.removeEventListener("change", layout);
    restorePanels();
    section.classList.remove("is-pinned");
    section.style.removeProperty("--voices-top");
    delete section.dataset.voicesMode;
    highlight(0);
  };
}
