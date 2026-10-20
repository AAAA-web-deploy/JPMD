import { Window } from "happy-dom";

export function installDom(markup: string, reducedMotion = false): Window {
  const window = new Window({ url: "https://example.test" });
  window.document.body.innerHTML = markup;
  const media = {
    matches: reducedMotion,
    addEventListener() {},
    removeEventListener() {},
  };
  window.matchMedia = (() => media) as unknown as typeof window.matchMedia;
  for (const name of [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "HTMLButtonElement",
    "HTMLAnchorElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLDialogElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "Image",
  ] as const) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: name === "window" ? window : window[name],
    });
  }
  return window;
}

export function emulateNativeDialog(dialog: HTMLDialogElement): void {
  Object.defineProperty(dialog, "showModal", {
    configurable: true,
    value() {
      dialog.setAttribute("open", "");
    },
  });
  Object.defineProperty(dialog, "close", {
    configurable: true,
    value() {
      if (dialog.open) {
        dialog.removeAttribute("open");
        dialog.dispatchEvent(new Event("close"));
      }
    },
  });
}
