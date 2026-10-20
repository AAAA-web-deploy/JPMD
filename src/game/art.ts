/**
 * Vector character art for Bull Run, drawn in logical world pixels. The duo is a small rig:
 * the bull's body, head, four legs, and tail, and the rider's torso, head, ears, tie, arm,
 * and leg are separate parts posed every frame. The designs follow the site's
 * `49-bullish-by-nature.png`: a black-and-tan Shiba in a charcoal pinstripe double-breasted
 * suit and navy dotted tie, and a polished bronze Wall Street bull with brass horns.
 * To restyle a character, edit the palette or the part functions below.
 */
import { GROUND_Y } from "./constants.ts";
import type { Candle } from "./types.ts";

export const palette = {
  bronzeLight: "#f1bd76",
  bronze: "#b8763a",
  bronzeDark: "#6e3e18",
  bronzeShadow: "#4a2810",
  horn: "#f3d38c",
  hornDark: "#a8742e",
  hoof: "#2e2018",
  suit: "#2f2e35",
  suitDark: "#1f1e24",
  stripe: "#ffffff1c",
  shirt: "#fbf8f2",
  tie: "#1f2f5c",
  tieDot: "#8aa0d6",
  furBlack: "#2a1d17",
  furTan: "#c8772f",
  furCream: "#f6e4cc",
  earInner: "#efc9a6",
  nose: "#15100d",
  gold: "#e3b25c",
  candle: "#c4312a",
  candleDark: "#6d0f0c",
  candleLight: "#ec5a45",
  wick: "#5a1310",
  green: "#2f9e5b",
} as const;

export interface DuoPose {
  /** Gallop phase in radians (tied to scrolled distance, so hooves never skate). */
  phase: number;
  /** Seconds, for wind and idle motion. */
  time: number;
  /** 0 grounded … 1 airborne. */
  air: number;
  /** Vertical velocity normalised to the launch speed (1 rising … −1 falling). */
  rise: number;
  /** 0…1 take-off crouch. */
  crouch: number;
  /** 0…1 landing squash. */
  landing: number;
  /** null while running; seconds since the crash otherwise. */
  crash: number | null;
  /** Hide the tie on the rider (it is flying away after a crash). */
  tieGone: boolean;
}

type Ctx = CanvasRenderingContext2D;

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rotation = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
}

/** One leg as two tapered segments and a hoof. Angles are radians from straight down, forward positive. */
function leg(
  ctx: Ctx,
  hipX: number,
  hipY: number,
  upper: number,
  lower: number,
  color: string,
  hind: boolean,
): void {
  const a = 27;
  const b = 23;
  const kneeX = hipX + Math.sin(upper) * a;
  const kneeY = hipY + Math.cos(upper) * a;
  const footX = kneeX + Math.sin(upper + lower) * b;
  const footY = kneeY + Math.cos(upper + lower) * b;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = hind ? 17 : 14;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY - 6);
  ctx.lineTo(kneeX, kneeY);
  ctx.stroke();
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(kneeX, kneeY);
  ctx.lineTo(footX, footY);
  ctx.stroke();
  ctx.fillStyle = palette.hoof;
  ctx.save();
  ctx.translate(footX, footY);
  ctx.rotate(upper + lower);
  ctx.beginPath();
  ctx.roundRect(-6, -1, 12, 7, 2);
  ctx.fill();
  ctx.restore();
}

function legAngles(phase: number, offset: number, hind: boolean, air: number): [number, number] {
  const p = phase + offset;
  const swing = Math.sin(p);
  const lift = Math.max(0, Math.sin(p + 1.3));
  const run: [number, number] = hind
    ? [0.5 * swing - 0.05, 0.95 * lift]
    : [0.55 * swing + 0.05, -1.15 * lift];
  // In the air the bull tucks its front legs and stretches its hind legs back.
  const tuck: [number, number] = hind ? [-0.7, 0.5] : [0.9, -1.6];
  return [run[0] + (tuck[0] - run[0]) * air, run[1] + (tuck[1] - run[1]) * air];
}

