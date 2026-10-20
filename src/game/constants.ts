/**
 * Bull Run tuning. All distances are logical world pixels in a fixed 960 × 540 world that is
 * scaled to the canvas, so small screens show the same course at a smaller size and are never
 * harder than large ones. Edit the values here to change difficulty; `obstacles.ts` derives
 * candle heights and spacing from them, so every generated course stays clearable.
 */
export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
/** The road surface the bull runs on. */
export const GROUND_Y = 452;

/** Left edge of the duo's collision box: about 25% from the left of the world. */
export const PLAYER_X = 240;
/** Bull collision box (padded inside the drawing so grazes that look clean are clean). */
export const BULL_BOX = { left: 26, width: 118, height: 74, foot: 6 } as const;
/** Rider collision box, relative to the duo's left edge and current height. */
export const RIDER_BOX = { left: 66, width: 46, bottom: 70, height: 66 } as const;

/** Simulation runs at a fixed 120 Hz; rendering interpolates between steps. */
export const STEP_SECONDS = 1 / 120;
/** Longest frame the loop will simulate after a stall (prevents huge jumps). */
export const MAX_FRAME_SECONDS = 0.1;

/** Jump: 0.8 s airtime, 170 px apex (gravity and launch speed follow from these). */
export const JUMP_AIRTIME = 0.8;
export const JUMP_HEIGHT = 170;
export const GRAVITY = (8 * JUMP_HEIGHT) / JUMP_AIRTIME ** 2;
export const JUMP_VELOCITY = (GRAVITY * JUMP_AIRTIME) / 2;
/** Crouch before take-off. Short enough to feel instant, long enough to read. */
export const JUMP_ANTICIPATION = 0.05;
/** A jump pressed this close to landing is remembered and fires on touchdown. */
export const JUMP_BUFFER = 0.12;

export const SPEED_START = 320;
export const SPEED_MAX = 640;
/** Target speed rises by this much per point scored... */
export const SPEED_PER_POINT = 11;
/** ...and the actual speed eases toward it at this rate (px/s²). */
export const SPEED_EASE = 36;
/** Gentle scroll in the READY state. */
export const IDLE_SPEED = 70;

/** Candle geometry, including both wicks. */
export const CANDLE_MIN_HEIGHT = 42;
export const CANDLE_MAX_HEIGHT = 128;
export const CANDLE_MIN_WIDTH = 26;
export const CANDLE_MAX_WIDTH = 44;
/** Gap inside a two-candle cluster. */
export const CLUSTER_GAP = 8;
/** Score from which two-candle clusters may appear. */
export const CLUSTER_FROM_SCORE = 8;
/** Seconds of slack a player always gets inside each candle's jump window. */
export const TIMING_TOLERANCE = 0.12;
/** Seconds on the ground a player gets between two consecutive jumps. */
export const REACTION_TIME = 0.35;
/** Where new candles appear (just off the right edge). */
export const SPAWN_X = WORLD_WIDTH + 24;
/** Time before the first candle reaches the right edge on a fresh run. */
export const FIRST_CANDLE_DELAY = 0.9;

export const STORAGE_KEY = "jpmd-bull-run-best-v1";
