import "./styles/main.css";
import { siteConfig } from "./config.ts";
import { renderPage } from "./components/page.ts";
import { initBook } from "./components/book.ts";
import { initGallery, initImageStrips } from "./components/gallery.ts";
import { initHero } from "./components/hero.ts";
import { initBullRun } from "./components/bullRun.ts";
import { announce, copyText, mustQuery } from "./lib/browser.ts";
import { initVoices } from "./components/voices.ts";
import { icon, safeExternalUrl } from "./lib/html.ts";

function initNavigation(): () => void {
  const header = mustQuery<HTMLElement>(".header");
  const toggle = mustQuery<HTMLButtonElement>("[data-menu-toggle]");
  const nav = mustQuery<HTMLElement>("#navigation");
  const controller = new AbortController();
  const signal = controller.signal;
  function close(focus = false): void {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    toggle.innerHTML = icon("menu");
    if (focus) toggle.focus();
  }
  toggle.addEventListener(
    "click",
    () => {
      if (nav.classList.contains("is-open")) {
        close();
        return;
      }
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation");
      toggle.innerHTML = icon("close");
    },
    { signal },
  );
  nav.addEventListener(
    "click",
    (event) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a")
          : null;
      if (!anchor || !nav.classList.contains("is-open")) return;
      close();
      if (anchor.hash) {
        const destination = document.getElementById(anchor.hash.slice(1));
        if (destination) {
          destination.setAttribute("tabindex", "-1");
          destination.focus({ preventScroll: true });
        }
      }
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open"))
        close(true);
    },
    { signal },
  );
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.target instanceof Node && !header.contains(event.target))
        close();
    },
    { signal },
  );
  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 800) close();
    },
    { signal },
  );
  return () => controller.abort();
}

function initContract(): () => void {
  const button = mustQuery<HTMLButtonElement>("[data-copy-contract]");
  const copy = async (): Promise<void> => {
    if (siteConfig.contractAddress)
      announce(
        (await copyText(siteConfig.contractAddress))
          ? "Official address copied."
          : "Please select and copy the official address manually.",
      );
  };
  button.addEventListener("click", copy);
  return () => button.removeEventListener("click", copy);
}

function updateMetadata(): void {
  document.title = `${siteConfig.name} — A Wall Street / Ethereum Story`;
  const canonical = safeExternalUrl(siteConfig.canonicalUrl);
  if (!canonical) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.append(link);
  }
  link.href = canonical;
  const image = document.querySelector<HTMLMetaElement>(
    'meta[property="og:image"]',
  );
  if (image)
    image.content = new URL(
      "/images/community/closing-panorama-v2.png",
      canonical,
    ).href;
}

const root = mustQuery<HTMLElement>("#app");
if (!root.querySelector("[data-shiba-site]")) root.innerHTML = renderPage();
const cleanup: (() => void)[] = [];
for (const initialize of [
  initNavigation,
  initHero,
  initBook,
  initGallery,
  initImageStrips,
  () => initBullRun(),
  initVoices,
  initContract,
]) {
  try {
    cleanup.push(initialize());
  } catch (error) {
    console.error("A page feature could not initialize.", error);
    announce("A page feature could not start. Please refresh.");
  }
}
document.documentElement.classList.remove("no-js");
updateMetadata();
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    cleanup.forEach((dispose) => dispose());
  });
