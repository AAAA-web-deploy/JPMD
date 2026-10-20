import imageVariants from "../data/image-variants.json" with { type: "json" };
import { imageProfiles } from "./image-profiles.ts";
import type { ImageProfile } from "./image-profiles.ts";

export function escapeHtml(value: unknown): string {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

/** Escapes display-font text; Reika has no P/period kerning pair. */
export function brandText(value: string): string {
  return escapeHtml(value).replace(/P\./g, 'P<span class="brand-kern">.</span>');
}

/** Vite's BASE_URL in the bundle; BASE_PATH when prerendering under Node. */
function basePath(): string {
  const base =
    (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ??
    (globalThis as { process?: { env: Record<string, string | undefined> } })
      .process?.env.BASE_PATH ??
    "/";
  return `/${base.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
}

export function asset(path: string): string {
  return `${basePath()}${path.replace(/^\/+/, "")}`;
}

export function safeExternalUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function icon(name: string, className = ""): string {
  return `<svg class="icon ${escapeHtml(className)}" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="${asset("icons/ui.svg")}#${escapeHtml(name)}"></use></svg>`;
}

export function officialLink(
  url: string | null,
  body: string,
  className: string,
  label: string,
): string {
  const href = safeExternalUrl(url);
  return href
    ? `<a class="${escapeHtml(className)}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${body}</a>`
    : `<button type="button" class="${escapeHtml(className)}" aria-label="${escapeHtml(label)} — official link not announced" title="Official link not announced" disabled>${body}</button>`;
}

/** Responsive candidates for an original image path, or "" when none were generated. */
export function srcset(path: string): string {
  const candidates =
    (imageVariants as Record<string, readonly { width: number; file: string }[]>)[path] ?? [];
  return candidates.map(({ width, file }) => `${asset(file)} ${width}w`).join(", ");
}

/** srcset and sizes for an <img> or <source>; the original path stays the fallback. */
export function responsiveAttributes(path: string, profile?: ImageProfile): string {
  if (!profile) return "";
  const candidates = srcset(path);
  return candidates ? ` srcset="${candidates}" sizes="${imageProfiles[profile].sizes}"` : "";
}

export function image(
  path: string,
  alt: string,
  className = "",
  eager = false,
  width = 1254,
  height = 1254,
  profile?: ImageProfile,
): string {
  return `<img src="${asset(path)}"${responsiveAttributes(path, profile)} alt="${escapeHtml(alt)}" class="${escapeHtml(className)}" width="${width}" height="${height}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""} />`;
}
