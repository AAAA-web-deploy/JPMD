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
  src: "videos/banner_movie_v2.mp4",
  type: 'video/mp4; codecs="avc1.640020, mp4a.40.2"',
  poster: "videos/banner_movie_v2-poster.jpg",
  width: 1280,
  height: 720,
  sha256: "84210b7238675eeaf35d05c8702a583a689ad13aec24a359d2e63165dd833d88",
  posterSha256:
    "e0a57e187800b95aa4b796a6e1f3bc35492334aecbef1de137b599d534279463",
};
