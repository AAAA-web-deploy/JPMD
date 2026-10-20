# Validation record

Checked on 20 October 2026 with Node.js **24.19.0** and the committed npm lockfile. All checks below completed successfully on the delivered implementation.

| Check                  | Result                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`             | 16 tests passed; 0 failed, cancelled, or skipped                                                                                                             |
| `npm run typecheck`    | Strict TypeScript check passed, including source, tests, build scripts, and server                                                                           |
| `npm run check:assets` | All 120 original media files matched their SHA-256 manifest; 67 unique collection paths and IDs; local icon sprite present; no video or animated image files |
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
- The rendered page contains the expected sections in order, 67 archive entries, 34/33 strip groups, four social cards, 22 leaves, real photo attribution, resolvable internal anchors, and no video or iframe elements.
- Unannounced launch fields stay explicit; unsafe external URL schemes are rejected.
- The production file resolver serves HTML/assets, distinguishes missing files, handles HEAD/method validation, and rejects traversal and symlink escapes without opening a server listener during tests.

## Remaining browser verification

The managed environment did not provide the browser control supported by the Sites workflow, so no development/preview server or browser was launched. Happy DOM was used only as a DOM emulator for unit and output checks; it is not a browser rendering test.

The following remain unverified in an actual browser: measured visual parity at desktop/phone widths, font fitting, hover and scroll appearance, touch/pointer gestures, real image decoding, native clipboard/download behavior, canvas PNG encoding, external share flow, and deployed response behavior. Review these with `npm run dev` and a production build on the intended hosting platform.

No screenshots, deployment, live market transactions, wallet operations, or external account changes were performed. The codebase is delivered for local use and iterative review.
