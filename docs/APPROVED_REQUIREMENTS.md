# Agreed requirements and review status

This ledger uses only visible context in this conversation. Rejected proposals and withdrawn prompts are excluded from accepted decisions.

## Agreed direction

1. Work on the meme direction in this thread. Do not retrieve or import other conversations or the separate non-meme direction.
2. Use **Shiba P. Morgan Inu** and the approved modern 3D black-and-tan Shiba banker identity.
3. Adapt https://www.robincoinrhcto.xyz/: preserve its overall structure, section order, image density, placement, layout, responsive arrangements, and effects while replacing project content.
4. Use a fresh, clean Shiba theme instead of the reference's green scheme.
5. Include a genuine Vitalik Buterin photograph, accurately contextualized and attributed.
6. Follow the user's story concept: anonymous Wall Street financiers explore crypto, meet a cat and a frog, then find their spark through the Shiba and enter an Ethereum story. Keep the narrative understandable for ordinary traders.
7. Keep names, tickers, token symbols, contract addresses, and similar information out of generated images. Keep live copy separate from artwork.
8. Use individual static images only. Include no videos or animated image files. Omit the reference's video grid. Website CSS and interface effects can animate static content.
   - **User-authorized exception (hero only):** "My new instruction authorizes my supplied movie in this hero only. It overrides the previous blanket no-video rule for this one location. Keep the rest of the site's media static. Generate no new artwork or videos." The supplied transparent `banner_movie_v3.webm` (which replaced `banner_movie_v2.mp4` at the user's request) is used unchanged as the hero movie; its poster is its own transparent first frame. It plays from the beginning on first open, then waits about 4 seconds after each play-through before playing again (a 9-second cycle), pauses when the hero is left, and restarts from the beginning on return. At the user's request the orbit circles, the greeting bubble, and the play/pause control were removed and the movie was enlarged. All other media remain static, and the asset checks still reject any other video or animated file.
9. The user has now explicitly authorized a complete **Node.js, TypeScript, and Tailwind CSS codebase in one downloadable ZIP**. This supersedes the earlier asset-only delivery scope.
10. Continue iterative review. Authorization to build is not blanket approval of new creative or implementation choices.

## Implementation choices for review

- Exact ivory, stone, copper, and tan palette; typography fitting for the longer name.
- New narrative wording, section headings, image captions, and creative roadmap wording.
- Individual new scenes from the preceding asset pack. (Its Shiba-ear editor accessory was retired with the photo editor.)
- Bull Run's code-drawn bull, rider, candles, and street scene, its difficulty tuning, and its sound effects.
- Vite, vanilla TypeScript components, Tailwind CSS 4, prerendering, and a Node production server.

These are concrete editable work, not newly approved decisions. No ticker, supply, network deployment, contract, listing, account, or destination has been invented. Those fields remain unannounced until supplied in `src/config.ts`.

## Scope and accuracy

- The user later instructed: "Push the source code to the GitHub repository and then deploy the site. GitHub Link: https://github.com/AAAA-web-deploy/JPMD.git Deploy: Deploy website via GitHub until you have a proper domain." The source is hosted there and deployed with GitHub Pages through `.github/workflows/pages.yml`. No domain, token, account, or transaction was created.
- The hero restyle after https://thegroklet.com/ (dark charcoal hero with copper glow and an enlarged transparent movie; the orbit lines, greeting, and pause/play control were later removed at the user's request) follows the user's hero prompts. Its exact colours and sizes are implementation choices for review. Existing copy, CTA labels, and destinations are unchanged.
- Refinements in the 20 October 2026 pass (reference-style headings, purchase-guide treatment, phone hero buttons, book sizing, viewer Escape handling, subpath hosting) are implementation choices for review, not newly approved creative decisions.
- The user's "JPMD Bull Run mini-game" prompt replaced the photo editor section with the playable **Bull Run — Ride the Red!** game, using the prompt's headings and copy. The game is entertainment only: no trading, wallet, staking, or transaction. Its art is drawn in code; no artwork, third-party mascots, or videos were added.
- The narrative is fiction; it does not assert that a bank selected, recognized, or endorsed this independent token.
- Vitalik's photograph is historical context, not an endorsement or announcement photograph.
- Build and behavioral checks pass. Browser checks against the reference are recorded in `VALIDATION.md` and `REFERENCE_MATCH.md`; no pixel-for-pixel equivalence is claimed.
