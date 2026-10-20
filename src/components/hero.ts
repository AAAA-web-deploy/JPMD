import { heroVideo, siteConfig } from "../config.ts";
import { asset, brandText, escapeHtml as e, icon, image, officialLink } from "../lib/html.ts";

const movieLabel = "Shiba P. Morgan Inu in a pinstripe suit, leaning on a bronze bull";
/** Pause after each play-through before the clip starts again (5 s clip + 4 s = 9 s cycle). */
export const heroReplayDelayMs = 4000;

function heroMedia(): string {
  if (!heroVideo)
    return `<div class="hero-frame hero-frame-still">${image("images/brand/shiba-portrait-clean.png", "The black-and-tan Shiba banker in a charcoal suit, without a name or token symbol in the artwork.", "hero-poster", true)}</div>`;
  const { src, type, poster, width, height } = heroVideo;
  return `<div class="hero-frame" style="--hero-ratio:${width} / ${height}" data-hero-frame><img src="${asset(poster)}" alt="" class="hero-poster" width="${width}" height="${height}" loading="eager" decoding="async" fetchpriority="high" /><video class="hero-video" autoplay muted playsinline preload="auto" poster="${asset(poster)}" width="${width}" height="${height}" aria-label="${e(movieLabel)} (silent, repeats every 9 seconds)" data-hero-video><source src="${asset(src)}" type="${e(type)}" /></video></div>`;
}

export function renderHero(): string {
  return `<section id="home" class="hero" aria-labelledby="hero-title"><div class="hero-glow" aria-hidden="true"></div><div class="hero-inner"><div class="hero-copy"><p class="eyebrow"><span aria-hidden="true"></span>A SHIBA. A SUIT. AN ETHEREUM STORY.</p><h1 id="hero-title">${siteConfig.headlineLines.map((line) => `<span>${brandText(line)}</span>`).join("")}</h1><h2>WALL STREET’S<br class="desktop-break" /> NEW BEST FRIEND.</h2><p class="description">Old money. Open ledgers. A very different Shiba. Follow a fictional Wall Street journey into Ethereum—and meet the dog who steals the room.</p><div class="actions"><a class="buy-button" href="#lore">MEET SHIBA<span class="arrow">${icon("arrow-up-right")}</span></a><a class="secondary-button exchange-button" href="#studio">${icon("plus")}<span><small>MAKE IT YOURS</small>SHIBA STUDIO</span></a>${officialLink(siteConfig.chartUrl, `${icon("chart")}<span><small>${siteConfig.chartUrl ? "VIEW THE" : "COMING SOON"}</small>OFFICIAL CHART</span>`, "secondary-button exchange-button", "Official chart")}<a class="secondary-button exchange-button" href="#community">${icon("social-telegram")}<span><small>FIND THE</small>COMMUNITY</span></a></div></div><figure class="hero-stage"><span class="hero-halo" aria-hidden="true"></span>${heroMedia()}</figure></div></section>`;
}

/** Sizes the hero below the sticky header, whose height changes when the navigation wraps. */
function fitBelowHeader(): () => void {
  const hero = document.querySelector<HTMLElement>("#home");
  const header = document.querySelector<HTMLElement>(".header");
  if (!hero || !header || typeof ResizeObserver === "undefined") return () => {};
  const observer = new ResizeObserver(() =>
    hero.style.setProperty("--hero-header", `${header.offsetHeight}px`),
  );
  observer.observe(header);
  return () => observer.disconnect();
}

export function initHero(): () => void {
  const unfit = fitBelowHeader();
  const stopVideo = initHeroVideo();
  return () => {
    unfit();
    stopVideo();
  };
}

/**
 * One controller for hero playback. The hero is "active" while it intersects the viewport,
 * the page is shown, and the tab is visible. Entering the active state starts the clip from
 * 0; each play-through is followed by a fixed pause before it starts again from 0; leaving
 * pauses it and cancels any pending replay. A generation token cancels stale play()/seek/timer
 * work, so late promises never resume a departed hero.
 */
