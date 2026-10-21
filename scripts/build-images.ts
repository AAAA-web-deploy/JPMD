import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  faviconSource,
  favicons,
  imageProfiles,
  imageSources,
  webpSource,
} from "../src/lib/image-profiles.ts";

type Candidate = { width: number; file: string };
interface CacheEntry {
  size: number;
  mtimeMs: number;
  sha256: string;
  key: string;
  candidates: Candidate[];
  outputs: string[];
}

const root = fileURLToPath(new URL("../", import.meta.url));
const publicDir = path.join(root, "public");
const generated = "generated";
const outputDir = path.join(publicDir, generated);
const cacheFile = path.join(root, ".cache", "images.json");
const mapFile = path.join(root, "src", "data", "image-variants.json");
const webp = { lossless: true, effort: 4 } as const;
// Bump when the output rules change so cached derivatives are rebuilt.
const revision = 3;
const toPosix = (file: string) => file.split(path.sep).join("/");

async function sourceImages(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (full === outputDir) continue;
    if (entry.isDirectory()) files.push(...(await sourceImages(full)));
    else if (
      /\.(png|jpe?g)$/i.test(entry.name) ||
      webpSource.test(toPosix(path.relative(publicDir, full)))
    )
      files.push(full);
  }
  return files;
}

async function generatedFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await generatedFiles(full)));
    else files.push(toPosix(path.relative(publicDir, full)));
  }
  return files;
}

const exists = (file: string) =>
  stat(path.join(publicDir, file)).then(
    (info) => info.isFile(),
    () => false,
  );

const cache: Record<string, CacheEntry> = JSON.parse(
  await readFile(cacheFile, "utf8").catch(() => "{}"),
);
const nextCache: Record<string, CacheEntry> = {};
const map: Record<string, Candidate[]> = {};
const started = Date.now();
let encoded = 0;
let reused = 0;

async function cached(
  source: string,
  settings: unknown,
  build: (input: Buffer) => Promise<Candidate[] | string[]>,
): Promise<CacheEntry> {
  const full = path.join(publicDir, source);
  const info = await stat(full);
  const previous = cache[source];
  const key = createHash("sha256")
    .update(JSON.stringify({ settings, sharp: sharp.versions.sharp, webp, revision }))
    .digest("hex");
  let input: Buffer | undefined;
  let sha256 = previous?.sha256 ?? "";
  if (previous?.size !== info.size || previous.mtimeMs !== info.mtimeMs) {
    input = await readFile(full);
    sha256 = createHash("sha256").update(input).digest("hex");
  }
  if (
    previous?.sha256 === sha256 &&
    previous.key === key &&
    (await Promise.all(previous.outputs.map(exists))).every(Boolean)
  ) {
    reused += previous.outputs.length;
    return (nextCache[source] = { ...previous, size: info.size, mtimeMs: info.mtimeMs });
  }
  input ??= await readFile(full);
  const result = await build(input);
  const candidates = result.filter((item): item is Candidate => typeof item === "object");
  const outputs = [
    ...result.filter((item): item is string => typeof item === "string"),
    ...candidates.map(({ file }) => file).filter((file) => file.startsWith(`${generated}/`)),
  ];
  return (nextCache[source] = {
    size: info.size,
    mtimeMs: info.mtimeMs,
    sha256,
    key,
    candidates,
    outputs,
  });
}

async function write(file: string, data: Buffer): Promise<void> {
  const full = path.join(publicDir, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  encoded += 1;
}

async function responsive(source: string): Promise<void> {
  const rule = imageSources.find(({ match }) => match.test(source));
  if (!rule) return;
  const wanted = [...new Set(rule.profiles.flatMap((name) => imageProfiles[name].widths))];
  const entry = await cached(source, { wanted, native: rule.native ?? false }, async (input) => {
    const { width: nativeWidth } = await sharp(input).metadata();
    const widths = wanted.filter((width) => width < nativeWidth).sort((a, b) => a - b);
    if (rule.native) widths.push(nativeWidth);
    const stem = source.replace(/\.[^.]+$/, "");
    const candidates: Candidate[] = [];
    for (const width of widths) {
      const pipeline = sharp(input).keepIccProfile();
      if (width < nativeWidth) pipeline.resize({ width });
      const data = await pipeline.webp(webp).toBuffer();
      const file = `${generated}/${stem}-${width}.webp`;
      if (data.length < input.length) {
        await write(file, data);
        candidates.push({ width, file });
      } else {
        // The original stays the high-density candidate when WebP cannot beat it.
        if (!candidates.some(({ file }) => file === source)) candidates.push({ width: nativeWidth, file: source });
        break;
      }
    }
    return candidates;
  });
  if (entry.candidates.length) map[source] = entry.candidates;
}

async function icons(): Promise<void> {
  await cached(faviconSource, favicons, async (input) => {
    const files: string[] = [];
    for (const { file, size } of favicons) {
      const data = await sharp(input)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      await write(`${generated}/${file}`, data);
      files.push(`${generated}/${file}`);
    }
    return files;
  });
}

const sources = (await sourceImages(path.join(publicDir, "images")))
  .map((file) => toPosix(path.relative(publicDir, file)))
  .sort();
const queue = [...sources];
await Promise.all([
  icons(),
  ...Array.from({ length: 4 }, async () => {
    for (let source = queue.shift(); source; source = queue.shift()) await responsive(source);
  }),
]);

const keep = new Set(Object.values(nextCache).flatMap((entry) => entry.outputs));
const stale = (await generatedFiles(outputDir)).filter((file) => !keep.has(file));
await Promise.all(stale.map((file) => rm(path.join(publicDir, file))));

const sortedMap = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
const json = `${JSON.stringify(sortedMap, null, 2)}\n`;
if ((await readFile(mapFile, "utf8").catch(() => "")) !== json) await writeFile(mapFile, json);
await mkdir(path.dirname(cacheFile), { recursive: true });
await writeFile(cacheFile, JSON.stringify(nextCache));

console.log(
  `Responsive images: ${Object.keys(map).length} sources, ${encoded} encoded, ${reused} reused, ${stale.length} stale removed in ${((Date.now() - started) / 1000).toFixed(1)}s.`,
);
