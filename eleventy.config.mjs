import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(".");

function readAssetVersion() {
  const versionFile = path.join(PROJECT_ROOT, ".build", "asset-version.txt");
  return existsSync(versionFile) ? readFileSync(versionFile, "utf8").trim() : "dev";
}

function readImageManifest() {
  const manifestFile = path.join(PROJECT_ROOT, ".build", "image-manifest.json");
  return existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : {};
}

function gitModifiedDate(inputPath) {
  try {
    const absolutePath = path.isAbsolute(inputPath)
      ? inputPath
      : path.resolve(PROJECT_ROOT, inputPath);
    const relativePath = path.relative(PROJECT_ROOT, absolutePath);
    const timestamp = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", relativePath],
      { cwd: PROJECT_ROOT, encoding: "utf8" },
    ).trim();
    return timestamp || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function gitBuildTimestamp() {
  try {
    const timestamp = execFileSync(
      "git",
      ["log", "-1", "--format=%cI"],
      { cwd: PROJECT_ROOT, encoding: "utf8" },
    ).trim();
    return new Date(timestamp).toISOString().replaceAll(/[-:]/g, "").replace(".000", "");
  } catch {
    return new Date().toISOString().replaceAll(/[-:]/g, "").replace(".000", "");
  }
}

export default function configureEleventy(eleventyConfig) {
  const imageManifest = readImageManifest();
  eleventyConfig.addPassthroughCopy({ ".build/css": "css" });
  eleventyConfig.addPassthroughCopy({ ".build/images": "images" });
  for (const scriptName of [
    "agenda.js",
    "app.js",
    "calendar-button.js",
    "contact.js",
    "gallery.js",
    "map.js",
  ]) {
    eleventyConfig.addPassthroughCopy({
      [`src/assets/js/${scriptName}`]: `js/${scriptName}`,
    });
  }
  eleventyConfig.addPassthroughCopy({ ".build/docs": "docs" });
  eleventyConfig.addPassthroughCopy({ "public/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "public/.nojekyll": ".nojekyll" });
  eleventyConfig.addPassthroughCopy({ "public/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "public/site.webmanifest": "site.webmanifest" });
  eleventyConfig.addPassthroughCopy({ "public/webmail/index.html": "webmail/index.html" });

  eleventyConfig.addGlobalData("build", () => ({
    assetVersion: readAssetVersion(),
    copyrightYear: new Date().getFullYear(),
    icsTimestamp: gitBuildTimestamp(),
  }));

  eleventyConfig.addFilter("json", (value) =>
    JSON.stringify(value)
      .replaceAll("<", "\\u003c")
      .replaceAll(">", "\\u003e")
      .replaceAll("&", "\\u0026"),
  );
  eleventyConfig.addFilter("absoluteUrl", (value, baseUrl) =>
    new URL(value, baseUrl).toString(),
  );
  eleventyConfig.addFilter("published", (values = []) =>
    values.filter((value) => value && (value.published ?? value.active ?? true)),
  );
  eleventyConfig.addFilter("calendarEvents", (values = []) =>
    values.filter((value) => value && value.published && value.includeInCalendar),
  );
  eleventyConfig.addFilter("featuredEvents", (values = []) =>
    values.filter((value) => value && value.published && value.featuredOnHome),
  );
  eleventyConfig.addFilter("activeSocialUrls", (values = []) =>
    values.filter((value) => value && value.active).map((value) => value.url),
  );
  eleventyConfig.addFilter("imageWidth", (source, fallback) => {
    const normalized = String(source || "").replace(/^\/+/, "");
    return imageManifest[normalized]?.width || fallback || "";
  });
  eleventyConfig.addFilter("imageHeight", (source, fallback) => {
    const normalized = String(source || "").replace(/^\/+/, "");
    return imageManifest[normalized]?.height || fallback || "";
  });
  eleventyConfig.addFilter("dutchDateRange", (event) => {
    const months = [
      "januari",
      "februari",
      "maart",
      "april",
      "mei",
      "juni",
      "juli",
      "augustus",
      "september",
      "oktober",
      "november",
      "december",
    ];
    const [startYear, startMonth, startDay] = event.startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = (event.endDate || event.startDate)
      .split("-")
      .map(Number);
    if (startYear === endYear && startMonth === endMonth && startDay !== endDay) {
      return `${startDay} en ${endDay} ${months[startMonth - 1]} ${startYear}`;
    }
    return `${startDay} ${months[startMonth - 1]} ${startYear}`;
  });
  eleventyConfig.addFilter("dutchDateRangeShort", (event) => {
    const months = [
      "jan",
      "feb",
      "mrt",
      "apr",
      "mei",
      "jun",
      "jul",
      "aug",
      "sept",
      "okt",
      "nov",
      "dec",
    ];
    const [startYear, startMonth, startDay] = event.startDate.split("-").map(Number);
    const [, endMonth, endDay] = (event.endDate || event.startDate).split("-").map(Number);
    if (startMonth === endMonth && startDay !== endDay) {
      return `${startDay} en ${endDay} ${months[startMonth - 1]} ${startYear}`;
    }
    return `${startDay} ${months[startMonth - 1]} ${startYear}`;
  });
  eleventyConfig.addFilter("schemaDateTime", (value) =>
    `${value}+02:00`,
  );
  eleventyConfig.addFilter("icsDateTime", (value) =>
    String(value).replaceAll("-", "").replace(":", ""),
  );
  eleventyConfig.addFilter("icsEscape", (value) =>
    String(value ?? "")
      .replaceAll("\\", "\\\\")
      .replaceAll("\n", "\\n")
      .replaceAll(",", "\\,")
      .replaceAll(";", "\\;"),
  );
  eleventyConfig.addFilter("gitModified", (inputPath) => gitModifiedDate(inputPath));
  eleventyConfig.addFilter("assetHash", (value) =>
    createHash("sha256").update(String(value)).digest("hex").slice(0, 12),
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
}
