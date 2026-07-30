import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";

const projectRoot = path.resolve(".");
const publicRoot = path.resolve(process.env.BVB_LIGHTHOUSE_ROOT || "_site");
const externalBaseUrl = process.env.BVB_LIGHTHOUSE_URL || "";
const reportOnly = process.env.BVB_LIGHTHOUSE_REPORT_ONLY === "1";
const pages = [
  "index.html",
  "agenda.html",
  "galerij.html",
  "nbs.html",
  "contact.html"
];

const webServer = externalBaseUrl ? null : await startStaticServer(publicRoot);
const baseUrl = externalBaseUrl || `http://127.0.0.1:${webServer.address().port}`;
const baseline = reportOnly
  ? null
  : JSON.parse(
      await readFile(path.join(projectRoot, "tests", "lighthouse-baseline.json"), "utf8")
    );
const debuggingPort = await findFreePort();
const windowsChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({
  executablePath: process.platform === "win32" ? windowsChrome : undefined,
  headless: true,
  args: [
    `--remote-debugging-port=${debuggingPort}`,
    "--disable-dev-shm-usage",
    "--no-sandbox"
  ]
});

const scores = {};

try {
  await waitForDebugger(debuggingPort);

  for (const pageName of pages) {
    const measurements = [];
    for (let sample = 0; sample < 3; sample += 1) {
      measurements.push(await auditPage(pageName));
    }
    scores[pageName] = Object.fromEntries(
      ["performance", "accessibility", "seo"].map((category) => [
        category,
        median(measurements.map((measurement) => measurement[category]))
      ])
    );
    console.log(
      `${pageName}: ${formatScores(scores[pageName])}; samples ` +
      measurements.map((measurement) => measurement.performance).join(", ")
    );
  }
} finally {
  await browser.close();
  if (webServer) await new Promise((resolve) => webServer.close(resolve));
}

if (reportOnly) {
  const outputPath = process.env.BVB_LIGHTHOUSE_BASELINE_OUTPUT;
  if (outputPath) {
    const absoluteOutputPath = path.resolve(outputPath);
    if (!absoluteOutputPath.startsWith(`${projectRoot}${path.sep}`)) {
      throw new Error("Lighthouse-referentie moet binnen de projectmap worden opgeslagen.");
    }
    await writeFile(absoluteOutputPath, `${JSON.stringify(scores, null, 2)}\n`, "utf8");
    console.log(`Lighthouse-referentie opgeslagen in ${path.relative(projectRoot, absoluteOutputPath)}.`);
  }
  console.log(JSON.stringify(scores, null, 2));
  process.exit(0);
}

const errors = [];
for (const pageName of pages) {
  const current = scores[pageName];
  const previous = baseline[pageName];
  if (!previous) {
    errors.push(`${pageName}: legacy-baseline ontbreekt`);
    continue;
  }
  if (current.performance < previous.performance - 5) {
    errors.push(
      `${pageName}: performance ${current.performance}, baseline ${previous.performance} (meer dan 5 punten lager)`
    );
  }
  for (const category of ["accessibility", "seo"]) {
    if (current[category] < previous[category]) {
      errors.push(
        `${pageName}: ${category} ${current[category]}, baseline ${previous[category]}`
      );
    }
  }
}

if (errors.length) {
  throw new Error(`Lighthouse-regressie:\n- ${errors.join("\n- ")}`);
}
console.log("Lighthouse-controle geslaagd: geen toegankelijkheids- of SEO-regressie en maximaal 5 punten performanceverschil.");

async function startStaticServer(rootDirectory) {
  const server = createServer(async (request, response) => {
    try {
      const requestedPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
      const filePath = path.resolve(rootDirectory, relativePath);
      if (!filePath.startsWith(`${rootDirectory}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const fileStats = await stat(filePath);
      if (!fileStats.isFile()) throw new Error("not a file");
      response.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Cache-Control": "public, max-age=3600"
      });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Niet gevonden");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

async function findFreePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForDebugger(port) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Chrome debuggingpoort kwam niet beschikbaar");
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff2": "font/woff2"
  }[extension] || "application/octet-stream";
}

function formatScores(value) {
  return `performance ${value.performance}, toegankelijkheid ${value.accessibility}, SEO ${value.seo}`;
}

async function auditPage(pageName) {
  const result = await lighthouse(
    new URL(pageName, `${baseUrl}/`).toString(),
    {
      port: debuggingPort,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "seo"],
      blockedUrlPatterns: [
        "*static.cloudflareinsights.com*",
        "*challenges.cloudflare.com*",
        "*google.com/maps/embed*"
      ]
    }
  );
  if (!result?.lhr) throw new Error(`Geen Lighthouse-resultaat voor ${pageName}`);

  return Object.fromEntries(
    ["performance", "accessibility", "seo"].map((category) => [
      category,
      Math.round((result.lhr.categories[category]?.score || 0) * 100)
    ])
  );
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}
