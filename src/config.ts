export type SocialKey = "x" | "telegram" | "instagram" | "tiktok";

export interface SiteConfig {
  name: string;
  shortName: string;
  headlineLines: readonly [string, string];
  description: string;
  canonicalUrl: string | null;
  ticker: string | null;
  network: string | null;
  contractAddress: string | null;
  supply: string | null;
  buyUrl: string | null;
  chartUrl: string | null;
  explorerUrl: string | null;
  socials: Record<SocialKey, string | null>;
}

/** Set real, approved launch details here. Null values render honestly as unannounced. */
export const siteConfig: SiteConfig = {
  name: "Shiba P. Morgan Inu",
  shortName: "Shiba",
  headlineLines: ["Shiba P.", "Morgan Inu"],
  description: "Old money. Open ledgers. A very different Shiba.",
  canonicalUrl: null,
  ticker: null,
  network: null,
  contractAddress: null,
  supply: null,
  buyUrl: null,
  chartUrl: null,
  explorerUrl: null,
  socials: { x: null, telegram: null, instagram: null, tiktok: null },
};

export interface HeroVideo {
  /** Public path, without a leading slash (served from `/videos/...`). */
  src: string;
  type: string;
  poster: string;
  width: number;
  height: number;
  sha256: string;
  posterSha256: string;
}

/**
 * The user-authorized hero movie: the only video on the site.
 * Set to null to show the still Shiba portrait instead.
 */
export const heroVideo: HeroVideo | null = {
  src: "videos/banner_movie_v3.webm",
  type: 'video/webm; codecs="vp9, opus"',
  poster: "videos/banner_movie_v3-poster.png",
  width: 1280,
  height: 720,
  sha256: "baa9ea39466e496ace851c12200280ad650193e1b4ad4f11b221583d940504d0",
  posterSha256:
    "f36c3ba83688f8b471c4e4df4186877ed1e4788e93826df1b1918a33ab1f33c2",
};
