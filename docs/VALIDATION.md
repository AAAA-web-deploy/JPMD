# Validation record

Checked on 20 October 2026 with Node.js **24.19.0** and the committed npm lockfile. All checks below completed successfully on the delivered implementation.

| Check                  | Result                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`             | 16 tests passed; 0 failed, cancelled, or skipped                                                                                                             |
| `npm run typecheck`    | Strict TypeScript check passed, including source, tests, build scripts, and server                                                                           |
| `npm run check:assets` | All 120 original media files matched their SHA-256 manifest; 67 unique collection paths and IDs; local icon sprite present; only the configured hero movie/poster (hash-verified), no other video or animated image |
| `npm run build`        | Vite production build, full-page prerendering, and production output check passed                                                                            |
| `npm run check:dist`   | Prerendered page and compiled stylesheet present; all 97 distinct local references exist; every used SVG symbol resolves                                     |

The final full `npm run check` completed with exit code 0. Dependencies were installed successfully with npm. `package-lock.json` is included for subsequent `npm ci` installs.

## Behavioral coverage

- Gallery counts progress 8/16/24/32/40/48/56/64/67. Category changes reset the batch and do not retain a stale ninth image or duplicate entries.
- Archive images open the shared viewer. Edited captions feed both copying and X sharing. Dialog cancellation restores scrolling and returns focus.
- Book controls lock during a turn, preserve the cover/final-page boundaries, handle backward navigation, and change immediately with reduced motion.
- Canvas geometry handles rotated/flipped layers, clamps slider and pointer values, positions the rotation handle, and crops photos without distorting their aspect ratio.
- The clean export drawing path omits selection guides and added lettering. Static PNG input passes; GIF, animated PNG, and animated WebP input is rejected.
- Scroll reveal calculations are bounded and fully visible with reduced motion.
- The rendered page contains the expected sections in order, 67 archive entries, 34/33 strip groups, four social cards, 22 leaves, real photo attribution, resolvable internal anchors, no iframe elements, and exactly one video: the configured hero movie.
- Unannounced launch fields stay explicit; unsafe external URL schemes are rejected.
- The production file resolver serves HTML/assets, distinguishes missing files, handles HEAD/method validation, and rejects traversal and symlink escapes without opening a server listener during tests.

## Hero movie update (20 October 2026)

**Source file.** The hero now uses the user's transparent `banner_movie_v3.webm`, which replaces `banner_movie_v2.mp4`:

- VP9 with alpha plus Opus (`video/webm; codecs="vp9, opus"`), 1280 × 720, 5.0 s, 2,664,536 bytes. Chrome reports `canPlayType` "probably".
- Decoded frames have genuine alpha: the background pixels are fully transparent.

It is copied byte-for-byte to `public/videos/` (SHA-256 `baa9ea39…04d0`). No conversion was done. The poster is the movie's own first frame, captured in the browser as a transparent 1280 × 720 PNG. The v2 MP4 and JPEG poster were removed from `public/`.

**Checks.**

- `npm run check`: 22 of 22 tests passed. The hero tests cover a first-open start from 0, repeated visibility callbacks without a reset, pausing on leave and a single restart from 0 on return, tab hide/show, `pagehide`/`pageshow`, a late `play()` promise after leaving, seeking only after metadata, a manual pause, reduced motion, blocked autoplay, a source error, and listener teardown. The server test checks `.webm` is served as `video/webm`.
- The asset check hash-verified the movie and poster.
- The dist check verified 98 references and exactly one hero video with `autoplay`, `muted`, and `playsinline` (`loop` was required until the 9-second cycle replaced it; see below).

**Layout.** Measured in the browser at 1440 × 900, 900, 899, 390, and 320px:

- No horizontal overflow at any width.
- The movie keeps a 1.7778 ratio.
- The greeting stays above the frame and inside the viewport.
- The title fits on two lines: 569/628px at 1440, 305/342 at 390, and 253/272 at 320.
- Columns are balanced from 900px up. At 899px and below, the movie comes first, then the copy.
- The hero ends at the fold below the measured header height, including the taller wrapped header around 900px.

**Playback.**

Checked in Chrome on the dev server and on `npm start`, with an instrumented page that counted seeks to 0, `play()` calls, active listeners, and errors:

- First open: one reset to 0 and one `play()`; muted, looping, rate 1. Over about 20 s the clip wrapped 5 times natively with no further resets or `play()` calls.
- Scrolling fully past the hero pauses it, and it stays paused. Scrolling back restarts from 0 with exactly one reset. Small scrolls while the hero stays visible cause no reset.
- Navigating to another URL and pressing Back reloaded the page (this browser did not use the back/forward cache), and the clip started once from 0. Dispatched `pagehide`/`pageshow` events paused and then restarted it once from 0; a duplicate `pageshow` did not reset again.
- A manual Pause holds through leaving and returning, and Play resumes.
- The transparent movie sits directly on the hero background: the frame's background is transparent and the poster is hidden while playing.
- Listener count stayed constant (22), with no errors or unhandled rejections.
- Not exercisable in this browser: real tab hiding (it pins `document.hidden`), real autoplay blocking, and Safari/iOS, which does not render WebM alpha and falls back to the poster. These paths are covered by unit tests only.

**Hero simplification (later the same day).** At the user's request, the orbit circles, the "Hey, I’m Shiba." bubble, and the play/pause control were removed, and native `loop` was replaced by a scheduled replay: 5 s of playback, a 4 s hold, then a replay from 0 (a 9-second cycle). This supersedes the native-loop and manual-Pause notes above.

- `npm run check`: 22 of 22 tests passed. Mock timers confirm there is no replay at 3,999 ms and a replay from 0 at 4,000 ms over three cycles. Leaving during the hold cancels the replay, and returning restarts immediately. If autoplay is blocked, one retry happens on the first interaction. The content and dist checks now require no `loop` attribute and no button, orbits, or greeting in the hero stage.
- Production build in Chrome at 1440 × 900: the movie frame grew from 628 × 353 to 848 × 476 and doesn't reach the copy column, which ends at 684px. At 390px the frame spans the full 390px width, above the copy, with no horizontal overflow.
- Measured cycle: `ended` to the next `playing` took 4,028 ms twice. The clip played for 5.06 s, and the full cycle was about 9.1 s.
- This embedded browser pauses media by itself when its panel goes into the background, without reporting `hidden` to the page. Pause tracing confirmed the site's code made no `pause()` call in those cases.

**Serving.**

- v3 WebM on `npm start`: HEAD returns 200 `video/webm` with `Accept-Ranges: bytes`, a 100-byte range returns 206 with the correct `Content-Range`, and an unsatisfiable range returns 416. Vite serves it as `video/webm`.
- (v2 MP4, earlier) Vite dev server: range requests return 206 with a `Content-Range`. HEAD returns 200 with `video/mp4`.
- Production server (`npm start`):
  - GET and HEAD return 200 `video/mp4` with `Accept-Ranges`. Byte ranges return 206: a suffix range returned the original's last 500 bytes, and an open-ended range was correct. An unsatisfiable range returns 416. Path traversal still returns 404.
  - The CSP adds `media-src 'self'`.
  - In the browser, the movie streamed as a 206 response, seeking to 3.5s worked, and all 89 page asset URLs resolved.

**Rest of the page.** The book, gallery batches, filters, archive, section order, sticky header, and phone menu were spot-checked and still work.

**Not verified:**

- The hidden-tab pause, which is covered by code and unit-test structure but not exercised in the browser.
- Real autoplay blocking on iOS or low-power devices.
- Safari and Firefox decoding.
- The Groklet character animation, which did not render in this browser.

## Bull Run mini-game (20 October 2026)

The photo editor was replaced by the Bull Run game. The editor code, its tests, and its two images (`images/editor/*`) were removed; the asset manifest now lists 118 files. Older studio notes below are historical.

- `npm run check`: 35 of 35 tests passed. 11 engine tests cover the jump arc at three step sizes, no double jump, jump buffering, candles moving right to left, exactly-once scoring, hitboxes (landing on top, wick grazes, swept fast frames), about 8,900 generated obstacles that all fit one jump, a timing bot surviving 150 s on three seeds, pause, retry, and storage. 7 DOM tests cover copy and aliases, keyboard/tap/JUMP controls, pause, the crash panel, the best score across a reload, blocked storage, auto-pause on hidden tab and off-screen, ignored typing, reduced motion, cleanup, and the device-pixel-ratio cap.
- Chrome at 1920 × 1080, 1366 × 768, 768, 390, and 320px: no horizontal overflow; the score bar stays inside the frame; the stage stays 16:9 and fits the viewport height at 1366 × 768. All game buttons are at least 44px tall; the phone JUMP bar is 64px tall.
- A seeded run was rendered frame by frame through the real renderer: approach, mid-jump, "+1" popups, taller candles at higher speed, and the crash with the flying tie and "!!" reaction all drew correctly.
- Not verified: real-time play on a physical touch device, sound output, and Safari/Firefox. This embedded browser throttles animation frames when its panel is in the background, so live play there runs slowly; the logic is covered by the tests above.

## Browser verification (refinement pass, 20 October 2026)

Re-run with Node.js 24.21.0: `npm run check` exited 0 (16/16 tests, typecheck, assets, build, prerender, 97 dist references). A `BASE_PATH=/JPMD/` build also passed `check:dist`.

Checked in a Chromium-based browser against `npm run dev`, `npm start` (port 3000), and `vite preview` of the `/JPMD/` build, side by side with the reference at emulated viewports:

- **1363 × 936:** header, hero, gallery/strip/archive headings, purchase guide, social cards, registry, roadmap, reveal (2621px scroll region, 936px sticky stage), and closing/footer were measured against the reference. Section heading heights differ by about 1px. The hero headline wraps to two lines because the name is longer.
- **Breakpoints:** 1005, 1001/1000, 801/800, 600/599, 390, 360, and 320 widths showed no horizontal overflow. The book is 420px tall between 600 and 1000px, a stacked phone chapter at 599px, and a 55/45 split at 600px. The gallery is 2 columns at 360px and 1 column at 320px. At 801px the navigation wraps to two rows, as it does on the reference.
- **Book:** 0.7s turns with input locking, cover and last-page boundaries, keyboard arrows, and the 3D sheet visible mid-turn.
- **Gallery:** batches 8→64→67 without duplicates. Every filter resets the batch, and the categories sum to 67.
- **Viewer:** contained image. Caption edits update the X intent text and image URL. Escape closes it, restores scrolling, and returns focus.
- **Studio:**
  - PNG upload is accepted. GIF and animated PNG are rejected.
  - Sliders, colour, flip, add/remove lettering, reset, and drag work.
  - The export is a 1000 × 1000 PNG without guides.
- **Mobile menu:** opens, and a link closes it and navigates.
- **Reduced motion** (emulated `prefers-reduced-motion: reduce`): ticker, strip, leaf, and mascot animations are `none`. Strips scroll manually, the reveal variables are 1, and book turns are immediate with no flipping sheet.
- **Assets:** every referenced image, srcset, font, stylesheet, script, and icon URL returned OK on the dev server, the production server, and the `/JPMD/` preview. All three font families loaded, and no console errors were captured.

Still not verified: real touch gestures on a physical device, native clipboard and file download prompts, the external X share flow beyond the generated URL, and Safari/Firefox rendering. Pixel-level parity with the reference is not claimed; comparisons were measured element sizes and screenshots.

No live market transactions, wallet operations, token issuance, or account creation were performed.
