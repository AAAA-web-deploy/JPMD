# Reference implementation map

Reference: https://www.robincoinrhcto.xyz/. This implements the Shiba adaptation established in this conversation. Detailed observations are retained in `asset-pack/REFERENCE_LAYOUT.md`.

| Reference area     | Implementation                                  | Adaptation                                                                                                      |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Header and hero    | `page.ts`, `main.ts`, `main.css`                | Navigation/action roles and two-column composition; Shiba art and live text                                     |
| Text band          | `page.ts`, `content.ts`                         | Repeated HTML groups; 38-second loop                                                                            |
| Storybook          | `book.ts`                                       | Cover plus five chapters; spine, 700ms manual turn, six positions, phone cover                                  |
| Gallery            | `gallery.ts`, `lib/gallery.ts`                  | 67 identities; seven filters; 8 → 16 → … → 64 → 67; category reset to eight                                     |
| Viewer             | `gallery.ts`                                    | Modal dialog, contained image, editable caption, download/copy/share, Escape and focus return                   |
| Photo studio       | `studio.ts`, `lib/editor.ts`, `lib/geometry.ts` | 1,000px square canvas, base and separate ears, sliders, colors, layers, drag/rotation, local upload, PNG export |
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
- The studio retains the reference's compact two-column phone workspace; pointer mapping accounts for a contained square canvas.
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

The site is published as a GitHub Pages project page under `/JPMD/` until a custom domain is configured (see `README.md`).
