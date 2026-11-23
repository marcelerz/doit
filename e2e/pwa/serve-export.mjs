#!/usr/bin/env node

/**
 * serve-export.mjs
 *
 * Serves the static export in out/ the way GitHub Pages does: under /doit/.
 * It is the web server of playwright.pwa.config.ts and has no other use.
 *
 * It differs from a plain static server in four ways, all for the tests:
 *
 * - Every response says "no-store". A file can then only come back offline
 *   from the service worker's cache, never from the browser's own, which is
 *   what makes the offline test a test of the worker.
 * - /doit/sounds/ answers 404. On install the service worker precaches 18
 *   ambient sound files, 315 MB in all, and carries on when one is missing.
 *   Leaving them out keeps an install to about a second.
 * - POST /__pwa-test/next-worker makes sw.js different from then on, by
 *   changing the version stamped into it. That is what a new deploy looks
 *   like to a browser, so a test can make an update arrive mid-session.
 * - POST /__pwa-test/offline makes the server drop every connection until
 *   POST /__pwa-test/online. Playwright's own offline switch does not reach
 *   the requests a service worker makes, so without this the worker would
 *   keep fetching from the network while the page believed it was offline.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.argv[2] ?? 3100);
const ROOT = path.resolve(process.cwd(), "out");
const BASE = "/doit";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** How many times a test has asked for a new worker. */
let workerGeneration = 0;

/** While true, nothing but the test endpoints is answered. */
let offline = false;

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

/** The file a path maps to, trying it as given, as a page, and as a folder. */
async function resolveFile(relative) {
  for (const candidate of [relative, `${relative}.html`, path.join(relative, "index.html")]) {
    const file = path.join(ROOT, candidate);
    // Never outside the export, whatever the path says.
    if (file.startsWith(ROOT + path.sep) && (await isFile(file))) return file;
  }
  return null;
}

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? "/", `http://localhost:${PORT}`);

  if (request.method === "POST" && pathname.startsWith("/__pwa-test/")) {
    if (pathname === "/__pwa-test/next-worker") workerGeneration += 1;
    if (pathname === "/__pwa-test/offline") offline = true;
    if (pathname === "/__pwa-test/online") offline = false;
    response.writeHead(204).end();
    return;
  }

  if (offline) {
    request.socket.destroy();
    return;
  }

  const inBase = pathname === BASE || pathname.startsWith(`${BASE}/`);
  const relative = inBase ? decodeURIComponent(pathname.slice(BASE.length)) || "/" : null;
  const file = relative === null || relative.startsWith("/sounds/") ? null : await resolveFile(relative);

  if (!file) {
    // GitHub Pages serves 404.html, with the status, for anything it lacks.
    const notFound = await readFile(path.join(ROOT, "404.html")).catch(() => "Not found");
    response.writeHead(404, { "Content-Type": TYPES[".html"] }).end(notFound);
    return;
  }

  let body = await readFile(file);
  if (relative === "/sw.js" && workerGeneration > 0) {
    body = body
      .toString("utf8")
      .replace(/const BUILD_VERSION = "([^"]+)"/, `const BUILD_VERSION = "$1-test${workerGeneration}"`);
  }
  response
    .writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    })
    .end(body);
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}${BASE}/`);
});
