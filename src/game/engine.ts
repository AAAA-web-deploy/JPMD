import {
  FIRST_CANDLE_DELAY,
  GROUND_Y,
  IDLE_SPEED,
  PLAYER_X,
  SPAWN_X,
  SPEED_EASE,
  SPEED_MAX,
  SPEED_PER_POINT,
  SPEED_START,
  WORLD_WIDTH,
} from "./constants.ts";
import { hits, playerBoxes } from "./collision.ts";
import { spawnObstacle } from "./obstacles.ts";
import { createPlayer, requestJump, stepPlayer } from "./physics.ts";
import type { Game, Particle, ParticleKind } from "./types.ts";

export function createGame(random: () => number = Math.random): Game {
  return {
    status: "READY",
    score: 0,
    speed: SPEED_START,
    scroll: 0,
    previousScroll: 0,
    time: 0,
    player: createPlayer(),
    candles: [],
    particles: [],
    nextSpawnIn: 0,
    nextId: 1,
    crashTime: 0,
    tie: null,
    events: [],
    random,
  };
}

/** Clears the run (score, candles, effects, timers) but keeps the world scroll for continuity. */
function resetRun(game: Game): void {
  game.score = 0;
  game.speed = SPEED_START;
  game.time = 0;
  game.player = createPlayer();
  game.candles = [];
  game.particles = [];
  game.nextId = 1;
  game.crashTime = 0;
  game.tie = null;
  game.nextSpawnIn = SPEED_START * FIRST_CANDLE_DELAY + (SPAWN_X - WORLD_WIDTH);
}

/** READY or GAME_OVER → RUNNING with a fresh run and a fair delay before the first candle. */
export function start(game: Game): boolean {
  if (game.status !== "READY" && game.status !== "GAME_OVER") return false;
  resetRun(game);
  game.status = "RUNNING";
  game.events.push({ type: "start" });
  return true;
}

/** Retry is a fresh start from GAME_OVER or PAUSED (restart). */
export function retry(game: Game): boolean {
  if (game.status === "PAUSED") game.status = "GAME_OVER";
  return start(game);
}

export function jump(game: Game): boolean {
  if (game.status !== "RUNNING") return false;
  return requestJump(game.player);
}

export function pause(game: Game): boolean {
  if (game.status !== "RUNNING") return false;
  game.status = "PAUSED";
  game.events.push({ type: "pause" });
  return true;
}

export function resume(game: Game): boolean {
  if (game.status !== "PAUSED") return false;
  game.status = "RUNNING";
  game.events.push({ type: "resume" });
  return true;
}

function emit(
  game: Game,
  kind: ParticleKind,
  count: number,
  x: number,
  y: number,
  spread: { vx: [number, number]; vy: [number, number]; life: [number, number]; size: [number, number] },
): void {
  const r = (range: [number, number]): number =>
    range[0] + (range[1] - range[0]) * game.random();
  for (let i = 0; i < count; i++) {
    game.particles.push({
      kind,
      x,
      y,
      vx: r(spread.vx),
      vy: r(spread.vy),
      age: 0,
      life: r(spread.life),
      size: r(spread.size),
    });
  }
}

function stepParticles(game: Game, dt: number, worldSpeed: number): void {
  const kept: Particle[] = [];
  for (const particle of game.particles) {
    particle.age += dt;
    if (particle.age >= particle.life) continue;
    particle.x += (particle.vx - (particle.kind === "dust" ? worldSpeed * 0.6 : 0)) * dt;
    particle.y += particle.vy * dt;
    if (particle.kind === "spark" || particle.kind === "debris") particle.vy += 520 * dt;
    if (particle.kind === "dust") particle.vy *= 1 - 2 * dt;
    kept.push(particle);
  }
  game.particles = kept;
}

function crash(game: Game): void {
  game.status = "GAME_OVER";
  game.crashTime = 0;
  game.tie = { x: 0, y: 0, vx: -60, vy: -420, spin: 0 };
  const x = PLAYER_X + 150;
  emit(game, "debris", 14, x, GROUND_Y - game.player.y - 40, {
    vx: [-160, 220],
    vy: [-380, -120],
    life: [0.5, 0.9],
    size: [3, 7],
  });
  game.events.push({ type: "crash", score: game.score });
}

/** Advances the simulation by one fixed step of dt seconds. */
export function step(game: Game, dt: number): void {
  game.previousScroll = game.scroll;
  game.player.previousY = game.player.y;
  for (const candle of game.candles) candle.previousX = candle.x;

  if (game.status === "PAUSED") return;
  if (game.status === "READY") {
    game.time += dt;
    game.scroll += IDLE_SPEED * dt;
    stepParticles(game, dt, IDLE_SPEED);
    return;
  }
  if (game.status === "GAME_OVER") {
    game.crashTime += dt;
    if (game.tie) {
      game.tie.x += game.tie.vx * dt;
      game.tie.y += game.tie.vy * dt;
      game.tie.vy += 900 * dt;
      game.tie.spin += dt * 9;
    }
    stepParticles(game, dt, 0);
    return;
  }

  game.time += dt;
  const target = Math.min(SPEED_MAX, SPEED_START + game.score * SPEED_PER_POINT);
  game.speed = Math.min(target, game.speed + SPEED_EASE * dt);
  const distance = game.speed * dt;
  game.scroll += distance;

  const event = stepPlayer(game.player, dt);
  if (event === "jump") game.events.push({ type: "jump" });
  if (event === "land") {
    game.events.push({ type: "land" });
    emit(game, "dust", 8, PLAYER_X + 70, GROUND_Y - 4, {
      vx: [-90, 90],
      vy: [-60, -10],
      life: [0.35, 0.6],
      size: [6, 13],
    });
  }

  const playerLeft = playerBoxes(game.player.y)[0]!.left;
  for (const candle of game.candles) {
    candle.x -= distance;
    if (hits(game.player.y, candle, distance)) {
      crash(game);
      break;
    }
    if (!candle.scored && candle.x + candle.width < playerLeft) {
      candle.scored = true;
      game.score += 1;
      game.events.push({ type: "score", score: game.score });
      const y = GROUND_Y - game.player.y - 170;
      emit(game, "plus", 1, PLAYER_X + 92, y, {
        vx: [0, 0],
        vy: [-70, -70],
        life: [0.9, 0.9],
        size: [1, 1],
      });
      emit(game, "spark", 12, PLAYER_X + 92, y + 30, {
        vx: [-150, 150],
        vy: [-330, -120],
        life: [0.45, 0.8],
        size: [2, 4.5],
      });
    }
  }
  game.candles = game.candles.filter((candle) => candle.x + candle.width > -40);

  game.nextSpawnIn -= distance;
  if (game.status === "RUNNING" && game.nextSpawnIn <= 0) {
    const spawned = spawnObstacle(game.speed, game.score, game.nextId, game.random);
    // Keep the overshoot so spacing does not depend on the step size.
    for (const candle of spawned.candles) {
      candle.x += game.nextSpawnIn;
      candle.previousX = candle.x + distance;
    }
    game.candles.push(...spawned.candles);
    game.nextId += spawned.candles.length;
    game.nextSpawnIn += spawned.nextSpawnIn;
  }
  stepParticles(game, dt, game.speed);
}
