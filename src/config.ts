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
