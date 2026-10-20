import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicRoot = path.join(root, "public");
const inventory = JSON.parse(
  await readFile(path.join(root, "src/data/asset-manifest.json"), "utf8"),
);
const memes = JSON.parse(
  await readFile(path.join(root, "src/data/meme-catalog.json"), "utf8"),
);
const { heroVideo } = await import("../src/config.ts");
const errors = [];
const heroFiles = heroVideo
  ? [
      [heroVideo.src, heroVideo.sha256],
      [heroVideo.poster, heroVideo.posterSha256],
    ]
  : [];
for (const [file, sha256] of heroFiles) {
  try {
    const content = await readFile(path.join(publicRoot, file));
    if (createHash("sha256").update(content).digest("hex") !== sha256)
      errors.push(`Changed hero media bytes: ${file}`);
  } catch {
    errors.push(`Missing hero media: ${file}`);
  }
}
const allowedVideo = heroVideo
  ? path.join(publicRoot, heroVideo.src)
  : null;
for (const asset of inventory.assets) {
  try {
    const content = await readFile(path.join(publicRoot, asset.path));
    const digest = createHash("sha256").update(content).digest("hex");
    if (digest !== asset.sha256)
      errors.push(`Changed asset bytes: ${asset.path}`);
  } catch {
    errors.push(`Missing asset: ${asset.path}`);
  }
}
const paths = new Set(memes.map((meme) => meme.path));
if (memes.length !== 67 || paths.size !== 67)
  errors.push("The collection must contain 67 distinct image paths.");
const ids = new Set(memes.map((meme) => meme.id));
if (ids.size !== 67)
  errors.push("The collection contains repeated identifiers.");
for (const entry of memes)
  if (!inventory.assets.some((asset) => asset.path === entry.path))
    errors.push(`Unmapped collection image: ${entry.path}`);
async function scan(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    if (entry.isSymbolicLink())
      errors.push(`Public symlinks are not allowed: ${full}`);
    else if (entry.isDirectory()) await scan(full);
    else if (
      /\.(mp4|webm|mov|gif|apng|m4v|avi)$/i.test(entry.name) &&
      full !== allowedVideo
    )
      errors.push(`Video or animated image found: ${full}`);
    else if (entry.name.endsWith(".svg")) {
      const text = await readFile(full, "utf8");
      if (
        /<(?:script|animate|animateMotion|animateTransform|foreignObject)\b/i.test(
          text,
        ) ||
        /@keyframes|\banimation\s*:/i.test(text)
      )
        errors.push(`Non-static SVG: ${full}`);
    }
  }
}
await scan(publicRoot);
const sprite = path.join(publicRoot, "icons/ui.svg");
if (!(await stat(sprite)).isFile())
  errors.push("The local interface sprite is missing.");
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  `Verified ${inventory.assets.length} original media assets, 67 unique memes, local fonts, and the static icon sprite. ${heroVideo ? `Only video: the configured hero movie (${heroVideo.src}) and poster, hash-verified.` : "No videos."} No animated image files.`,
);
