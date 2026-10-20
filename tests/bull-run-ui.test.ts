import test from "node:test";
import assert from "node:assert/strict";
import { initBullRun, renderBullRun } from "../src/components/bullRun.ts";
import { STORAGE_KEY } from "../src/game/constants.ts";
import { createGame } from "../src/game/engine.ts";
import { canvasSize } from "../src/game/renderer.ts";
import type { Game } from "../src/game/types.ts";
import { installDom } from "./dom.ts";

type Observed = (entries: { isIntersecting: boolean; intersectionRatio: number }[]) => void;

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

interface Harness {
  game: Game;
  dispose: () => void;
  pending: () => number;
  frames: (count: number) => void;
  until: (done: () => boolean, limit?: number) => void;
  setVisible: (visible: boolean) => void;
  setHidden: (hidden: boolean) => void;
  q: <T extends Element = HTMLElement>(selector: string) => T;
  key: (key: string, target?: EventTarget) => KeyboardEvent;
}

function mount(storage: ReturnType<typeof memoryStorage> | null, reduced = false) {
  const window = installDom(`<main>${renderBullRun()}</main><input id="outside">`, reduced);
  let observed: Observed | null = null;
  let hidden = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: class {
      constructor(callback: Observed) {
        observed = callback;
      }
      observe() {}
      disconnect() {
        observed = null;
      }
    },
  });
  const queue = new Map<number, FrameRequestCallback>();
  let nextHandle = 1;
  let now = 0;
  const game = createGame(seeded(7));
  const dispose = initBullRun({
    game,
    storage,
    requestFrame: (callback) => {
      queue.set(nextHandle, callback);
      return nextHandle++;
    },
    cancelFrame: (handle) => void queue.delete(handle),
  });
  const harness: Harness = {
    game,
    dispose,
    pending: () => queue.size,
    frames(count) {
      for (let i = 0; i < count && queue.size; i++) {
        const [handle, callback] = queue.entries().next().value!;
        queue.delete(handle);
        now += 1000 / 60;
        callback(now);
      }
    },
    until(done, limit = 3000) {
      for (let i = 0; i < limit && !done(); i++) harness.frames(1);
    },
    setVisible: (visible) =>
      observed?.([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]),
    setHidden(value) {
      hidden = value;
      document.dispatchEvent(new Event("visibilitychange"));
    },
    q: <T extends Element>(selector: string) => document.querySelector<T>(selector)!,
    key(key, target = document.querySelector("[data-stage]")!) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event;
    },
  };
  return { window, harness };
}

const visibleOverlay = () =>
  [...document.querySelectorAll<HTMLElement>("[data-overlay].is-visible")].map(
    (overlay) => overlay.dataset.overlay,
  );

test("section copy, aliases, and accessible controls render without the old editor", async () => {
  const { window, harness } = mount(memoryStorage());
  try {
    const section = harness.q("#bull-run");
    assert.match(section.textContent!, /THE WALL STREET ARCADE/);
    assert.match(section.textContent!, /BULL RUN\s*RIDE THE RED!/);
    assert.match(section.textContent!, /late for the closing bell/);
    assert.match(section.textContent!, /Shiba bought a helmet\. His bull bought running shoes\./);
    assert.match(section.textContent!, /SPACE \/ TAP TO JUMP/);
    assert.ok(section.querySelector("#studio") && section.querySelector("#shiba-studio"));
    assert.equal(document.querySelectorAll('input[type="file"], [data-studio]').length, 0);
    assert.equal(harness.q("[data-stage]").getAttribute("tabindex"), "0");
    assert.ok(harness.q("[data-announcer]").getAttribute("aria-live"));
    for (const button of document.querySelectorAll("button"))
      assert.ok(
        button.textContent!.trim() || button.getAttribute("aria-label"),
        "Every button has an accessible name.",
      );
  } finally {
    harness.dispose();
    await window.happyDOM.close();
  }
});

