export type GameStatus = "READY" | "RUNNING" | "PAUSED" | "GAME_OVER";

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Player {
  /** Height of the bull's hooves above the road (0 when grounded). */
  y: number;
  previousY: number;
  vy: number;
  grounded: boolean;
  /** Seconds left in the take-off crouch; 0 when not crouching. */
  anticipation: number;
  /** A jump requested just before landing. */
  buffered: boolean;
  /** 1 right after landing, easing back to 0 (squash and dust). */
  landing: number;
}

export interface Candle {
  id: number;
  x: number;
  previousX: number;
  width: number;
  /** Full height from the road to the top of the upper wick. */
  height: number;
  /** Body top and bottom, measured upward from the road. */
  bodyTop: number;
  bodyBottom: number;
  scored: boolean;
  /** Visual phase for the glow pulse. */
  phase: number;
}

export type ParticleKind = "dust" | "spark" | "plus" | "debris";
export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

export type GameEvent =
  | { type: "start" }
  | { type: "jump" }
  | { type: "land" }
  | { type: "score"; score: number }
  | { type: "crash"; score: number }
  | { type: "pause" }
  | { type: "resume" };

export interface Game {
  status: GameStatus;
  score: number;
  speed: number;
  /** Total scrolled distance; drives parallax and the road texture. */
  scroll: number;
  previousScroll: number;
  /** Seconds since the run (or the idle animation) started. */
  time: number;
  player: Player;
  candles: Candle[];
  particles: Particle[];
  /** Distance still to scroll before the next candle spawns. */
  nextSpawnIn: number;
  nextId: number;
  /** Seconds since the crash (drives the crash reaction). */
  crashTime: number;
  /** Position of the flying tie after a crash, relative to the rider. */
  tie: { x: number; y: number; vx: number; vy: number; spin: number } | null;
  events: GameEvent[];
  random: () => number;
}
