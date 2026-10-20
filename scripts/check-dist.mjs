import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import sharp from "sharp";
import { heroVideo } from "../src/config.ts";
import { storyView } from "../src/components/book.ts";
import { memeCard } from "../src/components/gallery.ts";
import { memes, moodImages } from "../src/content.ts";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const base = `/${(process.env.BASE_PATH ?? "").replace(/^\/+|\/+$/g, "")}/`.replace(
  /^\/\/$/,
  "/",
);
const local = (reference) => {
  assert.ok(
    reference.startsWith(base),
    `Asset outside base path ${base}: ${reference}`,
  );
  return path.join(root, reference.slice(base.length));
};
const html = await readFile(path.join(root, "index.html"), "utf8");
const window = new Window({ url: "https://example.test" });
window.document.write(html);
const document = window.document;
const references = new Set();
const responsiveCandidates = new Set();
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
    48,
  );
  assert.equal(document.querySelectorAll("iframe").length, 0);
  assert.ok(
    document.querySelector("#bull-run [data-bull-run] canvas"),
    "The Bull Run game must be prerendered.",
  );
  assert.equal(
    document.querySelectorAll('input[type="file"], [data-studio]').length,
    0,
    "The retired photo editor must not ship.",
  );
  const videos = [...document.querySelectorAll("video")];
  const videoSources = [
    ...document.querySelectorAll('video source, source[type^="video/"]'),
  ];
  if (heroVideo) {
    assert.equal(videos.length, 1, "Only the hero movie may be a video.");
    assert.ok(videos[0].closest("#home"), "The video must be in the hero.");
    assert.deepEqual(
      videoSources.map((source) => source.getAttribute("src")),
      [`${base}${heroVideo.src}`],
    );
    for (const name of ["autoplay", "muted", "playsinline"])
      assert.ok(videos[0].hasAttribute(name), `Hero video needs ${name}.`);
    assert.ok(!videos[0].hasAttribute("loop"), "Hero replays are scheduled, not looped.");
    references.add(videos[0].getAttribute("poster"));
  } else {
    assert.equal(videos.length + videoSources.length, 0);
  }
  for (const element of document.querySelectorAll("[src],link[href],use[href]")) {
    const value = element.getAttribute("src") ?? element.getAttribute("href");
    if (value?.startsWith("/")) references.add(value.split("#")[0]);
  }
  const responsive = [...document.querySelectorAll("img[srcset],source[srcset]")];
  for (const img of document.querySelectorAll("img:not(.hero-poster):not([data-modal-image])"))
    assert.ok(img.hasAttribute("srcset"), `Image without responsive candidates: ${img.getAttribute("src")}`);
  const dynamic = new Window({ url: "https://example.test" });
  dynamic.document.body.innerHTML = [
    ...[0, 1, 2, 3, 4, 5].map(storyView),
    ...[...memes, ...moodImages].map(memeCard),
  ].join("");
  responsive.push(...dynamic.document.querySelectorAll("img,source"));
  for (const element of responsive) {
    const srcset = element.getAttribute("srcset");
    const label = `${element.tagName} ${element.getAttribute("src") ?? srcset}`;
    assert.ok(srcset, `Missing srcset: ${label}`);
    assert.ok(element.getAttribute("sizes"), `Missing sizes: ${label}`);
    const original = element.getAttribute("src");
    if (original) {
      assert.match(original, /\/images\/.+\.(png|jpe?g)$/, `Fallback must be the original: ${label}`);
      references.add(original);
    }
    for (const candidate of srcset.split(",")) {
      const [url, descriptor, ...rest] = candidate.trim().split(/\s+/);
      assert.ok(url && /^\d+w$/.test(descriptor ?? "") && !rest.length, `Bad srcset candidate in ${label}: ${candidate}`);
      const { width } = await sharp(local(url)).metadata();
      assert.equal(`${width}w`, descriptor, `Candidate width differs from the file: ${url}`);
      references.add(url);
      responsiveCandidates.add(url);
    }
  }
  await dynamic.happyDOM.close();
  const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')];
  assert.equal(
    stylesheets.length,
    1,
    "Expected one compiled local stylesheet.",
  );
  for (const stylesheet of stylesheets) {
    const css = await readFile(
      local(stylesheet.getAttribute("href")),
      "utf8",
    );
    assert.ok(
      css.includes(".story-book") &&
        css.includes(".bull-run-frame") &&
        css.includes(".chain-reveal"),
    );
    for (const match of css.matchAll(/url\(["']?(\/[^\s)"']+)["']?\)/g))
      references.add(match[1]);
  }
  for (const reference of references) {
    assert.ok(
      (await stat(local(reference))).isFile(),
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
  assert.ok(
    document.querySelector(`script[type="module"][src^="${base}assets/"]`),
  );
  console.log(
    `Verified prerendered production HTML, ${references.size} local asset references (${responsiveCandidates.size} responsive candidates, including client-rendered story and gallery images), stylesheet, and all used icon symbols.`,
  );
} finally {
  await window.happyDOM.close();
}
