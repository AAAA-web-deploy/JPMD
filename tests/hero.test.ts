import test from "node:test";
import assert from "node:assert/strict";
import { initHero, renderHero } from "../src/components/hero.ts";
import { installDom } from "./dom.ts";

interface FakeMedia {
  video: HTMLVideoElement;
  frame: HTMLElement;
  toggle: HTMLButtonElement;
  resets: number;
  plays: number;
  reject: boolean;
  /** Resolves play() later instead of immediately. */
  deferred: (() => void)[] | null;
  readyState: number;
  setVisible(visible: boolean): void;
  setHidden(hidden: boolean): void;
  advance(seconds: number): void;
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
    toggle: document.querySelector<HTMLButtonElement>("[data-hero-toggle]")!,
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
    advance(seconds) {
      if (!paused) time = (time + seconds) % 5;
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

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("hero clip starts at 0, loops natively, and restarts only when the hero is re-entered", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    const dispose = initHero();
    assert.ok(media.video.loop && media.video.muted && media.video.autoplay);
    media.setVisible(true);
    assert.equal(media.video.paused, false);
    assert.equal(media.resets, 1, "First entry starts from the beginning.");
    assert.equal(media.video.playbackRate, 1);
    assert.ok(media.frame.classList.contains("is-playing"));

    media.advance(3.2);
    media.setVisible(true);
    media.setVisible(true);
    assert.equal(media.resets, 1, "Repeated visibility callbacks do not reset.");
    assert.equal(media.video.currentTime.toFixed(1), "3.2");

    media.setVisible(false);
    assert.equal(media.video.paused, true, "Leaving the hero pauses.");
    media.setVisible(false);
    media.setVisible(true);
    assert.equal(media.resets, 2, "Returning restarts once from 0.");
    assert.equal(media.video.currentTime, 0);
    assert.equal(media.video.paused, false);

    media.advance(2);
    media.setHidden(true);
    assert.equal(media.video.paused, true, "A hidden tab pauses.");
    media.setHidden(false);
    assert.equal(media.resets, 3);
    assert.equal(media.video.paused, false);

    window.dispatchEvent(new window.Event("pagehide"));
    assert.equal(media.video.paused, true);
    window.dispatchEvent(new window.Event("pageshow"));
    assert.equal(media.resets, 4, "Back/forward cache restore restarts.");
    assert.equal(media.video.paused, false);

    dispose();
    media.setHidden(true);
    media.setHidden(false);
    window.dispatchEvent(new window.Event("pageshow"));
    assert.equal(media.resets, 4, "No listeners remain after teardown.");
  } finally {
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
    await tick();
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

test("a manual pause and reduced motion keep the clip stopped on return", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    const dispose = initHero();
    media.setVisible(true);
    media.toggle.click();
    assert.equal(media.video.paused, true);
    assert.equal(media.toggle.getAttribute("aria-label"), "Play the Shiba movie");
    media.setVisible(false);
    media.setVisible(true);
    assert.equal(media.video.paused, true, "A manual pause is respected.");
    media.toggle.click();
    assert.equal(media.video.paused, false);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
  const reduced = installDom(`<div id="app">${renderHero()}</div>`, true);
  try {
    const media = fakeMedia();
    const dispose = initHero();
    media.setVisible(true);
    assert.equal(media.plays, 0);
    assert.equal(media.frame.classList.contains("is-playing"), false);
    assert.equal(media.toggle.getAttribute("aria-label"), "Play the Shiba movie");
    media.toggle.click();
    assert.equal(media.video.paused, false);
    dispose();
  } finally {
    await reduced.happyDOM.close();
  }
});

test("blocked autoplay keeps the still and offers Play; a missing source hides the control", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    media.reject = true;
    const dispose = initHero();
    media.setVisible(true);
    await tick();
    assert.equal(media.frame.classList.contains("is-playing"), false);
    assert.equal(media.toggle.getAttribute("aria-label"), "Play the Shiba movie");

    media.reject = false;
    media.toggle.click();
    assert.ok(media.frame.classList.contains("is-playing"));
    assert.equal(media.video.currentTime, 0);
    media.video.querySelector("source")!.dispatchEvent(new Event("error"));
    assert.equal(media.frame.classList.contains("is-playing"), false);
    assert.equal(media.toggle.hidden, true);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});
