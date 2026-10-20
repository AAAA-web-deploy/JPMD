import { MAX_FRAME_SECONDS, STEP_SECONDS } from "../game/constants.ts";
import { createGame, jump, pause, resume, retry, start, step } from "../game/engine.ts";
import { Renderer } from "../game/renderer.ts";
import { deviceStorage, loadBest, saveBest } from "../game/storage.ts";
import type { Game, GameStatus } from "../game/types.ts";

const pauseIcon = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>`;
const soundOffIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="m16 9 5 6m0-6-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const soundOnIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

/** Section markup; prerendered, so it must not touch the DOM. */
export function renderBullRun(): string {
  return `<section id="bull-run" class="bull-run" aria-labelledby="bull-run-title"><span id="studio" class="anchor-alias" aria-hidden="true"></span><span id="shiba-studio" class="anchor-alias" aria-hidden="true"></span><div class="bull-run-intro"><p class="eyebrow block">THE WALL STREET ARCADE</p><h2 id="bull-run-title">BULL RUN <span>RIDE THE RED!</span></h2><p>Shiba and his bull are late for the closing bell. Unfortunately, the market keeps throwing red candles in their way.</p></div><div class="bull-run-arcade" data-bull-run data-state="READY"><div class="bull-run-frame"><div class="bull-run-topbar"><p class="bull-run-wordmark" aria-hidden="true">BULL RUN<small>RIDE THE RED!</small></p><div class="bull-run-hud"><p><span>SCORE</span><output data-score aria-label="Score">0</output></p><p><span>BEST</span><output data-best aria-label="Best score">0</output></p><button type="button" class="bull-run-icon-button" data-action="pause" aria-label="Pause" hidden>${pauseIcon}</button></div></div><div class="bull-run-screen"><div class="bull-run-stage" data-stage tabindex="0" role="group" aria-roledescription="game" aria-label="Bull Run game area" aria-describedby="bull-run-help"><canvas data-canvas aria-hidden="true"></canvas></div><button type="button" class="bull-run-jump" data-action="jump" tabindex="-1">JUMP</button><div class="bull-run-overlay bull-run-ready is-visible" data-overlay="READY"><p class="bull-run-kicker">ONE SHIBA. ONE BULL.</p><p class="bull-run-joke">Wall Street said red candles were dangerous. Shiba bought a helmet. His bull bought running shoes.</p><p class="bull-run-sub">One Shiba. One Bull. Too many red candles. Jump them all!</p><button type="button" class="bull-run-primary" data-action="start">START RUNNING</button><p class="bull-run-hint">SPACE / TAP TO JUMP</p><p class="bull-run-nojs">Enable JavaScript to play.</p></div><div class="bull-run-overlay bull-run-paused" data-overlay="PAUSED" inert><p class="bull-run-title">PAUSED — THE MARKET CAN WAIT.</p><div class="bull-run-buttons"><button type="button" class="bull-run-primary" data-action="resume">RESUME</button><button type="button" class="bull-run-secondary" data-action="restart">RESTART</button></div></div><div class="bull-run-overlay bull-run-over" data-overlay="GAME_OVER" inert><p class="bull-run-title">MARKET CORRECTION!</p><p class="bull-run-sub">The bull was confident. The candle disagreed.</p><dl class="bull-run-results"><div><dt>FINAL SCORE</dt><dd data-final>0</dd></div><div><dt>BEST SCORE</dt><dd data-final-best>0</dd></div></dl><p class="bull-run-record" data-record hidden>NEW RECORD!</p><button type="button" class="bull-run-primary" data-action="retry">TRY AGAIN</button></div></div><p class="bull-run-keys" aria-hidden="true"><kbd>SPACE</kbd> / <kbd>↑</kbd> jump · <kbd>P</kbd> pause · <kbd>R</kbd> retry</p></div><div class="bull-run-below"><button type="button" class="bull-run-primary" data-action="main">START RUNNING</button><button type="button" class="bull-run-secondary bull-run-sound" data-action="sound" aria-pressed="false">${soundOffIcon}<span>SOUND OFF</span></button><p class="bull-run-guide" id="bull-run-help">Shiba rides his bull toward the closing bell while red candlesticks roll in from the right. Press Space or Arrow Up, tap the game, or use the Jump button to leap over each candle. Every candle cleared scores one point. P or Escape pauses; R tries again after a crash.</p><p class="bull-run-quip">No candles were harmed. Several egos were.</p><p class="bull-run-saved" data-saved>Best score saved on this device.</p></div><p class="sr-only" role="status" aria-live="polite" data-announcer></p></div></section>`;
}

/** Tiny locally generated sound effects. Silent until the visitor turns sound on. */
class Sound {
  private context: AudioContext | null = null;
  on = false;

  toggle(): boolean {
    this.on = !this.on;
    if (this.on && !this.context) {
      const Context =
        globalThis.AudioContext ??
        (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Context) this.context = new Context();
    }
    if (this.on) void this.context?.resume();
    return this.on;
  }

  play(kind: "jump" | "score" | "crash"): void {
    const context = this.context;
    if (!this.on || !context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const shape = {
      jump: { type: "triangle", from: 300, to: 620, length: 0.16, volume: 0.12 },
      score: { type: "sine", from: 880, to: 1320, length: 0.14, volume: 0.1 },
      crash: { type: "sawtooth", from: 180, to: 55, length: 0.45, volume: 0.14 },
    }[kind];
    oscillator.type = shape.type as OscillatorType;
    oscillator.frequency.setValueAtTime(shape.from, now);
    oscillator.frequency.exponentialRampToValueAtTime(shape.to, now + shape.length);
    gain.gain.setValueAtTime(shape.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + shape.length);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + shape.length + 0.02);
  }

  dispose(): void {
    void this.context?.close();
    this.context = null;
  }
}

export interface BullRunOptions {
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  random?: () => number;
  game?: Game;
}

/** Delay between the crash and the result panel, so the crash reaction can play. */
const RESULT_DELAY_MS = 650;

function editable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

export function initBullRun(options: BullRunOptions = {}): () => void {
  const found = document.querySelector<HTMLElement>("[data-bull-run]");
  if (!found) return () => {};
  const root: HTMLElement = found;
  const stage = root.querySelector<HTMLElement>("[data-stage]")!;
  const canvas = root.querySelector<HTMLCanvasElement>("[data-canvas]")!;
  const scoreOut = root.querySelector<HTMLOutputElement>("[data-score]")!;
  const bestOut = root.querySelector<HTMLOutputElement>("[data-best]")!;
  const announcer = root.querySelector<HTMLElement>("[data-announcer]")!;
  const saved = root.querySelector<HTMLElement>("[data-saved]")!;
  const record = root.querySelector<HTMLElement>("[data-record]")!;
  const finalOut = root.querySelector<HTMLElement>("[data-final]")!;
  const finalBestOut = root.querySelector<HTMLElement>("[data-final-best]")!;
  const mainButton = root.querySelector<HTMLButtonElement>('[data-action="main"]')!;
  const pauseButton = root.querySelector<HTMLButtonElement>('[data-action="pause"]')!;
  const soundButton = root.querySelector<HTMLButtonElement>('[data-action="sound"]')!;
  const jumpButton = root.querySelector<HTMLButtonElement>('[data-action="jump"]')!;
  const overlays = [...root.querySelectorAll<HTMLElement>("[data-overlay]")];
  const requestFrame = options.requestFrame ?? ((callback) => requestAnimationFrame(callback));
  const cancelFrame = options.cancelFrame ?? ((handle) => cancelAnimationFrame(handle));
  const storage = options.storage === undefined ? deviceStorage() : options.storage;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const signal = controller.signal;
  const game: Game = options.game ?? createGame(options.random);
  const sound = new Sound();

  let renderer: Renderer | null = null;
  try {
    renderer = new Renderer(canvas);
    renderer.setReducedMotion(reduced.matches);
  } catch {
    renderer = null;
  }
  let best = loadBest(storage);
  let bestAtStart = best;
  let shownScore = -1;
  let shownBest = -1;
  let handle = 0;
  let last = -1;
  let accumulator = 0;
  let onScreen = false;
  let resultTimer: ReturnType<typeof setTimeout> | undefined;
  let resultShown = false;
  saved.textContent = storage
    ? "Best score saved on this device."
    : "Best score is kept for this visit only (this browser blocks saving).";

  function announce(message: string): void {
    announcer.textContent = message;
  }

  function hud(): void {
    if (game.score !== shownScore) scoreOut.value = String((shownScore = game.score));
    const liveBest = Math.max(best, game.score);
    if (liveBest !== shownBest) bestOut.value = String((shownBest = liveBest));
  }

  function showOverlays(): void {
    const status: GameStatus = game.status;
    root.dataset.state = status;
    for (const overlay of overlays) {
      const visible =
        overlay.dataset.overlay === status && (status !== "GAME_OVER" || resultShown);
      overlay.classList.toggle("is-visible", visible);
      overlay.inert = !visible;
    }
    pauseButton.hidden = status !== "RUNNING";
    const labels: Record<GameStatus, string> = {
      READY: "START RUNNING",
      RUNNING: "PAUSE",
      PAUSED: "RESUME",
      GAME_OVER: "TRY AGAIN",
    };
    mainButton.textContent = labels[status];
    mainButton.disabled = status === "GAME_OVER" && !resultShown;
  }

  function draw(alpha = 1): void {
    renderer?.render(game, alpha);
  }

  function wantsLoop(): boolean {
    if (!onScreen || document.hidden) return false;
    if (game.status === "PAUSED") return false;
    if (game.status === "READY" && reduced.matches) return false;
    if (game.status === "GAME_OVER" && game.crashTime > 2.5) return false;
    return true;
  }

  function frame(now: number): void {
    handle = 0;
    const elapsed = last < 0 ? 0 : Math.min(MAX_FRAME_SECONDS, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP_SECONDS) {
      step(game, STEP_SECONDS);
      accumulator -= STEP_SECONDS;
    }
    drain();
    hud();
    draw(accumulator / STEP_SECONDS);
    schedule();
  }

  function schedule(): void {
    if (handle || !wantsLoop()) {
      if (!handle) last = -1;
      return;
    }
    handle = requestFrame(frame);
  }

  function stopLoop(): void {
    if (handle) cancelFrame(handle);
    handle = 0;
    last = -1;
    accumulator = 0;
  }

  function drain(): void {
    for (const event of game.events.splice(0)) {
      if (event.type === "jump") sound.play("jump");
      if (event.type === "score") {
        sound.play("score");
        if (event.score > best) {
          best = event.score;
          saveBest(storage, best);
        }
      }
      if (event.type === "crash") {
        sound.play("crash");
        const score = event.score;
        const newRecord = score > bestAtStart;
        best = Math.max(best, score);
        finalOut.textContent = String(score);
        finalBestOut.textContent = String(best);
        record.hidden = !newRecord;
        clearTimeout(resultTimer);
        resultShown = false;
        resultTimer = setTimeout(() => {
          resultShown = true;
          showOverlays();
        }, reduced.matches ? 0 : RESULT_DELAY_MS);
        announce(
          `Market correction! Final score ${score}. Best score ${best}.${newRecord ? " New record!" : ""} Press R or Try again to play again.`,
        );
      }
    }
    showOverlays();
  }

  function begin(fresh: boolean): void {
    const ok = fresh ? retry(game) : start(game);
    if (!ok) return;
    clearTimeout(resultTimer);
    resultShown = false;
    bestAtStart = best;
    accumulator = 0;
    stage.focus({ preventScroll: true });
    announce("Run started. Jump the red candles.");
    drain();
    hud();
    schedule();
  }

  function doPause(): void {
    if (!pause(game)) return;
    drain();
    stopLoop();
    draw();
    announce("Paused. The market can wait.");
  }

  function doResume(): void {
    if (!resume(game)) return;
    drain();
    stage.focus({ preventScroll: true });
    announce("Resumed.");
    schedule();
  }

  function doJump(): void {
    if (game.status === "RUNNING") jump(game);
  }

  function act(action: string | undefined): void {
    switch (action) {
      case "start":
        begin(false);
        break;
      case "retry":
      case "restart":
        begin(true);
        break;
      case "resume":
        doResume();
        break;
      case "pause":
        doPause();
        break;
      case "jump":
        doJump();
        break;
      case "main":
        if (game.status === "READY") begin(false);
        else if (game.status === "RUNNING") doPause();
        else if (game.status === "PAUSED") doResume();
        else if (resultShown) begin(true);
        break;
      case "sound": {
        const on = sound.toggle();
        soundButton.setAttribute("aria-pressed", String(on));
        soundButton.innerHTML = `${on ? soundOnIcon : soundOffIcon}<span>${on ? "SOUND ON" : "SOUND OFF"}</span>`;
        break;
      }
    }
  }

  root.addEventListener(
    "click",
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>("button[data-action]")
          : null;
      if (!button || button.disabled) {
        // A click (not a scroll gesture) on the idle stage starts the run.
        if (game.status === "READY" && event.target instanceof Element && stage.contains(event.target))
          begin(false);
        return;
      }
      // The jump button reacts on pointerdown; only keyboard-generated clicks act here.
      if (button.dataset.action === "jump" && event.detail !== 0) return;
      act(button.dataset.action);
    },
    { signal },
  );
  const onPress = (event: PointerEvent) => {
    if (game.status !== "RUNNING") return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    doJump();
  };
  stage.addEventListener("pointerdown", onPress, { signal });
  jumpButton.addEventListener("pointerdown", onPress, { signal });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (editable(event.target) || document.querySelector("dialog[open]")) return;
      const target = event.target instanceof Element ? event.target : null;
      const inGame = !!target && root.contains(target);
      const onControl = !!target?.closest("button, a, summary, [role='button']");
      // Outside the game only act while it is running and on screen, and never steal
      // Space from another focused control.
      const engaged = inGame || (onScreen && game.status !== "READY" && !onControl);
      if (!engaged) return;
      const key = event.key;
      if (key === " " || key === "Spacebar" || key === "ArrowUp") {
        if (inGame && onControl && game.status !== "RUNNING") return;
        if (game.status === "RUNNING") {
          event.preventDefault();
          if (!event.repeat) doJump();
        } else if (game.status === "READY" && inGame) {
          event.preventDefault();
          begin(false);
        } else if (inGame) event.preventDefault();
      } else if (key === "r" || key === "R") {
        if (game.status === "GAME_OVER" || game.status === "PAUSED") {
          event.preventDefault();
          begin(true);
        }
      } else if (key === "p" || key === "P" || key === "Escape") {
        if (game.status === "RUNNING") {
          event.preventDefault();
          doPause();
        } else if (game.status === "PAUSED") {
          event.preventDefault();
          doResume();
        }
      }
    },
    { signal },
  );

  function autoPause(): void {
    if (game.status === "RUNNING") doPause();
  }
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        autoPause();
        stopLoop();
      } else schedule();
    },
    { signal },
  );
  window.addEventListener("pagehide", autoPause, { signal });
  reduced.addEventListener(
    "change",
    () => {
      renderer?.setReducedMotion(reduced.matches);
      schedule();
    },
    { signal },
  );

  function resize(): void {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer?.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    draw();
  }
  const resizeObserver =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  resizeObserver?.observe(stage);
  window.addEventListener("resize", resize, { signal });

  const intersection =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1]!;
            onScreen = entry.isIntersecting && entry.intersectionRatio >= 0.2;
            if (!onScreen) {
              autoPause();
              stopLoop();
            } else schedule();
          },
          { threshold: [0, 0.2, 0.5] },
        );
  if (intersection) intersection.observe(stage);
  else onScreen = true;

  hud();
  showOverlays();
  resize();
  schedule();

  return () => {
    controller.abort();
    stopLoop();
    clearTimeout(resultTimer);
    resizeObserver?.disconnect();
    intersection?.disconnect();
    sound.dispose();
  };
}
