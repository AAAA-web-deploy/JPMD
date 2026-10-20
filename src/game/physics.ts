import {
  GRAVITY,
  JUMP_ANTICIPATION,
  JUMP_BUFFER,
  JUMP_VELOCITY,
} from "./constants.ts";
import type { Player } from "./types.ts";

export function createPlayer(): Player {
  return {
    y: 0,
    previousY: 0,
    vy: 0,
    grounded: true,
    anticipation: 0,
    buffered: false,
    landing: 0,
  };
}

/**
 * Requests a jump. Only a grounded, non-crouching duo can jump, so double jumps are
 * impossible; a press shortly before landing is buffered and fires on touchdown.
 * Returns true when a new jump begins.
 */
export function requestJump(player: Player): boolean {
  if (player.grounded && player.anticipation <= 0) {
    player.anticipation = JUMP_ANTICIPATION;
    player.buffered = false;
    return true;
  }
  if (!player.grounded && timeToLand(player) <= JUMP_BUFFER) player.buffered = true;
  return false;
}

/** Seconds until an airborne player touches the road. */
export function timeToLand(player: Player): number {
  if (player.grounded) return 0;
  const { y, vy } = player;
  return (vy + Math.sqrt(vy * vy + 2 * GRAVITY * y)) / GRAVITY;
}

/** Advances the player by dt seconds. Returns "jump" or "land" when that happens. */
export function stepPlayer(player: Player, dt: number): "jump" | "land" | null {
  player.previousY = player.y;
  player.landing = Math.max(0, player.landing - dt * 4);
  let event: "jump" | "land" | null = null;
  let remaining = dt;
  if (player.anticipation > 0) {
    player.anticipation -= dt;
    if (player.anticipation > 0) return null;
    remaining = -player.anticipation;
    player.anticipation = 0;
    player.grounded = false;
    player.vy = JUMP_VELOCITY;
    event = "jump";
  }
  if (player.grounded) return event;
  // Exact for constant gravity, so the arc does not depend on the step size.
  player.y += player.vy * remaining - 0.5 * GRAVITY * remaining * remaining;
  player.vy -= GRAVITY * remaining;
  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
    player.grounded = true;
    player.landing = 1;
    event = "land";
    if (player.buffered) requestJump(player);
  }
  return event;
}

/** Height of the jump arc t seconds after take-off. */
export function arcHeight(t: number): number {
  return Math.max(0, JUMP_VELOCITY * t - 0.5 * GRAVITY * t * t);
}
