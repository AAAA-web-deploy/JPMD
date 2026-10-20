# Reference implementation map

Reference: https://www.robincoinrhcto.xyz/. This implements the Shiba adaptation established in this conversation. Detailed observations are retained in `asset-pack/REFERENCE_LAYOUT.md`.

| Reference area     | Implementation                                  | Adaptation                                                                                                      |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Header             | `page.ts`, `main.ts`, `main.css`                | Navigation/action roles; Shiba art and live text                                                                |
| Hero               | `hero.ts`, `main.css`                           | Follows https://thegroklet.com/ hero: dark stage and glow; the user's enlarged movie, not the reference art (no orbits or greeting, by request) |
| Text band          | `page.ts`, `content.ts`                         | Repeated HTML groups; 38-second loop                                                                            |
| Storybook          | `book.ts`                                       | Cover plus five chapters; spine, 700ms manual turn, six positions, phone cover                                  |
| Gallery            | `gallery.ts`, `lib/gallery.ts`                  | Six user-defined filters (All Shibas … Shiba Society); own 29-image list (`mood-gallery.json` + Shiba Society); 8 at a time; category reset to eight      |
| Viewer             | `gallery.ts`                                    | Modal dialog, contained image, editable caption, download/copy/share, Escape and focus return                   |
| Photo studio slot  | `bullRun.ts`, `src/game/`                       | Replaced at the user's request by the Bull Run mini-game (see `BULL_RUN.md`); the editor and its images are removed |
| Image strips       | `gallery.ts`                                    | 34/33 split, repeated clones, opposite 160-second loops, hover/focus pause                                      |
| Video grid         | Omitted                                         | User requires no videos or replacement video panels                                                             |
| Social cards       | `page.ts`                                       | Four slots; approved destinations configurable                                                                  |
| Interlude          | `page.ts`                                       | Independent square phone-call scene and live caption                                                            |
| Registry           | `page.ts`, `config.ts`                          | 440px record panel, main art and two badges; unannounced fields explicit                                        |
| Purchase guide     | `page.ts`                                       | Illustration/instructions, four steps and four actions; no assumed listing                                      |
| Roadmap            | `page.ts`, `content.ts`                         | Four cards arranged 1/2 then 4/3, dashed path; creative chapters                                                |
| Ecosystem reveal   | `page.ts`, `main.ts`                            | Sticky scroll blend, heading/photo reveal, 22 leaves, attributed Vitalik portrait                               |
| Archive            | `gallery.ts`                                    | Same 67 identities; ten desktop columns                                                                         |
| Closing and footer | `page.ts`                                       | 3:1 panorama, live copy/actions, navigation, project record                                                     |

## Responsive rules

- At 800px and below: compact menu, stacked hero, two-column gallery, smaller strips, one-column social cards, stacked registry/purchase guide, vertical roadmap, three-column archive.
- At 600–1,000px: 55/45 book arrangement. At 599px and below: portrait cover and stacked chapters.
- Bull Run keeps a 16:9 stage at every width. At 640px and below its panels move under the stage and a full-width JUMP bar appears while running.
- Below 360px: one-column main gallery. At 390px and below: stacked roadmap card internals.
- Registry panel stays at most 440px. Closing copy enters normal flow above the panorama on phones.
- Reduced motion stops major loops and page turns; reveal content becomes visible without scroll transforms; strips become horizontally scrollable.

## Practical limits

Layout and interactions were derived from the live reference source and stylesheet, then implemented in original TypeScript and CSS. The reference's application bundles, token details, original mascot rasters, and videos are not shipped as this project's implementation.

The longer name, replacement artwork/copy, palette, and no-video exception produce visible differences.

## Browser comparison (20 October 2026)

The local build and the reference were compared side by side at 1363 × 936, 800 × 1024, 390 × 844, and 320 × 740, plus the 1000/1001, 800/801, and 600/599 transitions. Comparisons used measured element boxes and screenshots. This is not a pixel diff. Changes made in this pass to follow the reference:

- Gallery, strip, and archive headings use the reference's large two-part heading treatment, with an accent span and a short intro line.
- The purchase guide follows the reference layout: a 0.75fr/1.25fr grid, a tilted lined field-guide card with a speech bubble and dark route bar, arrowed steps with step tags, and a four-column link row (two columns on phones).
- On phones, the hero's secondary buttons sit side by side and wrap their text.
- Between 600 and 1000px the book is a fixed 420px tall (it overflowed at 801px), and share buttons wrap at every width.
- "P." in the display font gets a manual kerning span, because Reika has no P/period pair.

Remaining known differences:

- The hero headline wraps to two lines.
- The header at 801px is a few pixels shorter than the reference's two-row navigation.
- The reference's video grid is intentionally omitted.
- Colours, artwork, and copy are this project's own.

## Hero comparison with thegroklet.com (20 October 2026)

The hero was rebuilt after the live Groklet hero, which was inspected at 1440, 1024, and 390px. Its stylesheet gives a 1fr / 0.9fr grid from 900px, a character-first stack below 900px, a radial halo, two slowly rotating orbit ellipses, a drifting glow, and a speech bubble with a tail. Adaptations:

- The Groklet character is a tall transparent cutout (560:1084). The supplied movie is a 16:9 transparent WebM, so like the reference it sits directly on the hero background with no frame, box, or poster behind it, inside a 16:9 stage with `object-fit: contain`. The stage uses balanced 1fr / 1fr columns rather than the reference's narrow portrait figure, and the movie is never masked, cropped, scaled, or mirrored.
- At the user's request the reference's orbit ellipses and speech bubble are not used, and the movie is enlarged (1.35× from 900px, 1.14× on phones) so the figure dominates the right column.
- The colours are charcoal and copper instead of the reference's navy, violet, and teal. The display font and existing copy are kept, and the name is set in two deliberate lines.
- The reference's scroll cue, X symbols, "Proof" section, and token details are not copied.
- In this browser the reference's own character animation did not render (its poster stays hidden), so only its layout and stylesheet were compared, not its footage.

The site is published as a GitHub Pages project page under `/JPMD/` until a custom domain is configured (see `README.md`).
