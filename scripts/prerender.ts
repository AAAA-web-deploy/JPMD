import { readFile, writeFile } from "node:fs/promises";
import { renderPage } from "../src/components/page.ts";
import { siteConfig } from "../src/config.ts";
import { escapeHtml, safeExternalUrl } from "../src/lib/html.ts";

const path = new URL("../dist/index.html", import.meta.url);
let html = await readFile(path, "utf8");
if (!html.includes('<div id="app"></div>'))
  throw new Error("The prerender insertion point is missing.");
html = html.replace(
  '<div id="app"></div>',
  () => `<div id="app">${renderPage()}</div>`,
);
html = html.replace(
  /<title>[^<]*<\/title>/,
  () =>
    `<title>${escapeHtml(siteConfig.name)} — A Wall Street / Ethereum Story</title>`,
);
html = html.replace(
  /(<meta property="og:title" content=")[^"]*("\s*\/?>)/,
  (_, a: string, b: string) => a + escapeHtml(siteConfig.name) + b,
);
const canonical = safeExternalUrl(siteConfig.canonicalUrl);
if (canonical) {
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${escapeHtml(canonical)}" /></head>`,
  );
  html = html.replace(
    'content="/images/community/closing-panorama-v2.png"',
    `content="${escapeHtml(new URL("/images/community/closing-panorama-v2.png", canonical).href)}"`,
  );
}
await writeFile(path, html);
console.log(
  "Prerendered every section, the initial 8 cards, both strips, and the full 67-image archive.",
);
