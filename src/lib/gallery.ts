export const categories = [
  "All",
  "Bullish",
  "Bearish",
  "GM / GN",
  "Reactions",
  "Lifestyle",
  "Community",
] as const;
export type Category = (typeof categories)[number];
export interface Meme {
  id: string;
  path: string;
  category: Exclude<Category, "All">;
  alt: string;
  caption: string;
}

export interface GalleryState {
  category: Category;
  visible: number;
}
export const PAGE_SIZE = 8;

export function isCategory(value: unknown): value is Category {
  return categories.some((category) => category === value);
}

export function filterMemes(
  memes: readonly Meme[],
  category: Category,
): Meme[] {
  return memes.filter(
    (meme) => category === "All" || meme.category === category,
  );
}

export function chooseCategory(category: Category): GalleryState {
  return { category, visible: PAGE_SIZE };
}

export function expandGallery(
  state: GalleryState,
  total: number,
): GalleryState {
  return { ...state, visible: Math.min(total, state.visible + PAGE_SIZE) };
}

export function shareUrl(caption: string, imageUrl: string): string {
  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", `${caption}\n${imageUrl}`);
  return url.href;
}

export function downloadName(meme: Pick<Meme, "id" | "path">): string {
  const base = meme.path.split("/").pop() ?? `${meme.id}.png`;
  return `shiba-p-morgan-inu-${base.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
}
