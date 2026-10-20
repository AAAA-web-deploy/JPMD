import { STORAGE_KEY } from "./constants.ts";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** localStorage, or null when the browser blocks or lacks it. */
export function deviceStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    const probe = `${STORAGE_KEY}:probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** The saved best score, or 0 when there is none or it is unreadable. */
export function loadBest(storage: StorageLike | null): number {
  try {
    const value = Number(storage?.getItem(STORAGE_KEY) ?? 0);
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/** Saves `score` if it beats the stored best. Returns false if storage failed. */
export function saveBest(storage: StorageLike | null, score: number): boolean {
  if (!storage) return false;
  try {
    if (score > loadBest(storage)) storage.setItem(STORAGE_KEY, String(score));
    return true;
  } catch {
    return false;
  }
}
