import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { Window } from "happy-dom";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const html = await readFile(path.join(root, "index.html"), "utf8");
const window = new Window({ url: "https://example.test" });
window.document.write(html);
const document = window.document;
const references = new Set();
try {
  assert.ok(
    document.querySelector("[data-shiba-site]"),
    "The full page must be prerendered.",
  );
  assert.equal(
    document.querySelectorAll("[data-meme-grid] [data-meme-card]").length,
    8,
  );
  assert.equal(
    document.querySelectorAll(".meme-archive-grid button").length,
    67,
  );
  assert.equal(
    document.querySelectorAll('video,iframe,source[type^="video/"]').length,
    0,
  );
  for (const element of document.querySelectorAll(
    "[src],link[href],use[href],source[srcset]",
  )) {
    const value =
      element.getAttribute("src") ??
      element.getAttribute("href") ??
      element.getAttribute("srcset");
    if (value?.startsWith("/")) references.add(value.split("#")[0]);
  }
  const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')];
  assert.equal(
    stylesheets.length,
    1,
    "Expected one compiled local stylesheet.",
  );
  for (const stylesheet of stylesheets) {
    const css = await readFile(
      path.join(root, stylesheet.getAttribute("href").slice(1)),
      "utf8",
    );
    assert.ok(
      css.includes(".story-book") &&
        css.includes(".studio-workspace") &&
        css.includes(".chain-reveal"),
    );
    for (const match of css.matchAll(/url\(["']?(\/[^\s)"']+)["']?\)/g))
      references.add(match[1]);
  }
  for (const reference of references) {
    assert.ok(
      (await stat(path.join(root, reference.slice(1)))).isFile(),
      `Missing production asset: ${reference}`,
    );
  }
  const sprite = await readFile(path.join(root, "icons/ui.svg"), "utf8");
  for (const use of document.querySelectorAll("use[href]")) {
    const id = use.getAttribute("href").split("#")[1];
    assert.ok(sprite.includes(`id="${id}"`), `Missing icon: ${id}`);
  }
  assert.ok(
    !html.includes("/src/main.ts"),
    "Production must reference compiled JavaScript.",
  );
  assert.ok(document.querySelector('script[type="module"][src^="/assets/"]'));
  console.log(
    `Verified prerendered production HTML, ${references.size} local asset references, stylesheet, and all used icon symbols.`,
  );
} finally {
  await window.happyDOM.close();
}