function initHeroVideo(): () => void {
  const video = document.querySelector<HTMLVideoElement>("[data-hero-video]");
  const frame = video?.closest<HTMLElement>("[data-hero-frame]");
  if (!video || !frame) return () => {};
  const hero = frame.closest<HTMLElement>("#home") ?? frame;
  const source = video.querySelector("source");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const signal = controller.signal;
  let onScreen = false;
  let shown = true;
  let active = false;
  let failed = false;
  let generation = 0;
  let pendingSeek: (() => void) | null = null;
  let replayTimer: ReturnType<typeof setTimeout> | undefined;
  let awaitingGesture = false;

  video.loop = false;
  function halt(): void {
    generation++;
    pendingSeek = null;
    clearTimeout(replayTimer);
    if (!video!.paused) video!.pause();
  }
  function attempt(token: number): void {
    video!.playbackRate = 1;
    video!
      .play()
      .then(() => {
        if (token !== generation) video!.pause();
      })
      .catch((error: unknown) => {
        if (token !== generation) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        frame!.classList.remove("is-playing");
        retryOnGesture();
      });
  }
  function restart(): void {
    halt();
    const token = generation;
    pendingSeek = () => {
      if (token !== generation) return;
      video!.currentTime = 0;
      attempt(token);
    };
    if (video!.readyState >= 1) runPendingSeek();
  }
  function runPendingSeek(): void {
    const run = pendingSeek;
    pendingSeek = null;
    run?.();
  }
  /** Autoplay was refused; the poster stays until the visitor's first interaction. */
  function retryOnGesture(): void {
    if (awaitingGesture) return;
    awaitingGesture = true;
    const retry = (): void => {
      awaitingGesture = false;
      for (const type of gestures) document.removeEventListener(type, retry);
      if (active && !reduced.matches) restart();
    };
    const gestures = ["pointerdown", "keydown", "touchstart"] as const;
    for (const type of gestures)
      document.addEventListener(type, retry, { signal, once: true, passive: true });
  }
  function evaluate(): void {
    const now = onScreen && shown && !document.hidden && !failed;
    if (now === active) return;
    active = now;
    if (!now) halt();
    else if (!reduced.matches) restart();
  }
  function fail(): void {
    failed = true;
    halt();
    frame!.classList.remove("is-playing");
  }

  video.addEventListener("loadedmetadata", runPendingSeek, { signal });
  video.addEventListener(
    "playing",
    () => {
      if (!active || reduced.matches) video.pause();
      else frame.classList.add("is-playing");
    },
    { signal },
  );
  video.addEventListener(
    "ended",
    () => {
      if (!active || reduced.matches) return;
      clearTimeout(replayTimer);
      const token = generation;
      replayTimer = setTimeout(() => {
        if (token === generation && active) restart();
      }, heroReplayDelayMs);
    },
    { signal },
  );
  video.addEventListener("error", fail, { signal });
  source?.addEventListener("error", fail, { signal });
  reduced.addEventListener(
    "change",
    () => {
      if (reduced.matches) {
        halt();
        frame.classList.remove("is-playing");
      } else if (active) restart();
    },
    { signal },
  );
  document.addEventListener("visibilitychange", evaluate, { signal });
  window.addEventListener(
    "pagehide",
    () => {
      shown = false;
      evaluate();
    },
    { signal },
  );
  window.addEventListener(
    "pageshow",
    () => {
      shown = true;
      evaluate();
    },
    { signal },
  );
  const observer = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1]!.isIntersecting;
    evaluate();
  });
  observer.observe(hero);

  if (video.error) fail();
  else if (reduced.matches) {
    video.pause();
    frame.classList.remove("is-playing");
  }
  return () => {
    controller.abort();
    observer.disconnect();
    halt();
  };
}
