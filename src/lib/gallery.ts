/** Filter buttons of the "Meet the many moods of Shiba" gallery, in display order. */
export const categories = [
  "All Shibas",
  "Wall Street",
  "Ethereum",
  "Trading Desk",
  "Shiba Culture",
  "Shiba Society",
] as const;
export type Category = (typeof categories)[number];
export const ALL_CATEGORY: Category = "All Shibas";
export type Collection = Exclude<Category, "All Shibas">;

/** Themes recorded in the original 67-image catalog (strips and archive). */
export const catalogThemes = [
  "Bullish",
  "Bearish",
  "GM / GN",
  "Reactions",
  "Lifestyle",
  "Community",
] as const;
export type CatalogTheme = (typeof catalogThemes)[number];

export interface ImageEntry {
  id: string;
  path: string;
  alt: string;
  caption: string;
}
export interface Meme extends ImageEntry {
  category: CatalogTheme;
}
export interface MoodImage extends ImageEntry {
  collection: Collection;
}

export interface GalleryState {
  category: Category;
  visible: number;
}
export const PAGE_SIZE = 8;

export function isCategory(value: unknown): value is Category {
  return categories.some((category) => category === value);
}
export function isCatalogTheme(value: unknown): value is CatalogTheme {
  return catalogThemes.some((theme) => theme === value);
}

export function filterMoods(
  images: readonly MoodImage[],
  category: Category,
): MoodImage[] {
  return images.filter(
    (image) => category === ALL_CATEGORY || image.collection === category,
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

export function downloadName(meme: Pick<ImageEntry, "id" | "path">): string {
  const base = meme.path.split("/").pop() ?? `${meme.id}.png`;
  return `shiba-p-morgan-inu-${base.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
}
