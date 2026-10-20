# Shiba P. Morgan Inu

A complete Node.js, TypeScript, and Tailwind CSS codebase for the Shiba P. Morgan Inu adaptation of [the supplied reference](https://www.robincoinrhcto.xyz/). It follows the reference's composition, section order, image reuse, responsive rules, and interactions, with the previously requested Shiba identity, warm neutral palette, genuine Vitalik photograph, and static-only media.

This is a locally buildable project. It has not been published. Browser-rendered visual comparison remains outstanding; this delivery does not claim verified pixel-for-pixel parity.

## Run locally

Use **Node.js 22.18 or newer** and npm. The project was checked with Node.js 24.19.0. Run these commands from the extracted project folder:

```bash
npm ci
npm run dev
```

Open the address printed by Vite, normally `http://127.0.0.1:5173`.

For a production build and the included Node server:

```bash
npm run build
npm start
```

The production server defaults to `http://127.0.0.1:3000` and serves only `dist/`. Set `HOST` and `PORT` in the hosting environment if needed. A static host can also serve the generated `dist/`. Builds target the domain root by default; for a subdirectory, build with `BASE_PATH` set (for example `BASE_PATH=/JPMD/ npm run build`).

### GitHub Pages

`.github/workflows/pages.yml` runs the tests and deploys to GitHub Pages on every push to `main`. It builds with the repository's Pages base path (`/JPMD/` for a project page, `/` once a custom domain is attached). In the repository settings, Pages must use **GitHub Actions** as its source; the workflow tries to enable this automatically. Live site: https://aaaa-web-deploy.github.io/JPMD/

## Included

- Sticky navigation/mobile menu; hero portrait, backdrop, four action slots, and repeating text band.
- A cover and five illustrated chapters with manual 3D turns, keyboard navigation, transition locking, and a dedicated phone cover.
- All 67 collection images, seven filters, eight-at-a-time expansion, editable caption viewer, original-image download, caption copy, and X share links.
- A local photo studio: static-photo upload, draggable ear layers, rotation, size/position/colors, flip, add/remove layers, reset, and clean 1,000 × 1,000 PNG export.
- Two opposing image strips, four social cards, interlude, project registry, purchase guide, illustrated roadmap, sticky Ethereum reveal, genuine Vitalik photograph, archive, closing panorama, and footer.
- Reduced-motion styles, focus treatments, Escape dismissal, accessible labels, lazy images, local fonts, and a static SVG icon sprite.
- Original assets, inventory checksums, placement records, credits, source code, dependency lockfile, tests, and a production server.

**No videos or animated image files are included.** Motion comes from CSS and UI transitions. Names, captions, and project records are separate HTML text; the generated artwork is unchanged and unlettered. The reference's video grid is omitted as requested.

## Configure the project

Edit `src/config.ts` for approved launch details: ticker, network, supply, contract, canonical URL, market links, explorer, and social accounts. Current `null` values display as unannounced and disable destination buttons. No contract, listing, or account is assumed. Only HTTPS external destinations are accepted.

Chapters, captions, and creative roadmap copy live in `src/content.ts`. Section structure/copy lives in `src/components/page.ts`; component-specific copy lives alongside its renderer. Palette and responsive rules are in `src/styles/main.css`. Metadata defaults are in `index.html`; configured title and canonical URL are applied during the production build.

Current copy, exact palette, new scenes, and the ear accessory are implementation material for review, not additional user approvals. See `docs/APPROVED_REQUIREMENTS.md`.

The financiers, cat, frog, and Shiba form a fictional story. The historical Vitalik photograph is editorial context; neither it nor the story establishes a partnership or endorsement.

## Photo studio

Photos are read through local browser object URLs. There is no upload endpoint, analytics, wallet connection, or external processing service. Accepted formats are static PNG, JPEG, and WebP, up to 20 MiB and 40 million decoded pixels. GIF, animated PNG, and animated WebP are rejected. Photos are centered and cropped to the square canvas; controls support up to 12 ear layers. Reset removes the uploaded photo from the studio.

PNG export draws a separate canvas without selection guides or added lettering. Gallery downloads retain original image bytes. Caption copying and X sharing are separate text operations; the share link contains text and an image URL rather than automatically attaching a local upload.

## Verification

```bash
npm run check
```

This runs behavioral tests, strict TypeScript checking, media integrity checks, Vite production build, prerendering, and output reference checks. Individual commands are `npm test`, `npm run typecheck`, `npm run check:assets`, and `npm run check:dist` after building.

Production HTML contains the full page, initial gallery batch, both strips, and all 67 archive entries before JavaScript runs. JavaScript enables book turns, filtering, viewer controls, studio, mobile navigation, and scroll effects.

Read `docs/VALIDATION.md` for results and remaining browser checks. This environment did not permit browser QA; real-device appearance, native downloads, touch gestures, and canvas PNG encoding require browser review.

## Files

| Location          | Purpose                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `src/components/` | Page, storybook, gallery/viewer, and studio                         |
| `src/lib/`        | Geometry, safe HTML/URLs, gallery state, canvas drawing             |
| `src/styles/`     | Tailwind entry, theme, responsive layout, local fonts               |
| `src/data/`       | Stable collection identities and integrity manifest                 |
| `public/`         | Required images, icons, and fonts                                   |
| `scripts/`        | Asset checks, prerendering, production output verification          |
| `tests/`          | Node tests and DOM emulator; no browser installation required       |
| `server.ts`       | Node production static server                                       |
| `docs/`           | Requirements, reference mapping, validation, asset records, credits |

The ZIP excludes `node_modules/` and `dist/`; `npm ci` and `npm run build` recreate them. All source assets are included; the previous asset ZIP is not needed.

## Credits and font rights

Keep the visible Vitalik credit: **Romanpoet, 4 June 2016, CC BY-SA 4.0**, [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:VitalikButerinProfile.jpg). The supplied photograph is unchanged and displayed proportionally.

Anton and Inter include their SIL Open Font License files. The supplied Reika reference font has no embedded redistribution or web-use license; inclusion does not convey those rights. Obtain the applicable font rights for publication or replace the `--brand` font and its preload. Detailed records are in `docs/asset-pack/CREDITS.md` and `docs/asset-pack/licenses/`.

Build documentation: [Vite](https://vite.dev/guide/) · [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite).
