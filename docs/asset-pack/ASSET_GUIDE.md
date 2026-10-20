# Asset placement guide

Paths are relative to this folder. `catalog/placement-map.json` is the machine-readable map; the inventory records exact dimensions.

| Reference position | Shiba replacement | Usage |
|---|---|---|
| Header home badge | `images/brand/header-mascot.png` | Transparent small mascot; keep the surrounding navigation as live interface content. |
| Hero background | `images/hero/city-office-background-v2.png` | Empty office/city backdrop, separate from the portrait. |
| Hero portrait | `images/brand/shiba-portrait-clean.png` | Circular character portrait; no embedded wordmark or symbol. |
| Storybook cover, desktop | `images/story/cover-wide.png` | Wide cover with blank title space; overlay headings as live text. |
| Storybook cover, phone | `images/story/cover-mobile.png` | Portrait variant of the same cover concept; reference switches at 599px and below. |
| Five story chapters | `images/story/chapter-01.png` through `chapter-05.png` | One illustration per chapter. Keep the book's page-turn structure and separate text panel. |
| Main meme gallery | `images/memes/` | 67 distinct square scenes. Eight initially; expand in batches of eight, ending at 67. |
| Photo editor base | `images/editor/shiba-base.png` | Static default image for the later canvas implementation. |
| Photo editor overlay | `images/editor/shiba-ears-overlay.png` | Transparent Shiba ears, supplied as a project-specific accessory for review. Size, position, angle and color controls require website code. |
| Upper image strip | Odd-positioned gallery items | 34 source images; looping clones reuse these exact files. |
| Reference video grid | Omitted | No video assets or video posters under the user's static-only rule. |
| Lower image strip | Even-positioned gallery items | 33 source images; reuse rather than create another collection. |
| Four social cards | `icons/social-*.svg` and `icons/arrow-up-right.svg` | Four social interface marks; destinations must be actual project accounts. |
| Large meme interlude | `images/community/phone-call-interlude.png` | Separate illustration, additional to the 67 gallery items. |
| Token registry main | `images/ledger/ledger.png` | Transparent character with a blank ledger. |
| Token registry badges | `images/ledger/verify.png`, `images/ledger/hold-standing.png` | Two transparent supporting illustrations; no verification or listing claim is established by the art. |
| Purchase guide | `images/ledger/buy-guide.png` | Transparent guide character; the instructional steps remain live text. |
| Four roadmap cards | `images/roadmap/flag.png`, `bell.png`, `city.png`, `book.png` | Four distinct transparent illustrations. No roadmap promises are embedded. |
| Ecosystem reveal | `images/editorial/vitalik-buterin-romanpoet-2016.jpg` | Genuine editorial photograph mapped to the existing framed-image slot for this pack. Include its credit. |
| Reveal decorations | `icons/ginkgo-leaf.svg` | A static shape reused for the reference's 22 decorative instances; movement, if retained, is website behavior. |
| Compact archive | Same 67 gallery files | Ten desktop columns and three phone columns in the reference; shared viewer. |
| Closing banner | `images/community/closing-panorama-v2.png` | Wide community scene; copy remains separate. |
| Venue button image slots | `icons/swap.svg`, `icons/chart.svg` | Generic function marks supplied without asserting a venue listing. |

## Story image sequence

| Chapter | Illustration content |
|---|---|
| 1 | Three anonymous financiers between old financial architecture and a modern city. |
| 2 | The same financiers hear an original cat's presentation. |
| 3 | The financiers encounter an original frog near a city bridge. |
| 4 | They meet the Shiba and examine an open blank ledger. |
| 5 | The Shiba, financiers, and builders look toward a city under construction. |

These are visual scenes for the supplied narrative concept, not final approved chapter titles or website copy. No real person's statement is fabricated.

## Implementation handoff

- Keep interface typography and captions outside the images. The project name may appear in live text after the website is built; the image files remain unlettered.
- Use image containment for the square gallery and transparent cutouts. Use the dedicated phone cover rather than stretching the wide cover.
- Preserve alpha channels. Avoid adding a white background when exporting or optimizing a transparent PNG.
- The gallery, viewer, image strips, and archive share stable asset identities. No additional copies are required for repeated appearances.
- SVG interface icons are static and use `currentColor` where appropriate. The leaf uses warm neutral fills. Apply final approved website colors in the later implementation.
- Reference behavior includes the turning book, gallery filters and viewer, photo editor, hover effects, two opposed image strips, and scroll reveal. Those effects are not baked into the artwork. Provide reduced-motion behavior in the eventual site.
- No website has been rendered or device-tested as part of this asset-only delivery.
