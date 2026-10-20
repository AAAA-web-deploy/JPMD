import test from "node:test";
import assert from "node:assert/strict";
import { heroReplayDelayMs, initHero, renderHero } from "../src/components/hero.ts";
import { installDom } from "./dom.ts";

interface FakeMedia {
  video: HTMLVideoElement;
  frame: HTMLElement;
  resets: number;
  plays: number;
  reject: boolean;
  /** Resolves play() later instead of immediately. */
  deferred: (() => void)[] | null;
  readyState: number;
  setVisible(visible: boolean): void;
  setHidden(hidden: boolean): void;
  /** Plays the clip to its last frame. */
  end(): void;
}

function fakeMedia(): FakeMedia {
  const video = document.querySelector<HTMLVideoElement>("[data-hero-video]")!;
  let paused = true;
  let time = 0;
  let hidden = false;
  let observed: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
  const state: FakeMedia = {
    video,
    frame: document.querySelector<HTMLElement>("[data-hero-frame]")!,
    resets: 0,
    plays: 0,
    reject: false,
    deferred: null,
    readyState: 4,
    setVisible: (visible) => observed?.([{ isIntersecting: visible }]),
    setHidden(value) {
      hidden = value;
      document.dispatchEvent(new Event("visibilitychange"));
    },
    end() {
      assert.equal(paused, false, "Only a playing clip can end.");
      time = 5;
      paused = true;
      video.dispatchEvent(new Event("ended"));
    },
  };
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  Object.defineProperty(video, "paused", { get: () => paused });
  Object.defineProperty(video, "error", { get: () => null });
  Object.defineProperty(video, "readyState", { get: () => state.readyState });
  Object.defineProperty(video, "currentTime", {
    get: () => time,
    set(value: number) {
      if (value === 0) state.resets++;
      time = value;
    },
  });
  video.play = () => {
    state.plays++;
    if (state.reject)
      return Promise.reject(new DOMException("Blocked", "NotAllowedError"));
    const start = () => {
      paused = false;
      video.dispatchEvent(new Event("playing"));
    };
    if (state.deferred) {
      return new Promise<void>((resolve) =>
        state.deferred!.push(() => {
          start();
          resolve();
        }),
      );
    }
    start();
    return Promise.resolve();
  };
  video.pause = () => {
    paused = true;
  };
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: class {
      constructor(callback: typeof observed) {
        observed = callback;
      }
      observe() {}
      disconnect() {
        observed = null;
      }
    },
  });
  return state;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("hero clip plays from 0, waits 4 s after each play-through, and restarts on return", async (t) => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const media = fakeMedia();
    const dispose = initHero();
    assert.equal(heroReplayDelayMs, 4000);
    assert.ok(media.video.muted && media.video.autoplay);
    assert.equal(media.video.loop, false, "Replays are scheduled, not looped.");
    assert.equal(media.frame.querySelector("button"), null, "No play/pause control.");
    media.setVisible(true);
    assert.equal(media.video.paused, false);
    assert.equal(media.resets, 1, "First entry starts from the beginning.");
    assert.equal(media.video.playbackRate, 1);
    assert.ok(media.frame.classList.contains("is-playing"));

    media.setVisible(true);
    assert.equal(media.resets, 1, "Repeated visibility callbacks do not reset.");

    for (let cycle = 2; cycle <= 4; cycle++) {
      media.end();
      t.mock.timers.tick(heroReplayDelayMs - 1);
      assert.equal(media.video.paused, true, "Waits after the clip finishes.");
      assert.equal(media.resets, cycle - 1);
      t.mock.timers.tick(1);
      assert.equal(media.resets, cycle, "Plays again from 0 after 4 s.");
      assert.equal(media.video.paused, false);
    }

    media.end();
    media.setVisible(false);
    t.mock.timers.tick(heroReplayDelayMs * 2);
    assert.equal(media.resets, 4, "Leaving cancels the pending replay.");
    assert.equal(media.video.paused, true);
    media.setVisible(true);
    assert.equal(media.resets, 5, "Returning restarts once from 0 immediately.");
    assert.equal(media.video.paused, false);

    media.setHidden(true);
    assert.equal(media.video.paused, true, "A hidden tab pauses.");
    media.setHidden(false);
    assert.equal(media.resets, 6);

    window.dispatchEvent(new window.Event("pagehide"));
    assert.equal(media.video.paused, true);
    window.dispatchEvent(new window.Event("pageshow"));
    assert.equal(media.resets, 7, "Back/forward cache restore restarts.");

    media.end();
    dispose();
    t.mock.timers.tick(heroReplayDelayMs);
    media.setHidden(true);
    media.setHidden(false);
    window.dispatchEvent(new window.Event("pageshow"));
    assert.equal(media.resets, 7, "No timers or listeners remain after teardown.");
  } finally {
    t.mock.timers.reset();
    await window.happyDOM.close();
  }
});

test("a late play() promise cannot restart a hero the visitor has left", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    media.deferred = [];
    const dispose = initHero();
    media.setVisible(true);
    media.setVisible(false);
    media.deferred.forEach((resolve) => resolve());
    await flush();
    assert.equal(media.video.paused, true);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});

test("seeking waits for metadata, once, even across repeated entries", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    media.readyState = 0;
    const dispose = initHero();
    media.setVisible(true);
    media.setVisible(false);
    media.setVisible(true);
    assert.equal(media.resets, 0);
    media.readyState = 1;
    media.video.dispatchEvent(new Event("loadedmetadata"));
    assert.equal(media.resets, 1);
    assert.equal(media.plays, 1);
    assert.equal(media.video.paused, false);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});

test("reduced motion keeps the still poster", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`, true);
  try {
    const media = fakeMedia();
    const dispose = initHero();
    media.setVisible(true);
    assert.equal(media.plays, 0);
    assert.equal(media.frame.classList.contains("is-playing"), false);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});

test("blocked autoplay keeps the still until the first interaction; a missing source falls back", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    media.reject = true;
    const dispose = initHero();
    media.setVisible(true);
    await flush();
    media.setVisible(false);
    media.setVisible(true);
    await flush();
    assert.equal(media.frame.classList.contains("is-playing"), false);

    media.reject = false;
    const plays = media.plays;
    document.dispatchEvent(new Event("pointerdown"));
    document.dispatchEvent(new Event("keydown"));
    assert.equal(media.plays, plays + 1, "One retry per interaction, not one per refusal.");
    assert.ok(media.frame.classList.contains("is-playing"));
    assert.equal(media.video.currentTime, 0);

    media.video.querySelector("source")!.dispatchEvent(new Event("error"));
    assert.equal(media.frame.classList.contains("is-playing"), false);
    assert.equal(media.video.paused, true);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});
