import { siteConfig } from "../config.ts";
import type { SocialKey } from "../config.ts";
import { roadmap, tickerPhrases } from "../content.ts";
import { leafMarkup } from "../data/leaf.ts";
import {
  brandText,
  escapeHtml as e,
  icon,
  image,
  officialLink,
} from "../lib/html.ts";
import { renderBook } from "./book.ts";
import {
  renderArchive,
  renderGalleryIntro,
  renderMemeDialog,
  renderStrip,
} from "./gallery.ts";
import { renderStudio } from "./studio.ts";

const nav = [
  ["#lore", "Lore"],
  ["#token", "Token"],
  ["#buy", "Buy"],
  ["#memes", "Memes"],
  ["#studio", "Shiba Studio"],
  ["#community", "Community"],
] as const;
const socialNames: Record<SocialKey, string> = {
  x: "X",
  telegram: "Telegram",
  instagram: "Instagram",
  tiktok: "TikTok",
};
const socialKeys = ["x", "telegram", "instagram", "tiktok"] as const;
const links = (items: readonly (readonly [string, string])[]): string =>
  items.map(([href, label]) => `<a href="${href}">${e(label)}</a>`).join("");

function header(): string {
  return `<header class="header"><a href="#home" class="home-badge" aria-label="${e(siteConfig.name)} home">${image("images/brand/header-mascot.png", "Shiba banker home badge", "", true, 1536, 1024)}</a><button type="button" class="menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="navigation" data-menu-toggle>${icon("menu")}</button><nav id="navigation" class="navigation" aria-label="Main navigation">${links(nav)}${socialKeys.map((key) => officialLink(siteConfig.socials[key], `${icon(`social-${key}`)}<span>${key === "x" ? "Follow" : socialNames[key]}</span>`, "social", socialNames[key])).join("")}</nav></header>`;
}
function hero(): string {
  return `<section id="home" class="hero" aria-labelledby="hero-title"><div class="atmosphere" aria-hidden="true">${image("images/hero/city-office-background-v2.png", "", "hero-background", true, 1774, 887)}<div class="hero-overlay"></div></div><div class="hero-copy"><p class="eyebrow"><span aria-hidden="true"></span>A SHIBA. A SUIT. AN ETHEREUM STORY.</p><h1 id="hero-title">${siteConfig.headlineLines.map((line) => `<span>${brandText(line)}</span>`).join("")}</h1><h2>WALL STREET’S<br class="desktop-break" /> NEW BEST FRIEND.</h2><p class="description">Old money. Open ledgers. A very different Shiba. Follow a fictional Wall Street journey into Ethereum—and meet the dog who steals the room.</p><div class="actions"><a class="buy-button" href="#lore">MEET SHIBA<span class="arrow">${icon("arrow-up-right")}</span></a><a class="secondary-button exchange-button" href="#studio">${icon("plus")}<span><small>MAKE IT YOURS</small>SHIBA STUDIO</span></a>${officialLink(siteConfig.chartUrl, `${icon("chart")}<span><small>${siteConfig.chartUrl ? "VIEW THE" : "COMING SOON"}</small>OFFICIAL CHART</span>`, "secondary-button exchange-button", "Official chart")}<a class="secondary-button exchange-button" href="#community">${icon("social-telegram")}<span><small>FIND THE</small>COMMUNITY</span></a></div></div><div class="mascot-shell">${image("images/brand/shiba-portrait-clean.png", "The black-and-tan Shiba banker in a charcoal suit, without a name or token symbol in the artwork.", "mascot-image", true)}</div></section>`;
}
function ticker(): string {
  const group = (clone: boolean): string =>
    `<div class="ticker-group"${clone ? ' aria-hidden="true"' : ""}>${tickerPhrases.map((text) => `<span class="ticker-item">${e(text)}<span aria-hidden="true" class="ticker-dot">•</span></span>`).join("")}</div>`;
  return `<section class="community-ticker" aria-label="Shiba community phrases"><div class="ticker-track">${group(false)}${group(true)}</div></section>`;
}
function communityCards(): string {
  const descriptions = {
    x: "Follow the conversation.",
    telegram: "Find the pack.",
    instagram: "A different kind of feed.",
    tiktok: "A little more character.",
  };
  return `<section class="community-links" aria-labelledby="community-links-title"><h3 id="community-links-title">FIND YOUR PEOPLE.</h3><div class="community-links-grid">${socialKeys.map((key) => officialLink(siteConfig.socials[key], `<span class="community-link-icon">${icon(`social-${key}`)}</span><span><small>${siteConfig.socials[key] ? descriptions[key] : "Official account not announced"}</small><strong>${socialNames[key]}</strong></span><span class="community-link-arrow">${icon("arrow-up-right")}</span>`, "community-link-card", socialNames[key])).join("")}</div></section>`;
}
function ledger(): string {
  const rows: [string, string][] = [
    ["Name", siteConfig.name],
    ["Story world", "Ethereum ecosystem"],
    ["Network", siteConfig.network ?? "Not announced"],
    ["Ticker", siteConfig.ticker ?? "Not announced"],
    ["Supply", siteConfig.supply ?? "Not announced"],
  ];
  return `<section id="token" class="token-ledger" aria-labelledby="ledger-title"><div class="ledger-intro"><p class="ledger-eyebrow">THE PROJECT RECORD</p><h2 id="ledger-title">A SHIBA.<br />A SHARP SUIT.</h2><p class="ledger-description">A fictional character with a place in the conversation. Official token details belong in one clear, verifiable record.</p>${image("images/ledger/ledger.png", "Shiba banker seated beside an open blank ledger.", "ledger-mascot")}</div><div class="ledger-panel"><div class="ledger-panel-heading"><span>SHIBA P. MORGAN INU</span><span>PROJECT RECORD</span></div><dl>${rows.map(([term, value]) => `<div class="ledger-row"><dt>${e(term)}</dt><dd>${e(value)}</dd></div>`).join("")}</dl><div class="ledger-contract"><h3>OFFICIAL CONTRACT</h3><p class="ledger-address">${e(siteConfig.contractAddress ?? "Not announced")}</p><div class="ledger-contract-actions"><button type="button" data-copy-contract${siteConfig.contractAddress ? "" : " disabled"}>${icon("copy")}Copy address</button>${officialLink(siteConfig.explorerUrl, `${icon("arrow-up-right")}Explorer`, "ledger-link", "Contract explorer")}</div></div><p class="ledger-security">${siteConfig.contractAddress ? "Check the published network and address before using any market link." : "No official contract or market link has been announced on this page."}</p><div class="ledger-badges"><div>${image("images/ledger/verify.png", "Shiba holding an unmarked shield.")}<span>CHECK THE<br />OFFICIAL DETAILS</span></div><div>${image("images/ledger/hold-standing.png", "Shiba holding a plain portfolio.")}<span>KEEP THE<br />STORY YOURS</span></div></div></div></section>`;
}
function buying(): string {
  const steps = [
    [
      "Know the network",
      "Read the official network details in the project record before making any transaction.",
    ],
    [
      "Verify the address",
      "Use the address published here when one is announced. A similar name or image does not establish authenticity.",
    ],
    [
      "Use the official route",
      "The market buttons become available when approved destinations are configured for this project.",
    ],
    [
      "Keep the details together",
      "Return to the same project record for the contract, network, and official community links.",
    ],
  ];
  return `<section id="buy" class="how-to-buy" aria-labelledby="buy-title"><aside class="buy-field-guide"><p class="field-guide-label">THE SHIBA FIELD GUIDE</p><div class="field-guide-character"><div class="field-guide-bubble">Check the details.<br />Then make your move.</div>${image("images/ledger/buy-guide.png", "Shiba banker welcoming visitors with an open paw.")}</div><p class="field-guide-route">Network <span aria-hidden="true">→</span> Address <span aria-hidden="true">→</span> Official link</p></aside><div class="buy-guide-copy"><h2 id="buy-title">The official <span>route.</span></h2><p class="buy-guide-intro">Keep the important details in view. ${siteConfig.buyUrl ? "Use only the published destination below." : "The buying destination will appear here when it is announced."}</p><ol class="buy-steps">${steps.map(([title, text], index) => `<li><div class="buy-step-heading"><span class="step-arrow" aria-hidden="true">↳</span><h3>${e(title)}</h3><small>STEP ${String(index + 1).padStart(2, "0")}</small></div><p>${e(text)}</p></li>`).join("")}</ol><div class="buy-guide-links"><a href="#token">Project record${icon("copy")}</a>${officialLink(siteConfig.buyUrl, `Buy link${icon("swap")}`, "", "Buy link")}${officialLink(siteConfig.chartUrl, `Chart${icon("chart")}`, "", "Chart")}${officialLink(siteConfig.explorerUrl, `Explorer${icon("arrow-up-right")}`, "", "Explorer")}</div></div></section>`;
}
function roadmapSection(): string {
  return `<section id="roadmap" class="brand-roadmap" aria-labelledby="roadmap-title"><div class="roadmap-heading"><p class="roadmap-eyebrow">THE NEXT CHAPTERS</p><h2 id="roadmap-title">THE STORY CONTINUES.</h2><p class="roadmap-intro">From the first entrance to the next shared moment. There is room in the story for the whole pack.</p></div><div class="roadmap-trail"><svg class="roadmap-path" aria-hidden="true" viewBox="0 0 1000 620" preserveAspectRatio="none"><path d="M35 80C360 0 570 40 905 85C1060 180 1015 375 830 405C500 485 330 395 90 455" /></svg><ol class="roadmap-grid">${roadmap.map((stage, index) => `<li class="roadmap-card roadmap-card-${index + 1}"><span class="roadmap-marker" aria-label="Chapter ${index + 1}">${String(index + 1).padStart(2, "0")}</span>${image(stage.image, `Shiba story chapter: ${stage.title}`, "roadmap-art")}<div class="roadmap-card-copy"><p class="roadmap-chapter">CHAPTER ${String(index + 1).padStart(2, "0")}</p><h3>${e(stage.title)}</h3><p class="roadmap-card-intro">${e(stage.intro)}</p><ul>${stage.points.map((point) => `<li>${e(point)}</li>`).join("")}</ul></div></li>`).join("")}</ol></div><p class="roadmap-note">A creative journey for the character and community. The future stays open.</p></section>`;
}
function reveal(): string {
  return `<section id="ethereum" class="chain-reveal" aria-labelledby="chain-reveal-title"><div class="chain-reveal-stage"><div class="chain-light" aria-hidden="true"></div><div class="chain-leaves" aria-hidden="true">${Array.from({ length: 22 }, (_, i) => `<i style="--leaf-x:${(i * 37) % 100}%;--leaf-y:${(i * 23) % 100}%;--leaf-size:${24 + (i % 5) * 9}px;--leaf-turn:${47 * i}deg;--leaf-delay:${-0.7 * i}s;--leaf-time:${7 + (i % 6)}s">${leafMarkup}</i>`).join("")}</div><div class="chain-reveal-copy"><h2 id="chain-reveal-title"><span class="chain-opening">A new Shiba.<br />An open world.</span><span class="chain-name">Ethereum.</span></h2><figure class="chain-selfie">${image("images/editorial/vitalik-buterin-romanpoet-2016.jpg", "Genuine photograph of Ethereum co-founder Vitalik Buterin, taken by Romanpoet on 4 June 2016.", "", false, 2305, 1977)}<figcaption>Vitalik Buterin · Ethereum co-founder<br /><a href="https://commons.wikimedia.org/wiki/File:VitalikButerinProfile.jpg" target="_blank" rel="noopener noreferrer">Photo: Romanpoet, 2016</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a><small>Historical photograph. No project endorsement implied.</small></figcaption></figure></div></div></section>`;
}
function closing(): string {
  return `<section id="community" class="closing-scene" aria-labelledby="closing-title">${image("images/community/closing-panorama-v2.png", "The fictional Shiba banker, financiers, and builders gather above a city at sunset.", "", false, 2048, 683)}<div class="closing-copy"><p>A DIFFERENT SHIBA. A NEW CONVERSATION.</p><h2 id="closing-title">THERE’S A SEAT FOR THE PACK.</h2><div class="closing-actions">${officialLink(siteConfig.socials.telegram, `${icon("social-telegram")}JOIN THE CONVERSATION`, "", "Telegram community")}${officialLink(siteConfig.socials.x, `${icon("social-x")}FOLLOW THE STORY`, "", "X community")}</div></div></section>`;
}
function footer(): string {
  return `<footer class="site-footer"><div class="footer-top"><a class="wordmark" href="#home" aria-label="${e(siteConfig.name)} home">${siteConfig.headlineLines.map(brandText).join("<br />")}</a><nav aria-label="Footer navigation">${links(
    [
      ["#lore", "Lore"],
      ["#token", "Token"],
      ["#buy", "How to buy"],
      ["#roadmap", "Roadmap"],
      ["#memes", "Memes"],
      ["#community", "Community"],
    ],
  )}</nav><div class="footer-socials">${socialKeys.map((key) => officialLink(siteConfig.socials[key], `${socialNames[key]} ${icon("arrow-up-right")}`, "", socialNames[key])).join("")}</div></div><div class="footer-bottom"><p>Independent meme fiction inspired by JPMD and Ethereum.<br />No affiliation with JPMorgan Chase, its deposit products, the Ethereum Foundation, or Vitalik Buterin.</p><p class="footer-contract"><span>OFFICIAL CONTRACT</span><a href="#token">${e(siteConfig.contractAddress ?? "Not announced")}</a></p></div></footer>`;
}

export function renderPage(): string {
  return `<div data-shiba-site>${header()}<main>${hero()}${ticker()}${renderBook()}<section id="memes" class="meme-gallery" aria-labelledby="meme-title"><div class="meme-gallery-inner">${renderGalleryIntro()}${renderStudio()}<section class="brand-motion" aria-labelledby="motion-title"><div class="meme-section-heading"><div><p class="meme-greeting">One character. Every side of the conversation.</p><h2 id="motion-title">A Shiba for every <span>moment.</span></h2></div></div>${renderStrip("left")}${renderStrip("right")}</section>${communityCards()}<section class="meme-interlude" aria-label="Shiba on the group chat call">${image("images/community/phone-call-interlude.png", "A close-up of the Shiba banker taking a phone call.")}<p>THE GROUP CHAT IS CALLING.</p></section>${ledger()}${buying()}${roadmapSection()}${reveal()}${renderArchive()}</div></section>${closing()}</main>${footer()}${renderMemeDialog()}<div id="toast" class="toast fixed bottom-6 left-1/2 z-100 -translate-x-1/2 rounded-lg px-5 py-3 text-sm shadow-lg" role="status" aria-live="polite" hidden></div></div>`;
}
