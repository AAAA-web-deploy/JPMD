export type Theme = "day" | "night";

export const themeStorageKey = "shiba-theme";
/** Browser chrome colors; they match --paper in each theme. */
export const themeColors: Record<Theme, string> = { day: "#faf7f2", night: "#1b1714" };

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

export function isTheme(value: unknown): value is Theme {
  return value === "day" || value === "night";
}

export function readStoredTheme(storage: ThemeStorage | null | undefined): Theme | null {
  try {
    const value = storage?.getItem(themeStorageKey);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(storage: ThemeStorage | null | undefined, theme: Theme): boolean {
  try {
    if (!storage) return false;
    storage.setItem(themeStorageKey, theme);
    return true;
  } catch {
    return false;
  }
}

/** Saved valid preference, then the operating-system preference, then day. */
export function resolveTheme(saved: Theme | null, prefersDark: boolean): Theme {
  return saved ?? (prefersDark ? "night" : "day");
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "night" ? "dark" : "light";
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = themeColors[theme];
}

/** Header sun/moon toggle. The initial theme is already applied by the inline script in index.html. */
export function initThemeToggle(): () => void {
  const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const storage = safeStorage();
  let explicit = readStoredTheme(storage) !== null;
  const current = (): Theme =>
    isTheme(root.dataset.theme) ? root.dataset.theme : resolveTheme(readStoredTheme(storage), system.matches);

  function sync(theme: Theme): void {
    applyTheme(theme, root);
    if (!button) return;
    button.setAttribute("aria-pressed", String(theme === "night"));
    button.title = theme === "night" ? "Switch to day mode" : "Switch to night mode";
  }
  const toggle = (): void => {
    const next: Theme = current() === "night" ? "day" : "night";
    explicit = true;
    storeTheme(storage, next);
    sync(next);
  };
  const followSystem = (): void => {
    if (!explicit) sync(system.matches ? "night" : "day");
  };

  sync(current());
  button?.addEventListener("click", toggle);
  system.addEventListener("change", followSystem);
  return () => {
    button?.removeEventListener("click", toggle);
    system.removeEventListener("change", followSystem);
  };
}

export function themeToggle(): string {
  const sun = `<svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const moon = `<svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
  return `<button type="button" class="theme-toggle" aria-label="Night mode" aria-pressed="false" title="Switch to night mode" data-theme-toggle>${sun}${moon}</button>`;
}
