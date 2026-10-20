import {
  BULL_BOX,
  CANDLE_MAX_HEIGHT,
  CANDLE_MAX_WIDTH,
  CANDLE_MIN_HEIGHT,
  CANDLE_MIN_WIDTH,
  CLUSTER_FROM_SCORE,
  CLUSTER_GAP,
  JUMP_AIRTIME,
  JUMP_ANTICIPATION,
  JUMP_HEIGHT,
  REACTION_TIME,
  SPAWN_X,
  SPEED_MAX,
  TIMING_TOLERANCE,
} from "./constants.ts";
import type { Candle } from "./types.ts";

/**
 * Tallest obstacle of a given total width that a single jump clears at `speed` while still
 * leaving TIMING_TOLERANCE seconds of slack. While the bull's box overlaps the obstacle
 * horizontally — (bull width + obstacle width) / speed seconds — its hooves must stay above
 * the obstacle; a jump arc stays above height h for JUMP_AIRTIME·√(1 − h/JUMP_HEIGHT) s.
 */
export function clearableHeight(speed: number, width: number): number {
  const needed = (BULL_BOX.width + width) / speed + TIMING_TOLERANCE;
  const ratio = needed / JUMP_AIRTIME;
  return JUMP_HEIGHT * (1 - ratio * ratio);
}

/**
 * Smallest distance between the back of one obstacle and the front of the next: the duo
 * must land from the first jump and still have REACTION_TIME on the road before the
 * latest take-off for the second one.
 */
export function minimumGap(speed: number): number {
  return speed * (JUMP_AIRTIME + JUMP_ANTICIPATION + REACTION_TIME) + BULL_BOX.width;
}

function between(random: () => number, low: number, high: number): number {
  return low + (high - low) * random();
}

export interface SpawnResult {
  candles: Candle[];
  /** Distance to scroll before the following spawn. */
  nextSpawnIn: number;
}

/**
 * Creates the next obstacle (one candle or, later on, a two-candle cluster) and the
 * distance to the one after it. Heights are limited by `clearableHeight` at the current
 * speed (speed only rises, which makes heights easier); spacing uses a slightly higher
 * speed because the course may speed up before the obstacle arrives.
 */
export function spawnObstacle(
  speed: number,
  score: number,
  firstId: number,
  random: () => number,
): SpawnResult {
  const low = CANDLE_MIN_HEIGHT;
  const cluster = score >= CLUSTER_FROM_SCORE && random() < 0.28;
  let widths = Array.from({ length: cluster ? 2 : 1 }, () =>
    Math.round(between(random, CANDLE_MIN_WIDTH, cluster ? 32 : CANDLE_MAX_WIDTH)),
  );
  const span = (list: number[]): number =>
    list.reduce((sum, width) => sum + width, 0) + CLUSTER_GAP * (list.length - 1);
  // A cluster too wide to clear at this speed becomes a single candle.
  if (cluster && clearableHeight(speed, span(widths)) - 4 < low + 8) widths = [widths[0]!];
  const total = span(widths);
  const limit = Math.min(CANDLE_MAX_HEIGHT, clearableHeight(speed, total) - 4);
  const progress = Math.min(1, score / 30);
  const high = Math.max(low, Math.min(limit, low + 30 + progress * 70));
  const candles: Candle[] = [];
  let x = SPAWN_X;
  widths.forEach((width, index) => {
    const height = Math.round(between(random, low, high));
    const lowerWick = Math.min(12, Math.round(height * 0.12));
    const upperWick = Math.round(height * between(random, 0.12, 0.24));
    candles.push({
      id: firstId + index,
      x,
      previousX: x,
      width,
      height,
      bodyBottom: lowerWick,
      bodyTop: height - upperWick,
      scored: false,
      phase: random() * Math.PI * 2,
    });
    x += width + CLUSTER_GAP;
  });
  const arrival = Math.min(SPEED_MAX, speed + 60);
  const slack = arrival * between(random, 0.05, 0.85 - 0.45 * progress);
  return { candles, nextSpawnIn: total + minimumGap(arrival) + slack };
}
