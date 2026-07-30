import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { prepareVisualPage, publicPages } from "./helpers.mjs";

const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "390", width: 390, height: 844 },
  { name: "360", width: 360, height: 800 }
];
const baselineDirectory = path.resolve("tests/visual-baseline");
const diffDirectory = path.resolve("test-results/visual-diffs");

for (const viewport of viewports) {
  for (const pageName of publicPages) {
    const stem = pageName.replace(".html", "");
    test(`${pageName} blijft visueel gelijk op ${viewport.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await prepareVisualPage(page, pageName);
      const actualBytes = await page.screenshot({ fullPage: true, animations: "disabled" });
      const expectedBytes = await readFile(path.join(baselineDirectory, `${stem}-${viewport.name}.png`));
      const actual = PNG.sync.read(actualBytes);
      const expected = PNG.sync.read(expectedBytes);

      expect(actual.width, "De paginabreedte wijkt af van de vastgelegde versie.").toBe(expected.width);
      expect(
        Math.abs(actual.height - expected.height),
        "De totale paginahoogte wijkt meer dan vier afrondingspixels af."
      ).toBeLessThanOrEqual(4);

      const comparisonHeight = Math.max(actual.height, expected.height);
      const normalizedActual = padToHeight(actual, comparisonHeight);
      const normalizedExpected = padToHeight(expected, comparisonHeight);
      const diff = new PNG({ width: expected.width, height: comparisonHeight });
      const changedPixels = pixelmatch(
        normalizedExpected.data,
        normalizedActual.data,
        diff.data,
        expected.width,
        comparisonHeight,
        { threshold: 0.1 }
      );
      const changedRatio = changedPixels / (expected.width * comparisonHeight);

      if (changedRatio > 0.005) {
        await mkdir(diffDirectory, { recursive: true });
        await writeFile(
          path.join(diffDirectory, `${stem}-${viewport.name}.png`),
          PNG.sync.write(diff)
        );
      }
      expect(changedRatio, `Visueel verschil ${(changedRatio * 100).toFixed(3)}%`).toBeLessThanOrEqual(0.005);
    });
  }
}

function padToHeight(image, height) {
  if (image.height === height) return image;
  const padded = new PNG({ width: image.width, height });
  const lastPixelOffset = ((image.height - 1) * image.width) * 4;
  const color = image.data.subarray(lastPixelOffset, lastPixelOffset + 4);
  for (let offset = 0; offset < padded.data.length; offset += 4) {
    padded.data.set(color, offset);
  }
  PNG.bitblt(image, padded, 0, 0, image.width, image.height, 0, 0);
  return padded;
}
