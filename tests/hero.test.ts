import test from "node:test";
import assert from "node:assert/strict";
import { initHero, renderHero } from "../src/components/hero.ts";
import { installDom } from "./dom.ts";

interface FakeMedia {
  video: HTMLVideoElement;
  frame: HTMLElement;
  toggle: HTMLButtonElement;
  plays: number;
  reject: boolean;
  setVisible(visible: boolean): void;
}

function fakeMedia(): FakeMedia {
  const video = document.querySelector<HTMLVideoElement>("[data-hero-video]")!;
  const state: FakeMedia = {
    video,
    frame: document.querySelector<HTMLElement>("[data-hero-frame]")!,
    toggle: document.querySelector<HTMLButtonElement>("[data-hero-toggle]")!,
    plays: 0,
    reject: false,
    setVisible: () => {},
  };
  let paused = true;
  Object.defineProperty(video, "paused", { get: () => paused });
  Object.defineProperty(video, "error", { get: () => null });
  video.play = () => {
    state.plays++;
    if (state.reject)
      return Promise.reject(new DOMException("Blocked", "NotAllowedError"));
    paused = false;
    video.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  };
  video.pause = () => {
    paused = true;
  };
  let observed: ((entries: { isIntersecting: boolean }[]) => void) | null =
    null;
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: class {
      constructor(callback: typeof observed) {
        observed = callback;
      }
      observe() {}
      disconnect() {}
    },
  });
  state.setVisible = (visible) => observed?.([{ isIntersecting: visible }]);
  return state;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("hero movie plays muted, pauses on request or off-screen, and resumes", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    const dispose = initHero();
    assert.equal(media.video.paused, false);
    assert.ok(media.frame.classList.contains("is-playing"));
    assert.equal(media.toggle.hidden, false);
    assert.equal(media.toggle.getAttribute("aria-label"), "Pause the Shiba movie");

    media.toggle.click();
    assert.equal(media.video.paused, true);
    assert.equal(media.toggle.getAttribute("aria-label"), "Play the Shiba movie");
    media.setVisible(false);
    media.setVisible(true);
    assert.equal(media.video.paused, true, "A manual pause is respected.");

    media.toggle.click();
    assert.equal(media.video.paused, false);
    media.setVisible(false);
    assert.equal(media.video.paused, true, "Off-screen playback pauses.");
    media.setVisible(true);
    assert.equal(media.video.paused, false);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});

test("reduced motion keeps the poster until the visitor chooses to play", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`, true);
  try {
    const media = fakeMedia();
    const dispose = initHero();
    assert.equal(media.plays, 0);
    assert.equal(media.frame.classList.contains("is-playing"), false);
    assert.equal(media.toggle.getAttribute("aria-label"), "Play the Shiba movie");
    media.toggle.click();
    assert.equal(media.video.paused, false);
    assert.ok(media.frame.classList.contains("is-playing"));
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});

test("rejected playback or a missing source restores the poster without throwing", async () => {
  const window = installDom(`<div id="app">${renderHero()}</div>`);
  try {
    const media = fakeMedia();
    media.reject = true;
    const dispose = initHero();
    await tick();
    assert.equal(media.frame.classList.contains("is-playing"), false);
    assert.equal(media.toggle.getAttribute("aria-label"), "Play the Shiba movie");

    media.reject = false;
    media.toggle.click();
    assert.ok(media.frame.classList.contains("is-playing"));
    media.video.querySelector("source")!.dispatchEvent(new Event("error"));
    assert.equal(media.frame.classList.contains("is-playing"), false);
    assert.equal(media.toggle.hidden, true);
    dispose();
  } finally {
    await window.happyDOM.close();
  }
});
