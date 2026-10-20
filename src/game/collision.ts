import { BULL_BOX, GROUND_Y, PLAYER_X, RIDER_BOX } from "./constants.ts";
import type { Candle, Rect } from "./types.ts";

/** Padded collision boxes for the bull and its rider at hoof height y (world coordinates). */
export function playerBoxes(y: number): Rect[] {
  const feet = GROUND_Y - y - BULL_BOX.foot;
  return [
    {
      left: PLAYER_X + BULL_BOX.left,
      right: PLAYER_X + BULL_BOX.left + BULL_BOX.width,
      bottom: feet,
      top: feet - BULL_BOX.height,
    },
    {
      left: PLAYER_X + RIDER_BOX.left,
      right: PLAYER_X + RIDER_BOX.left + RIDER_BOX.width,
      bottom: GROUND_Y - y - RIDER_BOX.bottom,
      top: GROUND_Y - y - RIDER_BOX.bottom - RIDER_BOX.height,
    },
  ];
}

/**
 * Candle hit areas: the body plus a narrow upper wick (a wick graze is a fair hit only
 * near its centre line). `sweep` widens the boxes by the distance moved this step, so a
 * fast candle cannot tunnel through the bull between steps.
 */
export function candleBoxes(candle: Candle, sweep = 0): Rect[] {
  const centre = candle.x + candle.width / 2;
  return [
    {
      left: candle.x + 2,
      right: candle.x + candle.width - 2 + sweep,
      top: GROUND_Y - candle.bodyTop,
      bottom: GROUND_Y,
    },
    {
      left: centre - 2,
      right: centre + 2 + sweep,
      top: GROUND_Y - candle.height,
      bottom: GROUND_Y - candle.bodyTop,
    },
  ];
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function hits(y: number, candle: Candle, sweep = 0): boolean {
  const bodies = candleBoxes(candle, sweep);
  return playerBoxes(y).some((box) => bodies.some((part) => overlaps(box, part)));
}