test("READY → RUNNING by keyboard; taps and the jump button jump; P pauses and resumes", async () => {
  const { window, harness } = mount(memoryStorage());
  try {
    harness.setVisible(true);
    assert.deepEqual(visibleOverlay(), ["READY"]);
    assert.equal(harness.q("[data-overlay=PAUSED]").inert, true);
    assert.equal(harness.q<HTMLButtonElement>("[data-action=pause]").hidden, true);

    assert.equal(harness.key(" ").defaultPrevented, true, "Space never scrolls the page here.");
    assert.equal(harness.game.status, "RUNNING");
    assert.equal(harness.q("[data-bull-run]").dataset.state, "RUNNING");
    assert.deepEqual(visibleOverlay(), []);
    assert.equal(harness.q<HTMLButtonElement>("[data-action=pause]").hidden, false);
    assert.equal(harness.q("[data-action=main]").textContent, "PAUSE");

    harness.frames(30);
    const tap = (target: Element) =>
      target.dispatchEvent(
        new window.PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          pointerType: "touch",
        }) as unknown as Event,
      );
    tap(harness.q("[data-stage]"));
    assert.ok(harness.game.player.anticipation > 0, "A tap starts the jump crouch.");
    harness.until(() => harness.game.player.grounded && harness.game.player.anticipation <= 0);
    assert.ok(harness.game.status === "RUNNING");

    tap(harness.q("[data-action=jump]"));
    assert.ok(harness.game.player.anticipation > 0, "The JUMP button jumps.");
    harness.frames(2);
    const repeat = new KeyboardEvent("keydown", { key: "ArrowUp", repeat: true, bubbles: true });
    const vy = harness.game.player.vy;
    harness.q("[data-stage]").dispatchEvent(repeat);
    assert.equal(harness.game.player.vy, vy, "Held keys do not re-trigger jumps.");

    harness.key("p");
    assert.equal(harness.game.status, "PAUSED");
    assert.deepEqual(visibleOverlay(), ["PAUSED"]);
    assert.equal(harness.pending(), 0, "No frames are scheduled while paused.");
    assert.match(harness.q("[data-overlay=PAUSED]").textContent!, /PAUSED — THE MARKET CAN WAIT\./);
    harness.key("Escape");
    assert.equal(harness.game.status, "RUNNING");
    assert.ok(harness.pending() > 0);
  } finally {
    harness.dispose();
    await window.happyDOM.close();
  }
});

