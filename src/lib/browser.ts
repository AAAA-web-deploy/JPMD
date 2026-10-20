export function announce(message: string): void {
  const node = document.querySelector<HTMLElement>("#toast");
  if (!node) return;
  node.textContent = message;
  node.hidden = false;
  const previous = Number(node.dataset.timer ?? "0");
  window.clearTimeout(previous);
  node.dataset.timer = String(
    window.setTimeout(() => {
      node.hidden = true;
    }, 3400),
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Try a local selection fallback when clipboard permission is unavailable. */
  }
  const selection = document.createElement("textarea");
  selection.value = text;
  selection.setAttribute("aria-label", "Text to copy");
  selection.style.cssText = "position:fixed;opacity:0;left:-9999px";
  document.body.append(selection);
  selection.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }
  selection.remove();
  return success;
}

export function downloadFile(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function mustQuery<T extends Element>(
  selector: string,
  parent: ParentNode = document,
): T {
  const found = parent.querySelector<T>(selector);
  if (!found)
    throw new Error(`Required interface element is missing: ${selector}`);
  return found;
}
