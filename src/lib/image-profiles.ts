// `sizes` mirrors the rendered CSS widths in src/styles/main.css. `widths` cover
// those widths at 1x, 2x and 3x pixel density; update both together.
const memeWidths = [120, 240, 360, 540, 760];

export const imageProfiles = {
  header: { sizes: "(max-width: 800px) 78px, 84px", widths: [84, 168, 252] },
  card: {
    sizes:
      "(max-width: 359px) calc(100vw - 48px), (max-width: 800px) calc(50vw - 28px), (max-width: 1614px) calc(25vw - 41px), 362px",
    widths: memeWidths,
  },
  strip: { sizes: "(max-width: 800px) 180px, 240px", widths: memeWidths },
  archive: {
    sizes:
      "(max-width: 800px) calc(33vw - 24px), (max-width: 1620px) calc(10vw - 20px), 142px",
    widths: memeWidths,
  },
  story: {
    sizes:
      "(max-width: 599px) calc(100vw - 88px), (max-width: 1000px) calc(50vw - 48px), 492px",
    widths: [320, 500, 760, 1000],
  },
  coverWide: {
    sizes: "(max-width: 1000px) calc(100vw - 80px), 1080px",
    widths: [540, 880, 1080, 1440],
  },
  // The square phone cover fills a portrait frame with object-fit: cover, so it is drawn about 650px wide.
  coverMobile: { sizes: "650px", widths: [650, 960] },
  ledgerMascot: { sizes: "220px", widths: [220, 440, 660] },
  ledgerBadge: { sizes: "(max-width: 800px) 60px, 56px", widths: [60, 120, 180] },
  fieldGuide: {
    sizes:
      "(max-width: 800px) 75vw, (max-width: 1100px) 30vw, (max-width: 1650px) 32vw, 529px",
    widths: [300, 450, 600, 900],
  },
  roadmap: {
    sizes: "(max-width: 1100px) 100px, 130px",
    widths: [100, 130, 200, 260, 390],
  },
  chainSelfie: { sizes: "min(360px, 72vw)", widths: [280, 360, 560, 720, 1080] },
  closing: { sizes: "100vw", widths: [390, 640, 1000, 1366, 1920] },
  interlude: {
    sizes: "min(100vw - 48px, 640px)",
    widths: [320, 480, 640, 960],
  },
} satisfies Record<string, { sizes: string; widths: readonly number[] }>;

export type ImageProfile = keyof typeof imageProfiles;

/** Which profiles each source image is shown with; `native` adds a full-resolution candidate. */
export const imageSources: readonly {
  match: RegExp;
  profiles: readonly ImageProfile[];
  native?: boolean;
}[] = [
  { match: /^images\/memes\/[^/]+\.png$/, profiles: ["card", "strip", "archive"] },
  { match: /^images\/brand\/header-mascot\.png$/, profiles: ["header"] },
  { match: /^images\/story-ethereum-v3\/chapter-\d+\.png$/, profiles: ["story"], native: true },
  { match: /^images\/story-ethereum-v3\/cover-wide\.png$/, profiles: ["coverWide"], native: true },
  { match: /^images\/story-ethereum-v3\/cover-mobile\.png$/, profiles: ["coverMobile"], native: true },
  { match: /^images\/ledger\/ledger\.png$/, profiles: ["ledgerMascot"] },
  { match: /^images\/ledger\/(verify|hold-standing)\.png$/, profiles: ["ledgerBadge"] },
  { match: /^images\/ledger\/buy-guide\.png$/, profiles: ["fieldGuide"], native: true },
  { match: /^images\/roadmap\/[^/]+\.png$/, profiles: ["roadmap"] },
  { match: /^images\/editorial\/[^/]+\.jpg$/, profiles: ["chainSelfie"] },
  { match: /^images\/community\/closing-panorama-v2\.png$/, profiles: ["closing"], native: true },
  { match: /^images\/community\/phone-call-interlude\.png$/, profiles: ["interlude"], native: true },
];

export const faviconSource = "images/brand/shiba-portrait-clean.png";
export const favicons = [
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-192.png", size: 192 },
  { file: "apple-touch-icon.png", size: 180 },
] as const;
