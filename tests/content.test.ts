import test from "node:test";
import assert from "node:assert/strict";
import { memes, chapters, roadmap } from "../src/content.ts";
import { heroVideo, siteConfig } from "../src/config.ts";
import { renderPage } from "../src/components/page.ts";
import { storyView } from "../src/components/book.ts";
import { filterMemes } from "../src/lib/gallery.ts";
import { safeExternalUrl } from "../src/lib/html.ts";
import { installDom } from "./dom.ts";

test("complete collection and story assets preserve the required counts", () => {
  assert.equal(memes.length, 67);
  assert.equal(new Set(memes.map((m) => m.id)).size, 67);
  assert.deepEqual(
    [
      "Bullish",
      "Bearish",
      "GM / GN",
      "Reactions",
      "Lifestyle",
      "Community",
    ].map(
      (c) => filterMemes(memes, c as (typeof memes)[number]["category"]).length,
    ),
    [16, 5, 2, 19, 15, 10],
  );
  assert.equal(chapters.length, 5);
  assert.equal(roadmap.length, 4);
  for (let page = 1; page <= 5; page++)
    assert.ok(storyView(page).includes(`chapter-0${page}.png`));
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
    assert.equal(document.querySelectorAll("[data-meme-filter]").length, 7);
    assert.equal(document.querySelectorAll("[data-book-page]").length, 6);
    assert.equal(
      document.querySelectorAll(".meme-archive-grid button").length,
      67,
    );
    assert.equal(
      document.querySelectorAll(
        ".image-strip-left .image-strip-group:first-child button",
      ).length,
      34,
    );
    assert.equal(
      document.querySelectorAll(
        ".image-strip-right .image-strip-group:first-child button",
      ).length,
      33,
    );
    assert.equal(document.querySelectorAll(".roadmap-card").length, 4);
    assert.equal(document.querySelectorAll(".chain-leaves i").length, 22);
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
    assert.ok(
      document.querySelector('img[src*="vitalik-buterin-romanpoet-2016.jpg"]'),
    );
    assert.match(html, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
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
