import { drawCandle, drawDuo, drawTie, palette } from "./art.ts";
import type { DuoPose } from "./art.ts";
import {
  GROUND_Y,
  JUMP_ANTICIPATION,
  JUMP_VELOCITY,
  PLAYER_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./constants.ts";
import type { Game } from "./types.ts";

type Ctx = CanvasRenderingContext2D;

/** Gallop stride in world pixels per full leg cycle. */
const STRIDE = 96;

/** Canvas backing size for a CSS box, with the device-pixel ratio capped for performance. */
export function canvasSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  cap = 2,
): { width: number; height: number; ratio: number } {
  const ratio = Math.max(1, Math.min(cap, devicePixelRatio || 1));
  return {
    width: Math.max(1, Math.round(cssWidth * ratio)),
    height: Math.max(1, Math.round(cssHeight * ratio)),
    ratio,
  };
}

/** Small deterministic noise so skylines look hand-placed but never change between frames. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function farSkyline(ctx: Ctx, width: number): void {
  const horizon = 392;
  let x = -10;
  let i = 0;
  while (x < width) {
    const w = 38 + hash(i) * 46;
    const h = 90 + hash(i + 40) * 170;
    ctx.fillStyle = hash(i + 7) > 0.5 ? "#dcc3a2" : "#d3b893";
    ctx.fillRect(x, horizon - h, w, h);
    if (hash(i + 3) > 0.72) {
      // Art-deco crown.
      ctx.beginPath();
      ctx.moveTo(x + 4, horizon - h);
      ctx.lineTo(x + w / 2, horizon - h - 26 - hash(i + 9) * 20);
      ctx.lineTo(x + w - 4, horizon - h);
      ctx.fill();
    } else if (hash(i + 5) > 0.6) {
      ctx.fillRect(x + w / 2 - 1, horizon - h - 22, 2, 22);
    }
    ctx.fillStyle = "#f6e6cc66";
    for (let wy = horizon - h + 10; wy < horizon - 8; wy += 12)
      for (let wx = x + 6; wx < x + w - 6; wx += 9) if (hash(wx * 3 + wy) > 0.45) ctx.fillRect(wx, wy, 3, 5);
    x += w + 2 + hash(i + 2) * 10;
    i++;
  }
}

function columnsBuilding(ctx: Ctx, x: number, width: number, base: number): void {
  const top = base - 150;
  ctx.fillStyle = "#c9ab84";
  ctx.fillRect(x, top + 30, width, 120);
  ctx.fillStyle = "#b8976e";
  ctx.beginPath();
  ctx.moveTo(x - 8, top + 32);
  ctx.lineTo(x + width / 2, top);
  ctx.lineTo(x + width + 8, top + 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d9bf9b";
  ctx.fillRect(x - 6, top + 30, width + 12, 8);
  ctx.fillRect(x - 6, base - 12, width + 12, 12);
  const columns = 6;
  const gap = width / columns;
  for (let c = 0; c < columns; c++) {
    const cx = x + gap * (c + 0.5);
    ctx.fillStyle = "#e6d0ae";
    ctx.fillRect(cx - 6, top + 40, 12, 98);
    ctx.fillStyle = "#b8976e88";
    ctx.fillRect(cx + 2, top + 40, 3, 98);
  }
}

function tower(ctx: Ctx, x: number, width: number, height: number, base: number, seed: number): void {
  ctx.fillStyle = seed % 2 ? "#b79874" : "#a98a66";
  ctx.fillRect(x, base - height, width, height);
  ctx.fillStyle = "#8f7253";
  ctx.fillRect(x - 3, base - height, width + 6, 6);
  ctx.fillStyle = "#f3dfb944";
  for (let y = base - height + 14; y < base - 10; y += 14)
    for (let wx = x + 6; wx < x + width - 6; wx += 10) ctx.fillRect(wx, y, 5, 8);
}

function lamp(ctx: Ctx, x: number, base: number): void {
  ctx.fillStyle = "#3b3129";
  ctx.fillRect(x - 2, base - 88, 4, 88);
  ctx.fillRect(x - 7, base - 4, 14, 4);
  ctx.beginPath();
  ctx.arc(x, base - 92, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe9b0";
  ctx.shadowColor = "#ffd27a";
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function streetSign(ctx: Ctx, x: number, base: number): void {
  ctx.fillStyle = "#3b3129";
  ctx.fillRect(x - 2, base - 96, 4, 96);
  ctx.fillStyle = "#2f6b48";
  ctx.beginPath();
  ctx.roundRect(x - 34, base - 104, 68, 18, 3);
  ctx.fill();
  ctx.fillStyle = "#f4ece1";
  ctx.font = "12px Anton, Impact, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WALL ST", x, base - 95);
}

function tickerBoard(ctx: Ctx, x: number, base: number): void {
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.roundRect(x, base - 128, 92, 56, 4);
  ctx.fill();
  ctx.fillStyle = "#3a3530";
  ctx.fillRect(x + 44, base - 72, 4, 72);
  // A tiny chart: mostly green, one red, for the joke.
  const bars = [18, 26, 22, 32, 14, 36, 40];
  bars.forEach((h, i) => {
    ctx.fillStyle = i === 4 ? palette.candle : "#3fae6a";
    ctx.fillRect(x + 8 + i * 11, base - 80 - h, 6, h * 0.8);
  });
}

function midground(ctx: Ctx, width: number): void {
  const base = 404;
  tower(ctx, 0, 70, 210, base, 1);
  columnsBuilding(ctx, 90, 210, base);
  tower(ctx, 320, 86, 250, base, 2);
  tickerBoard(ctx, 430, base);
  tower(ctx, 540, 64, 190, base, 3);
  tower(ctx, 620, 96, 280, base, 4);
  columnsBuilding(ctx, 740, 170, base);
  tower(ctx, 930, 80, 230, base, 5);
  tower(ctx, 1030, 70, 175, base, 6);
  tower(ctx, 1120, 100, 260, base, 7);
  for (const x of [80, 330, 520, 720, 935, 1110]) lamp(ctx, x, base);
  streetSign(ctx, 612, base);
  ctx.fillStyle = "#e9d8bd";
  ctx.fillRect(0, base, width, GROUND_Y - base);
}

interface Layer {
  canvas: HTMLCanvasElement;
  width: number;
  factor: number;
}

export class Renderer {
  private readonly ctx: Ctx;
  private layers: Layer[] = [];
  private scale = 1;
  private reducedMotion = false;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D is unavailable.");
    this.ctx = ctx;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  /** Matches the backing store to the element's CSS size; rebuilds cached layers when needed. */
  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void {
    const size = canvasSize(cssWidth, cssHeight, devicePixelRatio);
    if (this.canvas.width !== size.width || this.canvas.height !== size.height) {
      this.canvas.width = size.width;
      this.canvas.height = size.height;
    }
    const scale = size.width / WORLD_WIDTH;
    if (Math.abs(scale - this.scale) > 0.001 || !this.layers.length) {
      this.scale = scale;
      this.layers = [
        this.cache(1280, 0.12, farSkyline),
        this.cache(1240, 0.4, midground),
      ];
    }
  }

  private cache(width: number, factor: number, draw: (ctx: Ctx, width: number) => void): Layer {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * this.scale);
    canvas.height = Math.ceil(GROUND_Y * this.scale);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(this.scale, this.scale);
      draw(ctx, width);
    }
    return { canvas, width, factor };
  }

  private sky(): void {
    const ctx = this.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, "#f9f1e4");
    sky.addColorStop(0.55, "#f5dfbc");
    sky.addColorStop(1, "#ebc490");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    const sun = ctx.createRadialGradient(700, 300, 10, 700, 300, 220);
    sun.addColorStop(0, "#fff7e2");
    sun.addColorStop(0.25, "#ffe8b8aa");
    sun.addColorStop(1, "#ffe8b800");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
  }

  private parallax(scroll: number): void {
    for (const layer of this.layers) {
      const offset = (scroll * layer.factor) % layer.width;
      for (const x of [-offset, layer.width - offset])
        if (x < WORLD_WIDTH && x + layer.width > 0)
          this.ctx.drawImage(layer.canvas, x, 0, layer.width, GROUND_Y);
    }
  }

  private road(scroll: number): void {
    const ctx = this.ctx;
    // Paving joints on the plaza edge.
    ctx.strokeStyle = "#cdb593";
    ctx.lineWidth = 1;
    const joint = 64;
    const start = -(scroll % joint);
    ctx.beginPath();
    for (let x = start; x < WORLD_WIDTH; x += joint) {
      ctx.moveTo(x, 404);
      ctx.lineTo(x - 18, GROUND_Y);
    }
    ctx.stroke();
    // Passing lamp-post shadows.
    ctx.fillStyle = "#6b553d1f";
    const band = 410;
    for (let x = -((scroll * 1) % band); x < WORLD_WIDTH; x += band) {
      ctx.beginPath();
      ctx.moveTo(x + 40, 404);
      ctx.lineTo(x + 52, 404);
      ctx.lineTo(x + 10, GROUND_Y);
      ctx.lineTo(x - 6, GROUND_Y);
      ctx.fill();
    }
    // Kerb and street.
    ctx.fillStyle = "#f2e5cf";
    ctx.fillRect(0, GROUND_Y - 4, WORLD_WIDTH, 4);
    const street = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT);
    street.addColorStop(0, "#3a332d");
    street.addColorStop(1, "#211d1a");
    ctx.fillStyle = street;
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = "#5a4d40";
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 3);
    ctx.fillStyle = "#e3b25ccc";
    const dash = 90;
    for (let x = -(scroll % dash); x < WORLD_WIDTH; x += dash) ctx.fillRect(x, 500, 46, 4);
  }

  /**
   * Draws one frame. `alpha` (0…1) interpolates between the last two simulation steps so
   * motion stays smooth on any refresh rate.
   */
  render(game: Game, alpha: number): void {
    const ctx = this.ctx;
    const lerp = (a: number, b: number): number => a + (b - a) * alpha;
    const scroll = lerp(game.previousScroll, game.scroll);
    const height = lerp(game.player.previousY, game.player.y);
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);

    const crashed = game.status === "GAME_OVER" && game.tie !== null;
    if (crashed && !this.reducedMotion && game.crashTime < 0.35) {
      const strength = (0.35 - game.crashTime) * 22;
      ctx.translate(Math.sin(game.crashTime * 90) * strength, Math.cos(game.crashTime * 70) * strength * 0.5);
    }

    this.sky();
    this.parallax(scroll);
    this.road(scroll);

    for (const candle of game.candles)
      drawCandle(ctx, candle, lerp(candle.previousX, candle.x), game.time);

    const player = game.player;
    const pose: DuoPose = {
      phase: (scroll / STRIDE) * Math.PI * 2,
      time: game.time + (crashed ? game.crashTime : 0),
      air: player.grounded ? 0 : Math.min(1, height / 40 + 0.4),
      rise: player.grounded ? 0 : Math.max(-1, Math.min(1, player.vy / JUMP_VELOCITY)),
      crouch: player.anticipation > 0 ? 1 - player.anticipation / JUMP_ANTICIPATION : 0,
      landing: player.landing,
      crash: crashed ? game.crashTime : null,
      tieGone: crashed,
    };
    drawDuo(ctx, PLAYER_X, height, pose);

    if (crashed && game.tie) {
      ctx.save();
      ctx.translate(PLAYER_X + 96 + game.tie.x, GROUND_Y - height - 154 + game.tie.y);
      ctx.rotate(game.tie.spin);
      drawTie(ctx, 0, 0, { ...pose, air: 0 }, 0);
      ctx.restore();
    }

    for (const particle of game.particles) {
      const t = particle.age / particle.life;
      if (particle.kind === "dust") {
        ctx.fillStyle = `rgba(214, 190, 156, ${0.55 * (1 - t)})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (0.6 + t), 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.kind === "spark") {
        ctx.fillStyle = t < 0.5 ? palette.gold : "#5fd08c";
        ctx.globalAlpha = 1 - t;
        ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
        ctx.globalAlpha = 1;
      } else if (particle.kind === "debris") {
        ctx.fillStyle = `rgba(196, 49, 42, ${1 - t})`;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size * 1.6);
      } else {
        ctx.globalAlpha = Math.min(1, (1 - t) * 2);
        ctx.font = `${30 + 6 * Math.sin(Math.min(1, t * 4) * Math.PI)}px Anton, Impact, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#fffaf0";
        ctx.strokeText("+1", particle.x, particle.y);
        ctx.fillStyle = palette.green;
        ctx.fillText("+1", particle.x, particle.y);
        ctx.globalAlpha = 1;
      }
    }

    if (crashed && game.crashTime < 0.25) {
      ctx.fillStyle = `rgba(196, 49, 42, ${0.22 * (1 - game.crashTime / 0.25)})`;
      ctx.fillRect(-40, -40, WORLD_WIDTH + 80, WORLD_HEIGHT + 80);
    }
  }
}
