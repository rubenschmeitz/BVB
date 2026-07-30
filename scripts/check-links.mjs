import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const siteRoot = path.resolve("_site");
const errors = [];
const htmlFiles = await walk(siteRoot, (fileName) => fileName.endsWith(".html"));
const allOutputFiles = new Set(
  (await walk(siteRoot, () => true)).map((fileName) => path.relative(siteRoot, fileName).replaceAll("\\", "/"))
);
const anchorsByFile = new Map();

for (const fileName of htmlFiles) {
  const html = await readFile(fileName, "utf8");
  const relativeFile = path.relative(siteRoot, fileName).replaceAll("\\", "/");
  const ids = new Set(Array.from(html.matchAll(/\sid=["']([^"']+)["']/g), (match) => match[1]));
  anchorsByFile.set(relativeFile, ids);
}

for (const fileName of htmlFiles) {
  const html = await readFile(fileName, "utf8");
  const relativeFile = path.relative(siteRoot, fileName).replaceAll("\\", "/");
  const references = Array.from(
    html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g),
    (match) => match[1]
  );

  for (const reference of references) {
    if (
      !reference ||
      reference.startsWith("#") ||
      /^(https?:|mailto:|tel:|data:|javascript:)/i.test(reference)
    ) {
      if (reference.startsWith("#") && reference.length > 1 && !anchorsByFile.get(relativeFile)?.has(reference.slice(1))) {
        errors.push(`${relativeFile}: anker ontbreekt (${reference})`);
      }
      continue;
    }

    const [withoutHash, hash = ""] = reference.split("#", 2);
    const withoutQuery = withoutHash.split("?", 1)[0];
    const baseDirectory = path.posix.dirname(relativeFile);
    const resolved = path.posix.normalize(path.posix.join(baseDirectory, withoutQuery || relativeFile));
    const target = resolved.endsWith("/") ? `${resolved}index.html` : resolved;

    if (!allOutputFiles.has(target)) {
      errors.push(`${relativeFile}: verwijzing bestaat niet (${reference})`);
      continue;
    }
    if (hash && target.endsWith(".html") && !anchorsByFile.get(target)?.has(hash)) {
      errors.push(`${relativeFile}: anker bestaat niet (${reference})`);
    }
  }
}

const css = await readFile(path.join(siteRoot, "css", "index.css"), "utf8");
for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  const reference = match[1];
  if (/^(data:|https?:)/i.test(reference)) continue;
  const target = path.posix.normalize(path.posix.join("css", reference.split("?")[0]));
  if (!allOutputFiles.has(target)) errors.push(`css/index.css: afbeelding bestaat niet (${reference})`);
}

const forbiddenExtensions = [".gs", ".md", ".mjs", ".py", ".yml", ".yaml"];
const forbiddenFileNames = new Set([".DS_Store", "desktop.ini", "Thumbs.db"]);
for (const outputFile of allOutputFiles) {
  if (forbiddenFileNames.has(path.basename(outputFile))) {
    errors.push(`Besturingssysteembestand is ten onrechte gepubliceerd: ${outputFile}`);
  }
  if (forbiddenExtensions.includes(path.extname(outputFile).toLowerCase())) {
    errors.push(`Intern bronbestand is ten onrechte gepubliceerd: ${outputFile}`);
  }
}

for (const requiredFile of [
  "CNAME",
  ".nojekyll",
  "robots.txt",
  "404.html",
  "site.webmanifest",
  "sitemap.xml",
  "docs/NBS_Flyer_2026.pdf",
  "docs/bvb_agenda_2026.ics",
  "webmail/index.html"
]) {
  if (!allOutputFiles.has(requiredFile)) errors.push(`Verplicht publicatiebestand ontbreekt: ${requiredFile}`);
}

if (errors.length) {
  console.error(`Interne-linkcontrole mislukt met ${errors.length} fout(en):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Interne-linkcontrole geslaagd voor ${htmlFiles.length} HTML-pagina's.`);
}

async function walk(directory, include) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walk(fullPath, include));
    } else if (include(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}
