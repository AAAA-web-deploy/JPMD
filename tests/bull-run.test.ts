import test from "node:test";
import assert from "node:assert/strict";
import {
  BULL_BOX,
  CLUSTER_GAP,
  GROUND_Y,
  JUMP_AIRTIME,
  JUMP_ANTICIPATION,
  JUMP_HEIGHT,
  PLAYER_X,
  SPEED_MAX,
  SPEED_START,
  STEP_SECONDS,
  STORAGE_KEY,
} from "../src/game/constants.ts";
import { createGame, jump, pause, resume, retry, start, step } from "../src/game/engine.ts";
import { clearableHeight, minimumGap, spawnObstacle } from "../src/game/obstacles.ts";
import { arcHeight, createPlayer, requestJump, stepPlayer } from "../src/game/physics.ts";
import { hits } from "../src/game/collision.ts";
import { loadBest, saveBest } from "../src/game/storage.ts";
import type { Candle, Game } from "../src/game/types.ts";

/** Deterministic pseudo-random numbers for repeatable courses. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function run(game: Game, seconds: number, each?: (game: Game) => void): void {
  for (let t = 0; t < seconds; t += STEP_SECONDS) {
    each?.(game);
    step(game, STEP_SECONDS);
  }
}

function candle(x: number, height = 60, width = 30): Candle {
  return {
    id: 1,
    x,
    previousX: x,
    width,
    height,
    bodyBottom: 6,
    bodyTop: height - 12,
    scored: false,
    phase: 0,
  };
}

/** Jumps so that the middle of the airtime lines up with the middle of the next obstacle. */
function perfectPlayer(game: Game): void {
  if (!game.player.grounded || game.player.anticipation > 0) return;
  const bullCentre = PLAYER_X + BULL_BOX.left + BULL_BOX.width / 2;
  const ahead = game.candles
    .filter((c) => c.x + c.width > PLAYER_X + BULL_BOX.left)
    .sort((a, b) => a.x - b.x);
  if (!ahead.length) return;
  let end = ahead[0]!.x + ahead[0]!.width;
  for (const next of ahead.slice(1)) {
    if (next.x - end > CLUSTER_GAP + 1) break;
    end = next.x + next.width;
  }
  const centre = (ahead[0]!.x + end) / 2;
  if ((centre - bullCentre) / game.speed <= JUMP_ANTICIPATION + JUMP_AIRTIME / 2) jump(game);
}

test("the jump arc matches the tuned airtime and height, independent of step size", () => {
  for (const dt of [1 / 30, 1 / 60, STEP_SECONDS]) {
    const player = createPlayer();
    assert.equal(requestJump(player), true);
    let airtime = 0;
    let apex = 0;
    let launched = false;
    for (let i = 0; i < 2000; i++) {
      const event = stepPlayer(player, dt);
      if (event === "jump") launched = true;
      if (launched) airtime += dt;
      apex = Math.max(apex, player.y);
      if (event === "land") break;
    }
    assert.ok(Math.abs(airtime - JUMP_AIRTIME) <= dt + 1e-9, `airtime ${airtime} at dt ${dt}`);
    assert.ok(apex <= JUMP_HEIGHT + 1e-6 && apex > JUMP_HEIGHT - 2);
  }
  assert.equal(arcHeight(JUMP_AIRTIME / 2).toFixed(6), JUMP_HEIGHT.toFixed(6));
});

test("READY → RUNNING; only a grounded duo jumps; no double jumps", () => {
  const game = createGame(seeded(1));
  assert.equal(game.status, "READY");
  assert.equal(jump(game), false, "Cannot jump before the run starts.");
  run(game, 1);
  assert.equal(game.candles.length, 0, "No candles before the run starts.");
  assert.equal(start(game), true);
  assert.equal(game.status, "RUNNING");
  assert.equal(start(game), false, "Start only works from READY or GAME_OVER.");
  assert.equal(jump(game), true);
  assert.equal(jump(game), false, "No second jump while crouching.");
  run(game, 0.2);
  assert.ok(game.player.y > 0);
  assert.equal(jump(game), false, "No double jump in the air.");
  run(game, 0.2);
  assert.equal(jump(game), false);
  run(game, 0.5);
  assert.equal(game.player.grounded, true);
  assert.equal(jump(game), true, "Can jump again after landing.");
});

