import { expect, test } from "@playwright/test";
import { isolateExternalContent, publicPages } from "./helpers.mjs";

test.beforeEach(async ({ page }) => {
  await isolateExternalContent(page);
});

test("alle openbare pagina's en vaste bestanden blijven bereikbaar", async ({ page, request }) => {
  for (const pageName of publicPages) {
    const response = await page.goto(`/${pageName}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pageName).toBe(200);
  }
  for (const fileName of [
    "/docs/NBS_Flyer_2026.pdf",
    "/docs/bvb_agenda_2026.ics",
    "/sitemap.xml",
    "/robots.txt",
    "/site.webmanifest"
  ]) {
    expect((await request.get(fileName)).ok(), fileName).toBeTruthy();
  }
});

test("oude WordPress-querylinks blijven doorsturen", async ({ page }) => {
  await page.goto("/?page_id=100");
  await expect(page).toHaveURL(/contact\.html$/);
  await page.goto("/?page_id=155");
  await expect(page).toHaveURL(/agenda\.html$/);
  await page.goto("/?post_type=tribe_events");
  await expect(page).toHaveURL(/agenda\.html$/);
});

test("desktop- en mobiele navigatie blijven werken", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/index.html");
  await expect(page.locator(".main-nav a.active")).toHaveText("Home");
  await page.locator(".dropdown-trigger").click();
  await expect(page.locator(".dropdown-menu")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#fs-menu-trigger").click();
  await expect(page.locator("#full-screen-menu")).toHaveClass(/active/);
  await page.locator(".fs-menu-dropdown .fs-menu-trigger").click();
  await expect(page.locator(".fs-menu-submenu")).toBeVisible();
  await page.locator("#fs-menu-close").click();
  await expect(page.locator("#full-screen-menu")).not.toHaveClass(/active/);
});

test("homepagecarrousel wisselt inhoud zonder de pagina te verlaten", async ({ page }) => {
  await page.goto("/index.html");
  const title = page.locator("[data-home-gallery-title]");
  await expect(title).toHaveText("Kom naar onze NBS-tentoonstelling");
  await page.locator("[data-home-gallery-next]").click();
  await expect(title).toHaveText("Samen naar een boom kijken");
  await expect(page.locator("[data-home-gallery-counter]")).toHaveText("2 / 5");
});

test("agenda ondersteunt filters, lijst, maand en ICS", async ({ page, request }) => {
  await page.goto("/agenda.html");
  await expect(page.locator(".agenda-item")).toHaveCount(4);
  await page.locator('[data-filter="event"]').click();
  await expect(page.locator(".agenda-item")).toHaveCount(4);
  await page.locator("#view-calendar").click();
  await expect(page.locator(".calendar-grid")).toBeVisible();
  await page.locator("#next-month").click();
  await expect(page.locator(".calendar-header h3")).toBeVisible();
  const ics = await request.get("/docs/bvb_agenda_2026.ics");
  expect(await ics.text()).toContain("BEGIN:VCALENDAR");
});

test("galerij ondersteunt tabs, lightbox, tokonoma en toetsenbord", async ({ page }) => {
  await page.goto("/galerij.html");
  await expect(page.locator(".activity-item")).toHaveCount(23);
  await page.locator(".activity-item").first().click();
  await expect(page.locator("#lightbox")).toHaveClass(/active/);
  const firstImage = await page.locator("#lightbox-img").getAttribute("src");
  await page.locator("#lightbox").evaluate((lightbox) => {
    const start = new Event("touchstart");
    Object.defineProperty(start, "changedTouches", { value: [{ screenX: 300 }] });
    lightbox.dispatchEvent(start);
    const end = new Event("touchend");
    Object.defineProperty(end, "changedTouches", { value: [{ screenX: 100 }] });
    lightbox.dispatchEvent(end);
  });
  await expect(page.locator("#lightbox-img")).not.toHaveAttribute("src", firstImage);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(page.locator("#lightbox")).not.toHaveClass(/active/);

  await page.locator('[data-category="leden"]').click();
  await expect(page.locator("#leden-section")).toHaveClass(/active/);
  await page.locator(".exhibition-card").first().press("Enter");
  await expect(page.locator("#lightbox")).toHaveClass(/tokonoma-mode/);
  await expect(page.locator("#tokonoma-img")).toHaveAttribute("src", /acer_palmatum_groen_klein\.webp|wisteria_sinensis\.webp/);
});

test("verenigingskaart toont alle actieve markers en tooltips", async ({ page }) => {
  await page.goto("/vereniging.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".club-marker")).toHaveCount(12);
  await page.locator(".club-marker").first().hover();
  await expect(page.locator("#map-tooltip")).toHaveClass(/visible/);
  await expect(page.locator("#map-tooltip .tooltip-town")).not.toHaveText("Town");
});

test("NBS-programma blijft op mobiel inklapbaar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/nbs.html");
  const day = page.locator("details.schedule-day").first();
  await expect(day).not.toHaveAttribute("open", "");
  await day.locator("summary").click();
  await expect(day).toHaveAttribute("open", "");
  await expect(page.locator("add-to-calendar-button")).toHaveCount(2);
  await expect(page.locator(".sidebar-sponsor-item")).toHaveCount(8);
});

test("contactformulier accepteert alleen een gekoppelde backendbevestiging", async ({ page }) => {
  await page.goto("/contact.html");
  await page.locator("#name").fill("Test Bezoeker");
  await page.locator("#email").fill("test@example.com");
  await page.locator("#subject").selectOption("Komen kijken");
  await page.locator("#message").fill("Dit is een gecontroleerd testbericht voor het formulier.");
  await page.locator(".contact-form").evaluate((form) => {
    const token = document.createElement("input");
    token.type = "hidden";
    token.name = "cf-turnstile-response";
    token.value = "test-token";
    form.append(token);
  });
  await page.locator(".contact-form").evaluate((form) => form.requestSubmit());

  const submissionId = await page.locator("#submission-id").inputValue();
  expect(submissionId).not.toBe("");
  await expect(page.locator(".form-status")).toContainText("veilig verstuurd");

  await page.evaluate((id) => {
    const frame = document.getElementById("contact-response-frame");
    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://example.com",
      source: frame.contentWindow,
      data: { source: "bvb-contact", submissionId: id, status: "success", message: "Onveilig" }
    }));
  }, submissionId);
  await expect(page.locator(".form-feedback")).toHaveCount(0);

  await page.evaluate((id) => {
    const frame = document.getElementById("contact-response-frame");
    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://script.googleusercontent.com",
      source: frame.contentWindow,
      data: {
        source: "bvb-contact",
        submissionId: id,
        status: "success",
        message: "Bericht succesvol verzonden!"
      }
    }));
  }, submissionId);
  await expect(page.locator(".form-feedback")).toBeVisible();
  await expect(page.locator(".form-feedback-text")).toHaveText("Bericht succesvol verzonden!");
});

test("contactformulier toont backendfouten als opnieuw te proberen", async ({ page }) => {
  await page.goto("/contact.html");
  await page.locator("#name").fill("Test Bezoeker");
  await page.locator("#email").fill("test@example.com");
  await page.locator("#subject").selectOption("Overige vraag");
  await page.locator("#message").fill("Dit bericht test de foutafhandeling van het formulier.");
  await page.locator(".contact-form").evaluate((form) => {
    const token = document.createElement("input");
    token.type = "hidden";
    token.name = "cf-turnstile-response";
    token.value = "test-token";
    form.append(token);
    form.requestSubmit();
  });
  const submissionId = await page.locator("#submission-id").inputValue();
  await page.evaluate((id) => {
    const frame = document.getElementById("contact-response-frame");
    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://script.googleusercontent.com",
      source: frame.contentWindow,
      data: { source: "bvb-contact", submissionId: id, status: "error", message: "Probeer het opnieuw." }
    }));
  }, submissionId);
  await expect(page.locator(".form-status")).toHaveText("Probeer het opnieuw.");
  await expect(page.locator(".submit-btn")).toBeEnabled();
});

test("contactformulier meldt een time-out zonder succes te tonen", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) =>
      nativeSetTimeout(callback, delay === 15000 ? 40 : delay, ...args);
  });
  await page.goto("/contact.html");
  await page.locator("#name").fill("Test Bezoeker");
  await page.locator("#email").fill("test@example.com");
  await page.locator("#subject").selectOption("Overige vraag");
  await page.locator("#message").fill("Dit bericht test de time-out van het formulier.");
  await page.locator(".contact-form").evaluate((form) => {
    const token = document.createElement("input");
    token.type = "hidden";
    token.name = "cf-turnstile-response";
    token.value = "test-token";
    form.append(token);
    form.requestSubmit();
  });
  await expect(page.locator(".form-status")).toContainText("geen bevestiging");
  await expect(page.locator(".form-feedback")).toHaveCount(0);
  await expect(page.locator(".submit-btn")).toBeEnabled();
});

test("pagina's geven zonder externe embeds geen consolefouten", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (const pageName of publicPages) {
    await page.goto(`/${pageName}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(50);
  }
  expect(errors).toEqual([]);
});

test("404, toetsenbordfocus en verminderde beweging blijven bruikbaar", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/404.html");
  await expect(page.locator("h1")).toHaveText("404");
  await page.keyboard.press("Tab");
  await expect(page.locator(".cta-btn")).toBeFocused();
});