function bullBody(ctx: Ctx): void {
  const gradient = ctx.createLinearGradient(0, -108, 0, -36);
  gradient.addColorStop(0, palette.bronzeLight);
  gradient.addColorStop(0.45, palette.bronze);
  gradient.addColorStop(1, palette.bronzeDark);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(22, -86);
  ctx.bezierCurveTo(44, -100, 78, -100, 100, -106);
  ctx.bezierCurveTo(124, -112, 146, -102, 150, -84);
  ctx.bezierCurveTo(156, -66, 150, -48, 132, -42);
  ctx.bezierCurveTo(106, -36, 70, -38, 46, -42);
  ctx.bezierCurveTo(24, -44, 10, -56, 12, -70);
  ctx.bezierCurveTo(13, -78, 16, -83, 22, -86);
  ctx.fill();
  // Muscle definition and polished highlights.
  ctx.strokeStyle = "#5b3214aa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(118, -96);
  ctx.quadraticCurveTo(108, -70, 120, -46);
  ctx.moveTo(46, -88);
  ctx.quadraticCurveTo(34, -66, 46, -46);
  ctx.stroke();
  ctx.strokeStyle = "#fff1c880";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(34, -90);
  ctx.bezierCurveTo(60, -98, 90, -100, 118, -106);
  ctx.stroke();
}

