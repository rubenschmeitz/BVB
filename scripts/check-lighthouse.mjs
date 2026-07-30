import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";

const projectRoot = path.resolve(".");
const publicRoot = path.resolve(process.env.BVB_LIGHTHOUSE_ROOT || "_site");
const comparisonRoot = process.env.BVB_LIGHTHOUSE_BASELINE_ROOT
  ? path.resolve(process.env.BVB_LIGHTHOUSE_BASELINE_ROOT)
  : null;
const externalBaseUrl = process.env.BVB_LIGHTHOUSE_URL || "";
const reportOnly = process.env.BVB_LIGHTHOUSE_REPORT_ONLY === "1";
const defaultPages = [
  "index.html",
  "agenda.html",
  "galerij.html",
  "nbs.html",
  "contact.html"
];
const pages = process.env.BVB_LIGHTHOUSE_PAGES
  ? process.env.BVB_LIGHTHOUSE_PAGES.split(",").map((pageName) => pageName.trim()).filter(Boolean)
  : defaultPages;
const sampleCount = Number.parseInt(process.env.BVB_LIGHTHOUSE_SAMPLES || "3", 10);
if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 10) {
  throw new Error("BVB_LIGHTHOUSE_SAMPLES moet een geheel getal tussen 1 en 10 zijn.");
}

const webServer = externalBaseUrl ? null : await startStaticServer(publicRoot);
const baseUrl = externalBaseUrl || `http://127.0.0.1:${webServer.address().port}`;
const comparisonServer = comparisonRoot ? await startStaticServer(comparisonRoot) : null;
const comparisonBaseUrl = comparisonServer
  ? `http://127.0.0.1:${comparisonServer.address().port}`
  : "";
const storedBaseline = reportOnly || comparisonRoot
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
const comparisonScores = {};

try {
  await waitForDebugger(debuggingPort);

  for (const pageName of pages) {
    const measurements = [];
    const comparisonMeasurements = [];
    for (let sample = 0; sample < sampleCount; sample += 1) {
      if (!comparisonRoot) {
        measurements.push(await auditPage(pageName, baseUrl));
        continue;
      }

      // Alternate the order so browser warm-up and runner load cannot
      // consistently favor either the unchanged or generated website.
      if (sample % 2 === 0) {
        comparisonMeasurements.push(await auditPage(pageName, comparisonBaseUrl));
        measurements.push(await auditPage(pageName, baseUrl));
      } else {
        measurements.push(await auditPage(pageName, baseUrl));
        comparisonMeasurements.push(await auditPage(pageName, comparisonBaseUrl));
      }
    }
    scores[pageName] = summarizeScores(measurements);
    logMeasurements("huidig", pageName, scores[pageName], measurements);

    if (comparisonMeasurements.length) {
      comparisonScores[pageName] = summarizeScores(comparisonMeasurements);
      logMeasurements(
        "referentie",
        pageName,
        comparisonScores[pageName],
        comparisonMeasurements
      );
    }
  }
} finally {
  await browser.close();
  await Promise.all(
    [webServer, comparisonServer]
      .filter(Boolean)
      .map((server) => new Promise((resolve) => server.close(resolve)))
  );
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

const baseline = comparisonRoot ? comparisonScores : storedBaseline;
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

function summarizeScores(measurements) {
  return Object.fromEntries(
    ["performance", "accessibility", "seo"].map((category) => [
      category,
      median(measurements.map((measurement) => measurement[category]))
    ])
  );
}

function logMeasurements(label, pageName, categoryScores, measurements) {
  console.log(
    `${label} ${pageName}: ${formatScores(categoryScores)}; samples ` +
    measurements.map((measurement) => measurement.performance).join(", ") +
    `; ${formatPerformanceMetrics(measurements)}`
  );
}

function formatPerformanceMetrics(measurements) {
  const metrics = [
    ["FCP", "first-contentful-paint"],
    ["LCP", "largest-contentful-paint"],
    ["SI", "speed-index"],
    ["TBT", "total-blocking-time"],
    ["TTI", "interactive"]
  ].map(([label, auditId]) => {
    const values = measurements.map((measurement) => measurement.metrics[auditId].value);
    const auditScores = measurements.map((measurement) => measurement.metrics[auditId].score);
    return `${label} ${Math.round(median(values))}ms/${median(auditScores)}`;
  });
  const lcpTargets = [
    ...new Set(measurements.map((measurement) => measurement.lcpTarget).filter(Boolean))
  ];
  if (lcpTargets.length) metrics.push(`LCP-element ${lcpTargets.join(" | ")}`);
  const lcpPhases = measurements
    .map((measurement) => measurement.lcpPhases)
    .filter((phases) => phases.length);
  if (lcpPhases.length) {
    const phaseNames = [...new Set(lcpPhases.flat().map((phase) => phase.phase))];
    metrics.push(
      `LCP-fasen ${phaseNames.map((phaseName) => {
        const values = lcpPhases.map((phases) =>
          phases.find((phase) => phase.phase === phaseName)?.duration || 0
        );
        return `${phaseName} ${Math.round(median(values))}ms`;
      }).join(", ")}`
    );
  }
  return metrics.join(", ");
}

async function auditPage(pageName, auditBaseUrl) {
  const result = await lighthouse(
    new URL(pageName, `${auditBaseUrl}/`).toString(),
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

  const categoryScores = Object.fromEntries(
    ["performance", "accessibility", "seo"].map((category) => [
      category,
      Math.round((result.lhr.categories[category]?.score || 0) * 100)
    ])
  );
  const metricAuditIds = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "speed-index",
    "total-blocking-time",
    "interactive"
  ];
  const metrics = Object.fromEntries(
    metricAuditIds.map((auditId) => {
      const audit = result.lhr.audits[auditId];
      return [
        auditId,
        {
          value: audit?.numericValue || 0,
          score: Math.round((audit?.score || 0) * 100)
        }
      ];
    })
  );
  const lcpInsight = result.lhr.audits["lcp-phases-insight"]?.details;
  const lcpTarget = findFirstValue(lcpInsight, (value) => value?.node?.selector)?.node?.selector
    || findFirstValue(
      result.lhr.audits["largest-contentful-paint-element"]?.details,
      (value) => value?.node?.selector
    )?.node?.selector;
  const lcpPhases = findFirstValue(
    lcpInsight,
    (value) => Array.isArray(value) && value.some((item) => item?.phase && item?.duration)
  ) || [];
  return { ...categoryScores, metrics, lcpTarget, lcpPhases };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function findFirstValue(value, predicate) {
  if (predicate(value)) return value;
  if (!value || typeof value !== "object") return undefined;
  for (const nestedValue of Object.values(value)) {
    const match = findFirstValue(nestedValue, predicate);
    if (match !== undefined) return match;
  }
  return undefined;
}