test("a press just before landing is buffered into the next jump", () => {
  const player = createPlayer();
  requestJump(player);
  for (let t = 0; t < JUMP_ANTICIPATION + JUMP_AIRTIME - 0.06; t += STEP_SECONDS)
    stepPlayer(player, STEP_SECONDS);
  assert.equal(requestJump(player), false);
  let jumps = 0;
  for (let t = 0; t < 0.3; t += STEP_SECONDS)
    if (stepPlayer(player, STEP_SECONDS) === "jump") jumps++;
  assert.equal(jumps, 1);
});

test("candles enter from the right and move left; the first one leaves time to react", () => {
  const game = createGame(seeded(2));
  start(game);
  let firstSeen = -1;
  run(game, 4, (g) => {
    if (firstSeen < 0 && g.candles.length) firstSeen = g.time;
  });
  assert.ok(firstSeen > 0.8, `first candle after ${firstSeen}s`);
  const first = game.candles[0] ?? null;
  const seen = createGame(seeded(2));
  start(seen);
  run(seen, firstSeen + 0.02);
  const fresh = seen.candles[0]!;
  assert.ok(fresh.x > 940, "Spawns at the right edge.");
  const x = fresh.x;
  run(seen, 0.5);
  assert.ok(seen.candles[0]!.x < x, "Moves from right to left.");
  assert.ok(first === null || first.x < x);
});

test("passing a candle scores exactly once; a hit ends the run and stops scoring", () => {
  const game = createGame(seeded(3));
  start(game);
  game.nextSpawnIn = 1e9;
  game.candles = [candle(700)];
  run(game, 3, perfectPlayer);
  assert.equal(game.status, "RUNNING");
  assert.equal(game.score, 1);
  assert.equal(game.events.filter((e) => e.type === "score").length, 1);
  run(game, 2, perfectPlayer);
  assert.equal(game.score, 1, "The same candle never scores twice.");

  game.candles = [candle(560)];
  run(game, 3);
  assert.equal(game.status, "GAME_OVER");
  assert.equal(game.score, 1, "A hit candle does not score.");
  const crash = game.events.find((e) => e.type === "crash");
  assert.deepEqual(crash, { type: "crash", score: 1 });
  game.candles.push(candle(0, 60), candle(-200, 60));
  run(game, 3);
  assert.equal(game.score, 1, "No points after game over.");
  assert.equal(jump(game), false);
});

test("hitboxes: landing on a candle, wick grazes, and fast candles", () => {
  const top = candle(PLAYER_X + 60, 80);
  assert.equal(hits(0, top), true, "Running into a candle body hits.");
  assert.equal(hits(70, top), true, "Landing on top of a candle hits.");
  assert.equal(hits(90, top), false, "Clearing it by a little does not.");
  const wick = candle(PLAYER_X + BULL_BOX.left + BULL_BOX.width + 4, 90, 40);
  wick.x = PLAYER_X + BULL_BOX.left + BULL_BOX.width - 6;
  assert.equal(hits(wick.bodyTop + 2, wick), false, "The edge of the body is padded.");
  const passed = candle(PLAYER_X + BULL_BOX.left - 34, 60, 30);
  assert.equal(hits(0, passed), false, "Already behind the bull after a big step...");
  assert.equal(hits(0, passed, 12), true, "...but the swept path through the bull still hits.");
  const behind = candle(PLAYER_X + BULL_BOX.left - 10, 60);
  assert.equal(hits(0, behind), true, "A candle partly under the bull still hits.");
});

