import { heroVideo, siteConfig } from "../config.ts";
import { asset, brandText, escapeHtml as e, icon, image, officialLink } from "../lib/html.ts";

const pauseIcon = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>`;
const playIcon = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 2.2 13.5 8l-9 5.8z" fill="currentColor"/></svg>`;
const movieLabel = "Shiba P. Morgan Inu in a pinstripe suit, leaning on a bronze bull";

function heroMedia(): string {
  if (!heroVideo)
    return `<div class="hero-frame hero-frame-still">${image("images/brand/shiba-portrait-clean.png", "The black-and-tan Shiba banker in a charcoal suit, without a name or token symbol in the artwork.", "hero-poster", true)}</div>`;
  const { src, type, poster, width, height } = heroVideo;
  return `<div class="hero-frame" style="--hero-ratio:${width} / ${height}" data-hero-frame><img src="${asset(poster)}" alt="" class="hero-poster" width="${width}" height="${height}" loading="eager" decoding="async" fetchpriority="high" /><video class="hero-video" autoplay muted loop playsinline preload="auto" poster="${asset(poster)}" width="${width}" height="${height}" aria-label="${e(movieLabel)} (silent loop)" data-hero-video><source src="${asset(src)}" type="${e(type)}" /></video><button type="button" class="hero-motion-toggle" aria-label="Pause the Shiba movie" data-hero-toggle hidden>${pauseIcon}</button></div>`;
}

export function renderHero(): string {
  return `<section id="home" class="hero" aria-labelledby="hero-title"><div class="hero-glow" aria-hidden="true"></div><div class="hero-inner"><div class="hero-copy"><p class="eyebrow"><span aria-hidden="true"></span>A SHIBA. A SUIT. AN ETHEREUM STORY.</p><h1 id="hero-title">${siteConfig.headlineLines.map((line) => `<span>${brandText(line)}</span>`).join("")}</h1><h2>WALL STREET’S<br class="desktop-break" /> NEW BEST FRIEND.</h2><p class="description">Old money. Open ledgers. A very different Shiba. Follow a fictional Wall Street journey into Ethereum—and meet the dog who steals the room.</p><div class="actions"><a class="buy-button" href="#lore">MEET SHIBA<span class="arrow">${icon("arrow-up-right")}</span></a><a class="secondary-button exchange-button" href="#studio">${icon("plus")}<span><small>MAKE IT YOURS</small>SHIBA STUDIO</span></a>${officialLink(siteConfig.chartUrl, `${icon("chart")}<span><small>${siteConfig.chartUrl ? "VIEW THE" : "COMING SOON"}</small>OFFICIAL CHART</span>`, "secondary-button exchange-button", "Official chart")}<a class="secondary-button exchange-button" href="#community">${icon("social-telegram")}<span><small>FIND THE</small>COMMUNITY</span></a></div></div><figure class="hero-stage"><span class="hero-halo" aria-hidden="true"></span><svg class="hero-orbits" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g class="hero-orbit-slow"><ellipse cx="50" cy="50" rx="44" ry="31" transform="rotate(-18 50 50)" /><circle cx="88" cy="63" r="1.1" /></g><g class="hero-orbit-slower"><ellipse cx="50" cy="50" rx="48" ry="48" /><circle cx="22" cy="14" r="0.8" /></g></svg>${heroMedia()}<p class="hero-hello">Hey, I’m Shiba.</p></figure></div></section>`;
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
 * the page is shown, and the tab is visible. Entering the active state restarts the clip
 * from 0; leaving pauses it. Native `loop` repeats the clip while active. A generation
 * token cancels stale play()/seek work, so late promises never resume a departed hero.
 */
function initHeroVideo(): () => void {
  const video = document.querySelector<HTMLVideoElement>("[data-hero-video]");
  const frame = video?.closest<HTMLElement>("[data-hero-frame]");
  const toggle = frame?.querySelector<HTMLButtonElement>("[data-hero-toggle]");
  if (!video || !frame || !toggle) return () => {};
  const hero = frame.closest<HTMLElement>("#home") ?? frame;
  const source = video.querySelector("source");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const signal = controller.signal;
  let choice: "play" | "pause" | null = null;
  let onScreen = false;
  let shown = true;
  let active = false;
  let failed = false;
  let blocked = false;
  let generation = 0;
  let pendingSeek: (() => void) | null = null;

  const wantsMotion = (): boolean => (choice ? choice === "play" : !reduced.matches);
  function render(): void {
    const on = wantsMotion() && !blocked && !failed;
    toggle!.hidden = failed;
    toggle!.innerHTML = on ? pauseIcon : playIcon;
    toggle!.setAttribute("aria-label", on ? "Pause the Shiba movie" : "Play the Shiba movie");
  }
  function halt(): void {
    generation++;
    pendingSeek = null;
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
        blocked = true;
        frame!.classList.remove("is-playing");
        render();
      });
  }
  function restart(): void {
    const token = ++generation;
    blocked = false;
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
  function evaluate(): void {
    const now = onScreen && shown && !document.hidden && !failed;
    if (now !== active) {
      active = now;
      if (!now) halt();
      else if (wantsMotion()) restart();
    } else if (!now && !video!.paused) halt();
    render();
  }
  function fail(): void {
    failed = true;
    halt();
    frame!.classList.remove("is-playing");
    render();
  }

  video.addEventListener("loadedmetadata", runPendingSeek, { signal });
  video.addEventListener(
    "playing",
    () => {
      if (!active || !wantsMotion()) video.pause();
      else frame.classList.add("is-playing");
    },
    { signal },
  );
  video.addEventListener("error", fail, { signal });
  source?.addEventListener("error", fail, { signal });
  toggle.addEventListener(
    "click",
    () => {
      if (wantsMotion() && !blocked) {
        choice = "pause";
        halt();
      } else {
        choice = "play";
        if (blocked) restart();
        else if (active) attempt(++generation);
      }
      render();
    },
    { signal },
  );
  reduced.addEventListener(
    "change",
    () => {
      if (choice !== null) return;
      if (reduced.matches) {
        halt();
        frame.classList.remove("is-playing");
      } else if (active) restart();
      render();
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
  else if (!wantsMotion()) {
    video.pause();
    frame.classList.remove("is-playing");
  }
  render();
  return () => {
    controller.abort();
    observer.disconnect();
    generation++;
    pendingSeek = null;
  };
}
