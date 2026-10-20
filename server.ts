import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
};
export interface FileResponse {
  status: number;
  file?: string;
  size?: number;
  type?: string;
  etag?: string;
  cache?: string;
}

/** Filesystem-only resolution is separately testable without starting a server. */
export async function resolvePublicFile(
  root: string,
  requestTarget: string,
  method = "GET",
): Promise<FileResponse> {
  if (method !== "GET" && method !== "HEAD") return { status: 405 };
  let decoded: string;
  try {
    decoded = decodeURIComponent(requestTarget.split(/[?#]/, 1)[0] ?? "/");
  } catch {
    return { status: 400 };
  }
  if (
    !decoded.startsWith("/") ||
    decoded.includes("\0") ||
    decoded.includes("\\")
  )
    return { status: 400 };
  if (
    decoded
      .split("/")
      .some((segment) => segment.startsWith(".") || segment === "..")
  )
    return { status: 404 };
  const candidate = path.resolve(
    root,
    `.${decoded === "/" ? "/index.html" : decoded}`,
  );
  if (candidate !== root && !candidate.startsWith(root + path.sep))
    return { status: 404 };
  try {
    const actualRoot = await realpath(root),
      actualFile = await realpath(candidate);
    if (!actualFile.startsWith(actualRoot + path.sep)) return { status: 404 };
    const info = await stat(actualFile);
    if (!info.isFile()) return { status: 404 };
    const extension = path.extname(actualFile).toLowerCase();
    if (!types[extension]) return { status: 404 };
    return {
      status: 200,
      file: actualFile,
      size: info.size,
      type: types[extension],
      etag: `W/"${info.size}-${Math.trunc(info.mtimeMs)}"`,
      cache:
        extension === ".html"
          ? "no-cache"
          : /[/\\]assets[/\\]/.test(actualFile)
            ? "public, max-age=31536000, immutable"
            : "public, max-age=3600",
    };
  } catch {
    return { status: 404 };
  }
}

export function createProductionServer(
  root = fileURLToPath(new URL("./dist", import.meta.url)),
) {
  const absolute = path.resolve(root);
  return createServer(async (request, response) => {
    const result = await resolvePublicFile(
      absolute,
      request.url ?? "/",
      request.method,
    );
    for (const [name, value] of Object.entries(securityHeaders))
      response.setHeader(name, value);
    if (result.status !== 200 || !result.file) {
      if (result.status === 405) response.setHeader("Allow", "GET, HEAD");
      response.writeHead(result.status, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(
        request.method === "HEAD"
          ? undefined
          : result.status === 404
            ? "Not found"
            : result.status === 405
              ? "Method not allowed"
              : "Bad request",
      );
      return;
    }
    response.setHeader("ETag", result.etag!);
    response.setHeader("Cache-Control", result.cache!);
    if (request.headers["if-none-match"] === result.etag) {
      response.writeHead(304);
      response.end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": result.type!,
      "Content-Length": result.size!,
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(result.file);
    stream.on("error", () => response.destroy());
    response.on("close", () => stream.destroy());
    stream.pipe(response);
  });
}

const invoked =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "127.0.0.1";
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error("PORT must be a valid TCP port.");
  const folder = fileURLToPath(new URL("./dist", import.meta.url));
  try {
    await stat(path.join(folder, "index.html"));
  } catch {
    throw new Error("Production build is missing. Run npm run build first.");
  }
  const server = createProductionServer(folder);
  server.listen(port, host, () =>
    console.log(`Shiba P. Morgan Inu is available at http://${host}:${port}`),
  );
  server.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  for (const event of ["SIGINT", "SIGTERM"] as const)
    process.once(event, () => server.close());
}
