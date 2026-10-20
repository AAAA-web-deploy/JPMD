import { heroVideo, siteConfig } from "../config.ts";
import { asset, brandText, escapeHtml as e, icon, image, officialLink } from "../lib/html.ts";

const pauseIcon = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>`;
const playIcon = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 2.2 13.5 8l-9 5.8z" fill="currentColor"/></svg>`;
const movieLabel = "Shiba P. Morgan Inu in a pinstripe suit, leaning on a bronze bull on a sunlit city street";

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

/** Muted looping playback that honors reduced motion, a manual pause, visibility, and failures. */
function initHeroVideo(): () => void {
  const video = document.querySelector<HTMLVideoElement>("[data-hero-video]");
  const frame = video?.closest<HTMLElement>("[data-hero-frame]");
  const toggle = frame?.querySelector<HTMLButtonElement>("[data-hero-toggle]");
  if (!video || !frame || !toggle) return () => {};
  const source = video.querySelector("source");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const signal = controller.signal;
  let choice: "play" | "pause" | null = null;
  let onScreen = true;
  let failed = false;
  let blocked = false;

  const intended = (): boolean => (choice ? choice === "play" : !reduced.matches);
  function render(): void {
    const on = intended() && !blocked && !failed;
    toggle!.hidden = failed;
    toggle!.innerHTML = on ? pauseIcon : playIcon;
    toggle!.setAttribute("aria-label", on ? "Pause the Shiba movie" : "Play the Shiba movie");
  }
  function sync(): void {
    if (failed) return;
    const run = intended() && !blocked && onScreen && !document.hidden;
    if (run && video!.paused) {
      video!.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        blocked = true;
        frame!.classList.remove("is-playing");
        render();
      });
    } else if (!run && !video!.paused) video!.pause();
    if (!intended() && choice === null) frame!.classList.remove("is-playing");
    render();
  }
  function fail(): void {
    failed = true;
    frame!.classList.remove("is-playing");
    video!.pause();
    render();
  }

  video.addEventListener("playing", () => {
    if (intended()) frame.classList.add("is-playing");
    else video.pause();
  }, { signal });
  video.addEventListener("error", fail, { signal });
  source?.addEventListener("error", fail, { signal });
  toggle.addEventListener("click", () => {
    const on = intended() && !blocked;
    choice = on ? "pause" : "play";
    blocked = false;
    sync();
  }, { signal });
  document.addEventListener("visibilitychange", sync, { signal });
  reduced.addEventListener("change", sync, { signal });
  const observer = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    sync();
  });
  observer.observe(frame);

  if (video.error) fail();
  else {
    if (!video.paused && intended()) frame.classList.add("is-playing");
    sync();
  }
  return () => {
    controller.abort();
    observer.disconnect();
  };
}