test("crash shows MARKET CORRECTION, saves the best score, and R retries", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const storage = memoryStorage();
  const { window, harness } = mount(storage);
  try {
    harness.setVisible(true);
    harness.q("[data-action=start]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    assert.equal(harness.game.status, "RUNNING");
    harness.until(() => harness.game.score >= 2 || harness.game.status !== "RUNNING", 6000);
    assert.equal(harness.game.status, "GAME_OVER", "Without jumps the first candle ends the run.");
    assert.equal(harness.game.score, 0);
    assert.deepEqual(visibleOverlay(), [], "The crash reaction plays before the panel.");
    assert.equal(harness.q<HTMLButtonElement>("[data-action=main]").disabled, true);
    t.mock.timers.tick(650);
    assert.deepEqual(visibleOverlay(), ["GAME_OVER"]);
    const over = harness.q("[data-overlay=GAME_OVER]");
    assert.match(over.textContent!, /MARKET CORRECTION!/);
    assert.match(over.textContent!, /The bull was confident\. The candle disagreed\./);
    assert.equal(harness.q("[data-final]").textContent, "0");
    assert.equal(harness.q("[data-record]").hidden, true, "Zero is not a record.");
    assert.match(harness.q("[data-announcer]").textContent!, /Market correction! Final score 0/);

    harness.key("r");
    assert.equal(harness.game.status, "RUNNING");
    assert.equal(harness.game.score, 0);
    assert.equal(harness.q("[data-score]").textContent, "0");

    harness.game.score = 4;
    harness.game.events.push({ type: "score", score: 4 });
    harness.frames(1);
    assert.equal(storage.data.get(STORAGE_KEY), "4", "Best is saved as soon as it is beaten.");
    assert.equal(harness.q("[data-best]").textContent, "4");
    harness.until(() => harness.game.status === "GAME_OVER", 6000);
    t.mock.timers.tick(650);
    assert.equal(harness.q("[data-record]").hidden, false, "NEW RECORD!");
    assert.equal(harness.q("[data-final-best]").textContent, String(harness.game.score));
    harness.q("[data-action=retry]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    assert.equal(harness.game.status, "RUNNING");
  } finally {
    harness.dispose();
    await window.happyDOM.close();
  }
});

test("best score survives a reload; blocked storage still plays", async () => {
  const storage = memoryStorage({ [STORAGE_KEY]: "17" });
  let { window, harness } = mount(storage);
  assert.equal(harness.q("[data-best]").textContent, "17");
  assert.match(harness.q("[data-saved]").textContent!, /saved on this device/);
  harness.dispose();
  await window.happyDOM.close();

  ({ window, harness } = mount(null));
  try {
    assert.equal(harness.q("[data-best]").textContent, "0");
    assert.match(harness.q("[data-saved]").textContent!, /this visit only/);
    harness.setVisible(true);
    harness.key(" ");
    assert.equal(harness.game.status, "RUNNING");
  } finally {
    harness.dispose();
    await window.happyDOM.close();
  }
});

test("auto-pauses when hidden or scrolled away; ignores typing; cleans up", async () => {
  const { window, harness } = mount(memoryStorage());
  try {
    assert.equal(harness.pending(), 0, "Nothing runs until the game is on screen.");
    harness.setVisible(true);
    assert.ok(harness.pending() > 0, "The idle scene animates on screen.");
    const outside = harness.q<HTMLInputElement>("#outside");
    assert.equal(harness.key(" ", outside).defaultPrevented, false);
    assert.equal(harness.game.status, "READY", "Typing elsewhere never starts the game.");

    harness.key(" ");
    harness.setHidden(true);
    assert.equal(harness.game.status, "PAUSED");
    assert.equal(harness.pending(), 0);
    harness.setHidden(false);
    assert.equal(harness.game.status, "PAUSED", "Returning does not resume by surprise.");
    harness.key("p");
    assert.equal(harness.game.status, "RUNNING");
    harness.setVisible(false);
    assert.equal(harness.game.status, "PAUSED");
    assert.equal(harness.pending(), 0);

    harness.setVisible(true);
    harness.key("p");
    harness.dispose();
    assert.equal(harness.pending(), 0, "Cleanup cancels the frame loop.");
    harness.key("p");
    assert.equal(harness.game.status, "RUNNING", "Cleanup removes key listeners.");
  } finally {
    await window.happyDOM.close();
  }
});

test("reduced motion keeps the idle scene still and shows results immediately", async () => {
  const { window, harness } = mount(memoryStorage(), true);
  try {
    harness.setVisible(true);
    assert.equal(harness.pending(), 0);
    harness.key(" ");
    harness.until(() => harness.game.status === "GAME_OVER", 6000);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(visibleOverlay(), ["GAME_OVER"]);
  } finally {
    harness.dispose();
    await window.happyDOM.close();
  }
});

test("canvas backing store follows CSS size and caps device pixel ratio at 2", () => {
  assert.deepEqual(canvasSize(480, 270, 1), { width: 480, height: 270, ratio: 1 });
  assert.deepEqual(canvasSize(480, 270, 3), { width: 960, height: 540, ratio: 2 });
  assert.deepEqual(canvasSize(320, 180, 0), { width: 320, height: 180, ratio: 1 });
  assert.deepEqual(canvasSize(0, 0, 2), { width: 1, height: 1, ratio: 2 });
});
