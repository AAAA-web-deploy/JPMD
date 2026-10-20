# Bull Run — Ride the Red!

A small endless runner that replaced the former Shiba photo editor. Shiba P. Morgan rides his bull down Wall Street while red candlesticks roll in from the right. It is pure entertainment: no trading, wallet, account, token, or network request is involved.

## How to play

1. Scroll to **Bull Run** (navigation link, or the hero's **Play Bull Run** button).
2. Press **Start running**, press Space while the game has focus, or click the game.
3. Jump each red candle. Clearing a candle scores one point. Touching one ends the run with **MARKET CORRECTION!**
4. **Try again** (or **R**) starts a fresh run.

| Action | Keyboard                       | Touch / mouse                                |
| ------ | ------------------------------ | -------------------------------------------- |
| Start  | Space / Arrow Up (game focused) | **START RUNNING**, or click the game         |
| Jump   | Space / Arrow Up               | Tap the game, or the **JUMP** bar on phones |
| Pause  | P or Escape                    | Pause button in the score bar               |
| Resume | P or Escape                    | **RESUME**                                   |
| Retry  | R (after a crash or paused)    | **TRY AGAIN** / **RESTART**                  |

Keys never fire while the visitor is typing in a field or a dialog is open. Space is captured (so the page does not scroll) only while the game is engaged, and held keys do not repeat jumps. The game pauses itself when the tab is hidden, the page is left, or the game scrolls out of view; it never resumes by surprise.

Sound is off by default. The sound toggle creates the Web Audio context only after that click, and the effects are generated tones, not files.

## Scoring and best score

- +1 for each candle (or two-candle cluster member) once it has fully passed the bull. Each candle scores exactly once.
- Speed starts at 320 px/s and eases toward `320 + 11 × score`, capped at 640 px/s. Candles get taller as the score rises, and two-candle clusters appear from score 8.
- The best score is saved in `localStorage` under `jpmd-bull-run-best-v1` as soon as it is beaten. If the browser blocks storage (private modes, disabled cookies), the game still works and keeps the best score for the visit; the caption says so.

## Code map

| File                         | Role                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `src/game/constants.ts`      | Every tuning value: world size, jump, speeds, candle sizes, fairness margins, storage key |
| `src/game/types.ts`          | Game, player, candle, particle, and event types                                           |
| `src/game/physics.ts`        | Exact constant-gravity jump, crouch, landing, and jump buffering                          |
| `src/game/obstacles.ts`      | Candle generation; `clearableHeight` and `minimumGap` keep every course fair              |
| `src/game/collision.ts`      | Padded bull and rider boxes; candle body and wick boxes; swept tests for fast frames      |
| `src/game/engine.ts`         | State machine (READY, RUNNING, PAUSED, GAME_OVER), fixed-step update, scoring, effects    |
| `src/game/storage.ts`        | Safe best-score load/save                                                                  |
| `src/game/art.ts`            | Vector drawings of the bull, Shiba rider, tie, and candles                                |
| `src/game/renderer.ts`       | Canvas sizing (device-pixel-ratio capped at 2), parallax Wall Street, particles, crash shake |
| `src/components/bullRun.ts`  | Section markup, HUD, overlays, input, loop, visibility, sound, cleanup                    |
| `tests/bull-run.test.ts`     | Physics, scoring, collision, fairness, long seeded bot runs, pause/retry, storage         |
| `tests/bull-run-ui.test.ts`  | Controls, overlays, best score across reloads, auto-pause, reduced motion, cleanup        |

The simulation uses a fixed 120 Hz step with interpolated rendering, so it plays identically at 30, 60, or 144 Hz. The world is a fixed 960 × 540 logical space scaled to the canvas, so phones see the same course at a smaller size and are never harder than desktops.

## Tuning difficulty

Edit `src/game/constants.ts`; no other file needs changes.

- **Faster or slower game:** `SPEED_START`, `SPEED_MAX`, `SPEED_PER_POINT`, `SPEED_EASE`.
- **Jump feel:** `JUMP_AIRTIME` and `JUMP_HEIGHT` (gravity and launch speed are derived), `JUMP_ANTICIPATION`, `JUMP_BUFFER`.
- **Candles:** `CANDLE_MIN_/MAX_HEIGHT`, `CANDLE_MIN_/MAX_WIDTH`, `CLUSTER_GAP`, `CLUSTER_FROM_SCORE`.
- **Fairness margins:** `TIMING_TOLERANCE` (slack inside each jump window) and `REACTION_TIME` (ground time between consecutive jumps). Lowering these makes the game harder.

Generated candles are capped by `clearableHeight(speed, width)` and spaced by `minimumGap(speed)`, so changing the numbers cannot create an impossible course. Run `npm test` afterwards: the fairness test checks thousands of spawns, and a timing bot must survive 150 seconds on several seeds.

## Replacing the character art

The duo and candles are drawn in code (`src/game/art.ts`); no image files are needed. To change them:

- Colors: edit `palette` at the top of `art.ts`.
- Shapes: `bullBody`, `bullHead`, `shibaHead`, `shibaRider`, `drawTie`, and `drawCandle` each draw one part in local coordinates, with the duo's feet at `y = 0` and its left edge at `x = 0`.
- To use bitmap art instead, draw an image in `drawDuo` (keep the pose transforms), add the file to `public/`, and register it in `src/data/asset-manifest.json` so `npm run check:assets` verifies it.

Collision boxes are independent of the drawing. If the silhouette changes size, adjust `BULL_BOX` and `RIDER_BOX` in `constants.ts`; they are deliberately a little smaller than the art so near-misses that look clean are clean.

## Section integration

`renderBullRun()` returns prerendered HTML placed in `src/components/page.ts` after the meme gallery; `initBullRun()` is registered in `src/main.ts` and returns a cleanup function that removes every listener, observer, timer, frame, and audio context. Anchor aliases `#studio` and `#shiba-studio` sit inside the section so old links still work.

Accessibility: the game area is focusable with a description of the controls, the score uses `<output>`, results and state changes are announced through a polite live region, hidden overlays are `inert`, all buttons are at least 44 px tall, and reduced motion removes the idle scroll, screen shake, and panel transitions. Touch scrolling is blocked only on the game area and only while a run is active.

## Build and deploy

```bash
npm run dev     # http://127.0.0.1:5173
npm run check   # tests, typecheck, asset checks, build, prerender, output checks
```

Pushing `main` runs `.github/workflows/pages.yml`, which builds with `BASE_PATH=/JPMD/` and deploys to https://aaaa-web-deploy.github.io/JPMD/. The game itself loads no files at runtime, so the base path only affects the compiled script and stylesheet.
