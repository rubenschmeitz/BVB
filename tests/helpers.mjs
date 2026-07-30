export const publicPages = [
  "index.html",
  "agenda.html",
  "galerij.html",
  "nbs.html",
  "over-ons.html",
  "vereniging.html",
  "contact.html",
  "404.html"
];

export async function isolateExternalContent(page) {
  await page.route("https://static.cloudflareinsights.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
  );
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
  );
  await page.route("https://www.google.com/maps/embed**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Kaart</title>" })
  );
  await page.route("https://script.google.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Testantwoord</title>" })
  );
}

export async function prepareVisualPage(page, pageName) {
  await isolateExternalContent(page);
  await page.goto(`/${pageName}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
      html {
        scroll-behavior: auto !important;
      }
      .map-frame,
      .cf-turnstile {
        visibility: hidden !important;
      }
    `
  });
  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
    const images = Array.from(document.images);
    for (const image of images) {
      image.loading = "eager";
      image.scrollIntoView({ block: "center" });
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      if (!image.complete || image.naturalWidth === 0) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 1000);
          const finish = () => {
            clearTimeout(timer);
            resolve();
          };
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
        });
      }
      await image.decode?.().catch(() => {});
    }

    // Visit the full document once to settle scroll-reveal behavior too.
    const step = Math.max(window.innerHeight * 0.8, 300);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(150);
}
