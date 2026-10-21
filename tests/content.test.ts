import test from "node:test";
import assert from "node:assert/strict";
import { memes, chapters, roadmap } from "../src/content.ts";
import { heroVideo, siteConfig } from "../src/config.ts";
import { renderPage } from "../src/components/page.ts";
import { renderBook, storyView } from "../src/components/book.ts";
import storyContent from "../src/data/story-content.json" with { type: "json" };
import { catalogThemes } from "../src/lib/gallery.ts";
import { escapeHtml, safeExternalUrl } from "../src/lib/html.ts";
import { installDom } from "./dom.ts";

test("complete collection and story assets preserve the required counts", () => {
  assert.equal(memes.length, 67);
  assert.equal(new Set(memes.map((m) => m.id)).size, 67);
  assert.deepEqual(
    catalogThemes.map((theme) => memes.filter((m) => m.category === theme).length),
    [16, 5, 2, 19, 15, 10],
  );
  assert.equal(chapters.length, 5);
  assert.equal(roadmap.length, 4);
  for (let page = 1; page <= 5; page++)
    assert.ok(storyView(page).includes(`chapter-0${page}.png`));
});

test("the Lore book renders the version 3.0.0 Ethereum story exactly", () => {
  assert.equal(storyContent.version, "3.0.0");
  assert.deepEqual(
    chapters.map((chapter) => chapter.title),
    [
      "The First Spark",
      "The Puppy Everyone Knew",
      "The Guardian at Work",
      "Wall Street Meets Shiba",
      "Ethereum's Next Dawn",
    ],
  );
  storyContent.chapters.forEach((source, index) => {
    const chapter = chapters[index]!;
    assert.deepEqual(
      [chapter.label, chapter.title, chapter.paragraphs, chapter.image, chapter.alt],
      [source.label, source.title, source.paragraphs, source.image, source.alt],
    );
    assert.equal(chapter.image, `images/story-ethereum-v3/chapter-0${index + 1}.png`);
    const page = storyView(index + 1);
    for (const paragraph of source.paragraphs) assert.ok(page.includes(`<p>${escapeHtml(paragraph)}</p>`));
    assert.ok(!page.includes(source.caption));
  });
  const cover = storyView(0);
  assert.equal(cover.match(/<picture>/g)?.length, 1);
  const source = cover.match(/<source media="\(max-width:599px\)" srcset="([^"]+)" sizes="([^"]+)" width="1254" height="1254" \/>/);
  assert.ok(source, "The phone cover keeps its own <source> inside the single <picture>.");
  const mobile = source[1]!.split(", ");
  assert.ok(mobile.every((c) => /^\/generated\/images\/story-ethereum-v3\/cover-mobile-\d+\.webp \d+w$/.test(c)));
  assert.ok(mobile.includes("/generated/images/story-ethereum-v3/cover-mobile-1254.webp 1254w"));
  assert.equal(source[2], "650px");
  assert.ok(cover.includes('src="/images/story-ethereum-v3/cover-wide.png" srcset="/generated/images/story-ethereum-v3/cover-wide-540.webp 540w'));
  assert.ok(cover.includes("/generated/images/story-ethereum-v3/cover-wide-1774.webp 1774w"));
  assert.ok(cover.includes(escapeHtml(storyContent.cover.wideAlt)));
  assert.ok(cover.includes("<span>THE STORY OF</span>"));
  const book = renderBook();
  assert.ok(book.includes(`<span class="eyebrow block">${storyContent.section.eyebrow}</span>`));
  assert.equal(storyContent.section.title, "ETHEREUM GREW. SO DID SHIBA.");
  assert.ok(book.includes('<h2 id="story-title">ETHEREUM GREW.<br />SO DID SHIBA.</h2>'));
  assert.ok(book.includes(`<p>${storyContent.section.introduction}</p>`));
  assert.ok(book.includes('aria-label="Chapter 5: Ethereum&#39;s Next Dawn"'));
  assert.ok(!/images\/story\//.test(book + [0, 1, 2, 3, 4, 5].map(storyView).join("")));
});

test("full page preserves section order, image reuse, and static-only content", async () => {
  const html = renderPage();
  const window = installDom(`<div id="app">${html}</div>`);
  try {
    const ids = [...document.querySelectorAll("section[id]")].map((n) => n.id);
    assert.deepEqual(ids, [
      "home",
      "lore",
      "memes",
      "bull-run",
      "token",
      "buy",
      "roadmap",
      "ethereum",
      "community",
    ]);
    assert.equal(document.querySelectorAll("main").length, 1);
    assert.equal(document.querySelectorAll("h1").length, 1);
    assert.deepEqual(
      [...document.querySelectorAll("[data-meme-filter]")].map((b) => b.textContent),
      ["All Shibas", "Wall Street", "Ethereum", "Trading Desk", "Shiba Culture", "Shiba Society"],
    );
    assert.equal(document.querySelectorAll("[data-book-page]").length, 6);
    assert.equal(
      document.querySelectorAll(".meme-archive-scroll > .meme-archive-grid button").length,
      48,
    );
    assert.equal(
      document.querySelectorAll(
        ".image-strip-left .image-strip-group:first-child button",
      ).length,
      24,
    );
    assert.equal(
      document.querySelectorAll(
        ".image-strip-right .image-strip-group:first-child button",
      ).length,
      24,
    );
    const shown = [
      ...document.querySelectorAll(
        ".meme-archive-grid [data-open-meme], .image-strip-group:first-child [data-open-meme]",
      ),
    ].map((button) => button.getAttribute("data-open-meme"));
    for (const number of [6, 9, 10, 15, 21, 22, 23, 25, 28, 30, 34, 41, 42, 44, 53, 57, 60, 62, 64])
      assert.ok(!shown.includes(`meme-${String(number).padStart(2, "0")}`));
    assert.equal(new Set(shown).size, 48);
    assert.match(html, /48 images\. Scroll the pack/);
    assert.equal(document.querySelectorAll(".roadmap-card").length, 4);
    const voices = document.querySelector("#ethereum")!;
    assert.equal(voices.querySelector("h2")?.textContent, "Wall Street Meets Ethereum");
    assert.equal(voices.querySelectorAll(".chain-leaves, .chain-selfie, .chain-name").length, 0);
    assert.equal(document.querySelectorAll("iframe").length, 0);
    assert.equal(
      document.querySelectorAll('input[type="file"], [data-studio], .studio').length,
      0,
      "The photo editor is gone.",
    );
    assert.doesNotMatch(html, /images\/editor\/|Shiba Studio|MAKE IT YOURS/i);
    assert.ok(document.querySelector('.navigation a[href="#bull-run"]'), "Nav links to Bull Run.");
    assert.match(
      document.querySelector('#home a[href="#bull-run"]')?.textContent ?? "",
      /PLAY\s*BULL RUN/,
    );
    assert.ok(document.querySelector("#bull-run canvas"));
    const videos = [...document.querySelectorAll("video")];
    assert.equal(videos.length, heroVideo ? 1 : 0);
    if (heroVideo) {
      const video = videos[0]!;
      assert.ok(video.closest("#home"), "The only video belongs to the hero.");
      for (const name of ["autoplay", "muted", "playsinline", "poster"])
        assert.ok(video.hasAttribute(name), `Hero video needs ${name}.`);
      assert.equal(video.hasAttribute("loop"), false, "Replays are scheduled, not native loops.");
      assert.deepEqual(
        [...video.querySelectorAll("source")].map((s) => s.getAttribute("src")),
        [`/${heroVideo.src}`],
      );
      assert.equal(
        document.querySelectorAll("#home .hero-stage button, #home .hero-orbits, #home .hero-hello")
          .length,
        0,
        "The hero stage has no play control, orbit circles, or greeting.",
      );
    }
    assert.deepEqual(
      [...document.querySelectorAll("#ethereum .voice-portrait img")].map((img) => img.getAttribute("src")),
      ["/images/voices/larry-fink.webp", "/images/voices/emma-landriault.webp", "/images/voices/matthew-dawson.webp"],
    );
    assert.equal(document.querySelectorAll('img[src*="vitalik-buterin-romanpoet-2016.jpg"]').length, 0);
    const heroMedia = heroVideo ? [heroVideo.src, heroVideo.poster] : [];
    assert.doesNotMatch(
      heroMedia.reduce((text, file) => text.replaceAll(`/${file}`, ""), html),
      /0x11B70|robincoinrbh|BUY \$ROBIN|robin-vlad|\/videos\//i,
    );
    const allIds = [...document.querySelectorAll("[id]")].map((n) => n.id);
    assert.equal(allIds.length, new Set(allIds).size);
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="#"]',
    ))
      assert.ok(
        document.querySelector(link.hash),
        `Missing anchor ${link.hash}`,
      );
  } finally {
    await window.happyDOM.close();
  }
});

test("unannounced project details stay unannounced; unsafe URL schemes are rejected", () => {
  assert.equal(siteConfig.ticker, null);
  assert.equal(siteConfig.contractAddress, null);
  assert.equal(siteConfig.buyUrl, null);
  assert.equal(siteConfig.chartUrl, null);
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl("https://user:secret@example.test/"), null);
  assert.equal(
    safeExternalUrl("https://example.test/chart"),
    "https://example.test/chart",
  );
  assert.ok(renderPage().includes("data-copy-contract disabled"));
});
