# Reference layout and behavior notes

Reference: https://www.robincoinrhcto.xyz/. Observed on 20 October 2026 at a desktop viewport of 1,363 × 936 CSS pixels. Narrow-screen behavior below is derived from the reference stylesheet, not from completed device testing of a Shiba website.

Use these observations with the asset placement map. Preserve the reference's sequence and composition when implementing the later site, with the user's explicit exception that the video grid and all video content are omitted. The supplied files are static; interface effects are implemented separately.

## Sequence and desktop proportions

| Order | Group | Reference geometry / composition |
|---|---|---|
| Header | Sticky navigation | Approximately 80px high; home badge, six internal links, four social links. |
| 1 | Hero | Approximately 832px high at the inspected viewport; text / portrait columns about 1.6:1 with 40px gap; separate backdrop, circular portrait, short large headline, supporting copy and four action slots. |
| 2 | Text band | Full-width repeating live text and separators. No separate raster asset. |
| 3 | Storybook | One cover state and five chapter states; illustration and live copy share a spread; spine, layered page edges, arrows and six navigation positions. Dedicated phone cover. |
| 4 | Main meme gallery | 67 unique images; 8 initially; expand 8 at a time through 64 and then 67. Four desktop columns; approximately 299px cards, 24px horizontal and 34px vertical gaps. Seven filters including the complete set. |
| 5 | Photo studio | Square 1,000 × 1,000 canvas; workspace up to 1,100px; about 1.5:1 preview/control columns, 32px gap, 20px corner radius. Base and transparent accessory are separate assets. |
| 6 | Image showcase | Upper strip uses 34 gallery entries and a repeated clone; lower strip uses 33 and a repeated clone. Static source images are 240px square in the desktop strips. Omit the reference's intervening video grid. |
| 7 | Social cards | Four cards, two desktop columns, 18px gap; approximately 150px card height. |
| 8 | Meme interlude | One independent square scene, centered with generous surrounding space. |
| 9 | Token registry | About 772px introduction / 440px record columns, 56px gap; main character and two supporting image badges. All token records remain live text. |
| 10 | Purchase guide | About 451.5px illustration / 752.5px instructions, 64px gap; four numbered instruction stages and four link slots. |
| 11 | Roadmap | Four illustrated cards in a two-column winding path: stages 1 and 2 upper row, 3 lower right, 4 lower left; dashed connections and live numbered markers. |
| 12 | Ecosystem reveal | Approximately 280vh scroll region; sticky stage about one viewport high, minimum 600px; framed portrait up to 360px wide; 22 reused decorative leaf instances. |
| 13 | Archive | Same 67 images in ten desktop columns; about 118px thumbnails and 10px gaps. |
| 14 | Closing banner | 3:1 source panorama; about 449px high at the inspected width; overlaid live copy and two actions. |
| Footer | Navigation and project record | Live wordmark, six internal links, four social links, short line and project record. |

Major desktop groups use roughly 40px horizontal gutters. The full project name needs an appropriate live-text fitting treatment; do not burn a name or ticker into images to force a match.

## Behavior observed in the reference

| Element | Behavior to reproduce in the later implementation |
|---|---|
| Hero portrait | About 5s floating / rocking cycle, roughly 14px vertical movement and ±3° rotation. |
| Buttons and cards | Small hover lift / scale changes, border and shadow feedback. |
| Text band | About 38s repeating cycle; pauses on hover. |
| Storybook | Manual forward/backward 3D turns, about 0.7s; controls lock during transition and disable at boundaries. Preserve the book treatment rather than a plain image swap. |
| Gallery filters | One active category; counts and cards update; filter changes reset the visible batch. |
| Image viewer | Enlarged contained image, editable live caption and action controls; Escape closes the viewer; page scrolling resumes on dismissal. |
| Image strips | About 160s cycles in opposite directions; pause on hover/focus. Loop clones reuse source files. |
| Purchase-guide cutout | About 7s floating cycle. |
| Reveal | Scroll progress drives background blend, heading appearance and the framed photograph's rising / fading / tilting treatment. Leaf instances drift within the composition. |
| Reduced motion | Simplify prominent loops, page turns, transforms and sticky reveal; image strips become manually scrollable. |

The reference was observed to produce a stale extra gallery entry after some filter / expansion changes. That inconsistency is not an additional intended asset slot. Keep 67 stable unique identities.

## Photo studio controls

The reference has size, angle, horizontal position and vertical position sliders; two color controls; flip; angle reset; add/remove accessory; photo upload; PNG export; and full reset. Size spans 40–1,000, angle −180° to 180°, and positions 0–1,000. Reference defaults were 660, 0°, 500 and 190. Preserve the control roles while adapting the accessory to the supplied Shiba ears, which are new artwork for review. Any claim that uploaded photos stay on the visitor's device must match the eventual implementation.

## Responsive observations

| Area | Narrow-screen behavior from the reference's final applicable CSS |
|---|---|
| Header | Compact approximately 72px header and dropdown menu at 800px and below. |
| Hero | Single column; text precedes portrait; smaller gutters and headline. |
| Book | Intermediate 600–1,000px rules use 55/45 columns; below 600px the turning book keeps illustration above copy and uses the portrait cover at 599px and below. |
| Gallery | Two columns at 800px and below; one below 360px. |
| Photo studio | Final rules keep a compact 0.9:1.1 two-column workspace; file actions form two columns. |
| Image strips | 180px square display items at 800px and below. |
| Social cards | One column at 800px and below. |
| Registry | Stacked; record panel centered, maximum width 440px. |
| Purchase guide | Instructions first, illustration second; link controls form two columns. |
| Roadmap | One column with vertical dashed path; internal card direction changes at 390px and below. |
| Reveal | Approximately 250vh region at 800px and below; smaller heading and photograph. |
| Archive | Three columns at 800px and below. |
| Closing / footer | Closing copy before the image in normal flow; footer groups wrap / stack. |

Reference typography roles are Reika for the decorative identity, Anton for condensed headings, Inter for body and interface content, and monospace for small records / labels. The asset pack preserves the font resources and records their sources and rights information. The new artwork uses warm neutral surroundings and black-and-tan fur; an exact global website palette is not declared user-approved by this delivery.

No website implementation, viewport comparison, touch interaction, editor upload/export test, or deployment is included in this asset-only stage.