function bullHead(ctx: Ctx, shocked: boolean, time: number): void {
  ctx.save();
  ctx.translate(146, -88);
  ctx.rotate(shocked ? -0.18 : 0.12);
  // Far horn.
  ctx.fillStyle = palette.hornDark;
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.quadraticCurveTo(6, -30, 20, -40);
  ctx.quadraticCurveTo(10, -24, 4, -6);
  ctx.fill();
  // Ear.
  ctx.fillStyle = palette.bronzeDark;
  ellipse(ctx, -6, -6, 10, 5, -0.5);
  ctx.fill();
  // Skull and muzzle.
  const gradient = ctx.createLinearGradient(0, -16, 0, 40);
  gradient.addColorStop(0, palette.bronzeLight);
  gradient.addColorStop(0.6, palette.bronze);
  gradient.addColorStop(1, palette.bronzeDark);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(-8, -12);
  ctx.bezierCurveTo(10, -18, 30, -12, 38, 4);
  ctx.bezierCurveTo(46, 18, 44, 34, 32, 38);
  ctx.bezierCurveTo(20, 42, 4, 36, -2, 26);
  ctx.bezierCurveTo(-10, 14, -14, -2, -8, -12);
  ctx.fill();
  ctx.fillStyle = "#d89a5c";
  ellipse(ctx, 34, 28, 13, 10, 0.3);
  ctx.fill();
  ctx.fillStyle = palette.bronzeShadow;
  ellipse(ctx, 40, 27, 3.2, 2.4, 0.3);
  ctx.fill();
  ctx.strokeStyle = palette.bronzeShadow;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (shocked) ellipse(ctx, 30, 36, 4, 3);
  else {
    ctx.moveTo(24, 36);
    ctx.quadraticCurveTo(32, 40, 40, 36);
  }
  ctx.stroke();
  // Eye: determined while running, saucer-wide after a crash.
  ctx.fillStyle = "#fffaf0";
  ellipse(ctx, 18, 2, shocked ? 7 : 5.5, shocked ? 7 : 4.2);
  ctx.fill();
  ctx.fillStyle = palette.nose;
  ellipse(ctx, shocked ? 18 : 20, shocked ? 2 : 2.4, shocked ? 1.8 : 2.6, shocked ? 1.8 : 2.8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ellipse(ctx, 21, 1, 0.9, 0.9);
  ctx.fill();
  ctx.strokeStyle = palette.bronzeShadow;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (shocked) {
    ctx.moveTo(10, -9);
    ctx.quadraticCurveTo(18, -14, 26, -9);
  } else {
    ctx.moveTo(11, -5);
    ctx.lineTo(26, -2 + Math.sin(time * 3) * 0.6);
  }
  ctx.stroke();
  // Near horn, curving forward and up.
  const horn = ctx.createLinearGradient(0, -10, 30, -46);
  horn.addColorStop(0, palette.hornDark);
  horn.addColorStop(1, palette.horn);
  ctx.fillStyle = horn;
  ctx.beginPath();
  ctx.moveTo(2, -14);
  ctx.bezierCurveTo(10, -30, 22, -42, 34, -48);
  ctx.bezierCurveTo(26, -36, 20, -22, 14, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function bullTail(ctx: Ctx, phase: number, air: number): void {
  const sway = Math.sin(phase * 0.5) * 6 + air * -8;
  ctx.strokeStyle = palette.bronzeDark;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(14, -78);
  ctx.quadraticCurveTo(-6, -82 + sway * 0.5, -16, -66 + sway);
  ctx.stroke();
  ctx.fillStyle = palette.bronzeShadow;
  ellipse(ctx, -17, -63 + sway, 4, 6, 0.4);
  ctx.fill();
}

function shibaHead(ctx: Ctx, pose: DuoPose, bounce: number): void {
  const shocked = pose.crash !== null;
  const excited = !shocked && pose.air > 0.3;
  ctx.save();
  ctx.translate(98, -176 + bounce);
  ctx.rotate(shocked ? -0.12 : -0.04 * pose.rise);
  const flap = Math.sin(pose.phase * 2) * 0.12 + pose.rise * 0.18;
  // Ears (black outside, cream inside), bouncing with the gallop.
  for (const [x, lean, extra] of [
    [-11, -0.32, flap],
    [9, 0.22, flap * 0.8],
  ] as const) {
    ctx.save();
    ctx.translate(x, -12);
    ctx.rotate(lean - extra);
    ctx.fillStyle = palette.furBlack;
    ctx.beginPath();
    ctx.moveTo(-9, 4);
    ctx.quadraticCurveTo(-4, -16, 0, -22);
    ctx.quadraticCurveTo(6, -14, 9, 4);
    ctx.fill();
    ctx.fillStyle = palette.earInner;
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.quadraticCurveTo(-2, -10, 0, -15);
    ctx.quadraticCurveTo(3, -9, 5, 2);
    ctx.fill();
    ctx.restore();
  }
  // Head: black crown, tan cheeks, cream muzzle and jaw.
  ctx.fillStyle = palette.furBlack;
  ellipse(ctx, 0, 0, 21, 19);
  ctx.fill();
  ctx.fillStyle = palette.furTan;
  ellipse(ctx, 2, 8, 19, 12);
  ctx.fill();
  ctx.fillStyle = palette.furCream;
  ellipse(ctx, 6, 11, 15, 9);
  ctx.fill();
  ellipse(ctx, 18, 5, 10, 7.5, -0.15);
  ctx.fill();
  // Tan brow dots.
  ctx.fillStyle = palette.furTan;
  ellipse(ctx, -5, -8, 3.4, 2.4);
  ellipse(ctx, 9, -9, 3.2, 2.3);
  ctx.fill();
  // Eyes.
  for (const x of [-4, 10]) {
    if (shocked) {
      ctx.fillStyle = "#fffaf0";
      ellipse(ctx, x, -2, 4.6, 4.6);
      ctx.fill();
      ctx.fillStyle = palette.nose;
      ellipse(ctx, x + 0.5, -2, 1.5, 1.5);
      ctx.fill();
    } else if (excited) {
      ctx.fillStyle = palette.nose;
      ellipse(ctx, x, -2, 3, 3.4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ellipse(ctx, x + 1, -3, 1, 1);
      ctx.fill();
    } else {
      // Confident, half-lidded.
      ctx.fillStyle = palette.nose;
      ellipse(ctx, x, -1.4, 3, 2.2);
      ctx.fill();
      ctx.strokeStyle = palette.furBlack;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, -3);
      ctx.lineTo(x + 4, -3.6);
      ctx.stroke();
    }
  }
  // Nose and mouth.
  ctx.fillStyle = palette.nose;
  ellipse(ctx, 26, 2, 4.4, 3.2);
  ctx.fill();
  ctx.strokeStyle = palette.nose;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (shocked) {
    ctx.fillStyle = "#6b2a20";
    ellipse(ctx, 17, 13, 3.6, 4.4);
    ctx.fill();
  } else if (excited) {
    ctx.fillStyle = "#7a2d22";
    ctx.moveTo(10, 10);
    ctx.quadraticCurveTo(17, 19, 24, 9);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.moveTo(10, 10);
    ctx.quadraticCurveTo(17, 15, 24, 8);
    ctx.stroke();
  }
  ctx.restore();
}

function shibaRider(ctx: Ctx, pose: DuoPose, bounce: number): void {
  const shocked = pose.crash !== null;
  const lean = shocked ? -0.22 : pose.air > 0.2 ? -0.16 * Math.max(0.3, pose.rise) - 0.04 : 0.05;
  ctx.save();
  ctx.translate(90, -100 + bounce);
  ctx.rotate(lean);
  ctx.translate(-90, 100 - bounce);

  // Trouser leg draped over the bull's side, with a polished black shoe.
  ctx.strokeStyle = palette.suitDark;
  ctx.lineCap = "round";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(84, -102 + bounce);
  ctx.quadraticCurveTo(108, -98 + bounce, 106, -76 + bounce);
  ctx.stroke();
  ctx.fillStyle = "#111014";
  ellipse(ctx, 112, -70 + bounce, 9, 5, 0.2);
  ctx.fill();

  // Jacket with pinstripes, lapels, shirt, buttons, and pocket square.
  ctx.save();
  ctx.translate(0, bounce);
  ctx.fillStyle = palette.suit;
  ctx.beginPath();
  ctx.moveTo(72, -100);
  ctx.bezierCurveTo(68, -124, 72, -146, 82, -156);
  ctx.lineTo(108, -156);
  ctx.bezierCurveTo(118, -142, 118, -118, 112, -100);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = palette.stripe;
  ctx.lineWidth = 1;
  for (let x = 66; x < 122; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x, -160);
    ctx.lineTo(x + 3, -98);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = palette.shirt;
  ctx.beginPath();
  ctx.moveTo(88, -156);
  ctx.lineTo(104, -156);
  ctx.lineTo(97, -134);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.suitDark;
  ctx.beginPath();
  ctx.moveTo(84, -156);
  ctx.lineTo(97, -130);
  ctx.lineTo(90, -128);
  ctx.closePath();
  ctx.moveTo(108, -156);
  ctx.lineTo(97, -130);
  ctx.lineTo(104, -127);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.gold;
  for (const [x, y] of [
    [92, -122],
    [102, -122],
    [92, -110],
    [102, -110],
  ] as const) {
    ellipse(ctx, x, y, 1.6, 1.6);
    ctx.fill();
  }
  ctx.fillStyle = palette.shirt;
  ctx.beginPath();
  ctx.moveTo(76, -140);
  ctx.lineTo(84, -140);
  ctx.lineTo(82, -136);
  ctx.closePath();
  ctx.fill();

  // Tie: knotted at the collar and streaming back in the wind.
  if (!pose.tieGone) drawTie(ctx, 96, -154, pose, 1);
  ctx.restore();

  shibaHead(ctx, pose, bounce);

  // Near arm: hand on the bull's neck while running, paw raised in the air or after a crash.
  const raised = shocked ? 1 : Math.min(1, pose.air * 1.6);
  const handX = 140 + (114 - 140) * raised;
  const handY = -98 + (-196 - -98) * raised + bounce;
  ctx.strokeStyle = palette.suit;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(106, -148 + bounce);
  ctx.quadraticCurveTo(
    124 - 6 * raised,
    -132 - 40 * raised + bounce,
    handX - 6,
    handY + (raised > 0.5 ? 10 : -4),
  );
  ctx.stroke();
  ctx.fillStyle = palette.shirt;
  ellipse(ctx, handX - 5, handY + (raised > 0.5 ? 8 : -3), 5, 4);
  ctx.fill();
  ctx.fillStyle = palette.furTan;
  ellipse(ctx, handX, handY, 6.5, 5.5);
  ctx.fill();
  ctx.fillStyle = palette.furCream;
  ellipse(ctx, handX + 2, handY - 1, 3.4, 2.6);
  ctx.fill();
  ctx.restore();
}

/** The navy dotted tie. `wind` 1 streams it back; it also spins free after a crash. */
export function drawTie(ctx: Ctx, x: number, y: number, pose: DuoPose, wind: number): void {
  const flutter = Math.sin(pose.time * 14) * 0.18 + Math.sin(pose.time * 23) * 0.06;
  const angle = wind * (0.25 + 0.55 * Math.min(1, pose.air + 0.4) + flutter);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = palette.tie;
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.lineTo(3, 0);
  ctx.lineTo(2, 5);
  ctx.lineTo(-2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.translate(0, 4);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-2.5, 0);
  ctx.lineTo(2.5, 0);
  ctx.lineTo(5, 24);
  ctx.lineTo(0, 30);
  ctx.lineTo(-5, 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.tieDot;
  for (const [dx, dy] of [
    [0, 6],
    [-2, 13],
    [2, 13],
    [0, 20],
    [-2.5, 25],
    [2.5, 25],
  ] as const) {
    ellipse(ctx, dx, dy, 0.9, 0.9);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws the duo with its hooves at (x, groundY − height). The rig squashes on take-off and
 * landing, pitches through the jump, and freezes in surprise after a crash.
 */
export function drawDuo(ctx: Ctx, x: number, height: number, pose: DuoPose): void {
  const running = pose.crash === null;
  const phase = running ? pose.phase : 0.9;
  const bob = running && pose.air < 0.1 ? -Math.abs(Math.sin(phase)) * 4 : 0;
  const riderBounce = running && pose.air < 0.1 ? Math.sin(phase * 2 + 0.6) * 2.2 : 0;
  const squash = 1 - 0.09 * pose.crouch - 0.1 * pose.landing;
  const stretch = 1 + 0.05 * pose.crouch + 0.06 * pose.landing;
  const pitch = running ? -0.1 * pose.rise * pose.air : -0.06;

  // Ground shadow shrinks as the duo rises.
  const shadow = Math.max(0.35, 1 - height / 260);
  ctx.fillStyle = `rgba(28, 20, 14, ${0.32 * shadow})`;
  ellipse(ctx, x + 84, GROUND_Y + 3, 80 * shadow, 8 * shadow);
  ctx.fill();

  ctx.save();
  ctx.translate(x + 84, GROUND_Y - height);
  ctx.scale(stretch, squash);
  ctx.rotate(pitch);
  ctx.translate(-84, bob);

  const air = running ? pose.air : 0.4;
  const legs: [number, number, boolean, number][] = [
    [44, -50, true, 0.55],
    [128, -52, false, Math.PI + 0.5],
  ];
  // Far legs (darker) behind the body.
  for (const [hx, hy, hind, offset] of legs) {
    const [upper, lower] = legAngles(phase, offset, hind, air);
    leg(ctx, hx + 6, hy, upper, lower, palette.bronzeDark, hind);
  }
  bullTail(ctx, phase, air);
  bullBody(ctx);
  for (const [hx, hy, hind, offset] of legs) {
    const [upper, lower] = legAngles(phase, offset - 0.55, hind, air);
    leg(ctx, hx, hy, upper, lower, palette.bronze, hind);
  }
  bullHead(ctx, !running, pose.time);
  shibaRider(ctx, pose, riderBounce);

  if (!running) {
    // A comic "!!" over the bull's head.
    const pop = Math.min(1, (pose.crash ?? 0) * 6);
    ctx.save();
    ctx.translate(168, -150);
    ctx.scale(pop, pop);
    ctx.fillStyle = "#fffaf0";
    ctx.strokeStyle = palette.bronzeShadow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -18, 32, 30, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = palette.candle;
    ctx.font = "26px Anton, Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!!", 0, -2);
    ctx.restore();
  }
  ctx.restore();
}

/** A bearish candlestick standing on the road: lower wick, body, upper wick, and a red glow. */
export function drawCandle(ctx: Ctx, candle: Candle, x: number, time: number): void {
  const base = GROUND_Y;
  const top = base - candle.height;
  const bodyTop = base - candle.bodyTop;
  const bodyBottom = base - candle.bodyBottom;
  const centre = x + candle.width / 2;
  const pulse = 0.65 + 0.35 * Math.sin(time * 3 + candle.phase);
  ctx.save();
  ctx.globalAlpha = candle.scored ? 0.72 : 1;
  ctx.fillStyle = "rgba(60, 10, 8, 0.28)";
  ellipse(ctx, centre + 6, base + 3, candle.width * 0.8, 4);
  ctx.fill();
  ctx.strokeStyle = palette.wick;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centre, top + Math.sin(time * 5 + candle.phase) * 1.2);
  ctx.lineTo(centre, bodyTop);
  ctx.moveTo(centre, bodyBottom);
  ctx.lineTo(centre, base);
  ctx.stroke();
  ctx.shadowColor = `rgba(226, 52, 40, ${0.35 + 0.25 * pulse})`;
  ctx.shadowBlur = 12 + 8 * pulse;
  const body = ctx.createLinearGradient(x, 0, x + candle.width, 0);
  body.addColorStop(0, palette.candleLight);
  body.addColorStop(0.35, palette.candle);
  body.addColorStop(1, palette.candleDark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x, bodyTop, candle.width, bodyBottom - bodyTop, 3);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#4a0907";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#ffffff2e";
  ctx.fillRect(x + 4, bodyTop + 4, 3, Math.max(0, bodyBottom - bodyTop - 8));
  ctx.restore();
}