test("every generated obstacle fits one jump, with room to land and jump again", () => {
  const random = seeded(4);
  for (let speed = SPEED_START; speed <= SPEED_MAX; speed += 20) {
    for (let score = 0; score <= 60; score += 3) {
      for (let i = 0; i < 25; i++) {
        const { candles, nextSpawnIn } = spawnObstacle(speed, score, 1, random);
        const span = candles.at(-1)!.x + candles.at(-1)!.width - candles[0]!.x;
        for (const c of candles) {
          assert.ok(c.height <= clearableHeight(speed, span), `${c.height} at ${speed}`);
          assert.ok(c.bodyTop > c.bodyBottom && c.bodyTop < c.height);
        }
        assert.ok(nextSpawnIn - span >= minimumGap(speed));
      }
    }
  }
});

test("a well-timed player clears long seeded runs as the course speeds up", () => {
  for (const seed of [11, 12, 13]) {
    const game = createGame(seeded(seed));
    start(game);
    run(game, 150, perfectPlayer);
    assert.equal(game.status, "RUNNING", `seed ${seed} crashed at score ${game.score}`);
    assert.ok(game.score > 80, `seed ${seed} scored ${game.score}`);
    assert.ok(game.speed > SPEED_START + 200 && game.speed <= SPEED_MAX);
  }
});

test("pause freezes the world exactly; resume continues without a jump in physics", () => {
  const game = createGame(seeded(5));
  start(game);
  jump(game);
  run(game, 1.3);
  jump(game);
  run(game, 0.2);
  const state = (): string =>
    JSON.stringify({ ...game, status: "", events: [], random: 0 }, (key, value) =>
      key.startsWith("previous") ? undefined : value,
    );
  const snapshot = state();
  assert.equal(pause(game), true);
  assert.equal(jump(game), false);
  run(game, 10);
  assert.equal(state(), snapshot);
  const y = game.player.y;
  assert.equal(resume(game), true);
  step(game, STEP_SECONDS);
  assert.ok(Math.abs(game.player.y - y) < 10, "One normal step after resuming.");
});

test("retry resets the run, candles, effects, and timers", () => {
  const game = createGame(seeded(6));
  start(game);
  game.candles = [candle(560)];
  game.nextSpawnIn = 1e9;
  game.score = 7;
  run(game, 2);
  assert.equal(game.status, "GAME_OVER");
  assert.ok(game.tie);
  assert.equal(retry(game), true);
  assert.equal(game.status, "RUNNING");
  assert.equal(game.score, 0);
  assert.equal(game.candles.length, 0);
  assert.equal(game.tie, null);
  assert.equal(game.particles.length, 0);
  assert.equal(game.speed, SPEED_START);
  assert.equal(game.player.y, 0);
  assert.ok(game.nextSpawnIn > 200, "A fresh run waits before the first candle.");
  pause(game);
  assert.equal(retry(game), true, "Restart from the pause menu.");
  assert.equal(game.status, "RUNNING");
});

test("best score keeps the maximum, survives reloads, and tolerates blocked storage", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
  assert.equal(loadBest(storage), 0);
  assert.equal(saveBest(storage, 5), true);
  assert.equal(values.get(STORAGE_KEY), "5");
  saveBest(storage, 3);
  assert.equal(loadBest(storage), 5, "A lower score does not replace the best.");
  saveBest(storage, 9);
  assert.equal(loadBest(storage), 9, "The best is a maximum, not a total.");
  values.set(STORAGE_KEY, "nonsense");
  assert.equal(loadBest(storage), 0);
  const blocked = {
    getItem: () => {
      throw new DOMException("denied", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("full", "QuotaExceededError");
    },
  };
  assert.equal(loadBest(blocked), 0);
  assert.equal(saveBest(blocked, 4), false);
  assert.equal(loadBest(null), 0);
  assert.equal(saveBest(null, 4), false);
  assert.equal(GROUND_Y > 0, true);
});
