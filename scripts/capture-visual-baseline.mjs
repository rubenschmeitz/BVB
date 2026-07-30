import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { startStaticServer } from "./serve.mjs";
import { prepareVisualPage, publicPages } from "../tests/helpers.mjs";

if (process.env.BVB_ACCEPT_BASELINE !== "1") {
  throw new Error(
    "Deze opdracht overschrijft de visuele referentie. Zet BVB_ACCEPT_BASELINE=1 na handmatige controle."
  );
}

let baselineServer;
let baseURL = process.env.BVB_BASELINE_URL;
if (process.env.BVB_BASELINE_ROOT) {
  baselineServer = await startStaticServer({
    port: 0,
    rootDirectory: process.env.BVB_BASELINE_ROOT,
    quiet: true
  });
  baseURL = `http://127.0.0.1:${baselineServer.address().port}`;
}
if (!baseURL || !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(`${baseURL}/`)) {
  throw new Error("BVB_BASELINE_URL moet een expliciete lokale http(s)-URL zijn.");
}

const windowsChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch(
  !process.env.CI && existsSync(windowsChrome) ? { executablePath: windowsChrome } : {}
);
const outputDirectory = path.resolve(
  process.env.BVB_BASELINE_OUTPUT || "tests/visual-baseline"
);
await mkdir(outputDirectory, { recursive: true });

const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "390", width: 390, height: 844 },
  { name: "360", width: 360, height: 800 }
];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      baseURL,
      reducedMotion: "reduce",
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();
    for (const pageName of publicPages) {
      await prepareVisualPage(page, pageName);
      const stem = pageName.replace(".html", "");
      await page.screenshot({
        path: path.join(outputDirectory, `${stem}-${viewport.name}.png`),
        fullPage: true,
        animations: "disabled"
      });
      console.log(`Referentie vastgelegd: ${pageName} op ${viewport.name}px`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  if (baselineServer) {
    await new Promise((resolve, reject) =>
      baselineServer.close((error) => error ? reject(error) : resolve())
    );
  }
}
