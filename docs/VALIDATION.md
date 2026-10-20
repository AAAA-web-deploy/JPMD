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

**Source file.** `banner_movie_v2.mp4` was inspected from its MP4 boxes and in the browser:

- H.264 High profile (`avc1.640020`) with AAC stereo, 1280 × 720, 24 fps, 5.0 s, 4,355,719 bytes.
- The index is at the front of the file (fast start).
- It is 24-bit with no alpha channel. Its corner pixels are opaque scenery.

It is copied byte-for-byte to `public/videos/` (SHA-256 `84210b72…3d88`). No conversion was needed. The poster is the movie's own first frame, captured in the browser as a 1280 × 720 JPEG.

**Checks.**

- `npm run check`: 20 of 20 tests passed. The four new tests cover the hero playback lifecycle and byte ranges.
- The asset check hash-verified the movie and poster. A temporary stray `.mp4` was rejected.
- The dist check verified 98 references and exactly one hero video with `autoplay`, `muted`, `loop`, and `playsinline`.

**Layout.** Measured in the browser at 1440 × 900, 900, 899, 390, and 320px:

- No horizontal overflow at any width.
- The movie keeps a 1.7778 ratio.
- The greeting stays above the frame and inside the viewport.
- The title fits on two lines: 569/628px at 1440, 305/342 at 390, and 253/272 at 320.
- Columns are balanced from 900px up. At 899px and below, the movie comes first, then the copy.
- The hero ends at the fold below the measured header height, including the taller wrapped header around 900px.

**Playback.**

- Autoplay is muted and looping.
- Pause holds through scrolling off-screen and back.
- Resume works, and the movie pauses off-screen and resumes on return.
- With reduced motion, the poster stays at 0.00s, every hero animation is `none`, and Play is available.
- A broken source restores the poster and hides the control, with no errors or unhandled rejections.

**Serving.**

- Vite dev server: range requests return 206 with a `Content-Range`. HEAD returns 200 with `video/mp4`.
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
