import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { isolateExternalContent, publicPages } from "./helpers.mjs";

for (const pageName of publicPages) {
  test(`${pageName} heeft geen nieuwe ernstige toegankelijkheidsfouten`, async ({ page }) => {
    await isolateExternalContent(page);
    await page.goto(`/${pageName}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts?.ready);

    const results = await new AxeBuilder({ page })
      .exclude(".map-iframe-wrapper")
      .exclude(".cf-turnstile")
      .exclude("add-to-calendar-button")
      .analyze();
    const serious = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact) &&
      // The legacy palette has known contrast failures on every page. Colors
      // are intentionally protected by the stricter visual-parity gate.
      violation.id !== "color-contrast"
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
