import { readdir, rm } from "node:fs/promises";
import path from "node:path";

const siteRoot = path.resolve("_site");
const operatingSystemFiles = new Set([
  ".DS_Store",
  "desktop.ini",
  "Thumbs.db"
]);

let removed = 0;
await removeOperatingSystemFiles(siteRoot);
console.log(`Publicatie-uitvoer opgeschoond: ${removed} systeembestand(en) verwijderd.`);

async function removeOperatingSystemFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeOperatingSystemFiles(fullPath);
    } else if (operatingSystemFiles.has(entry.name)) {
      await rm(fullPath, { force: true });
      removed += 1;
    }
  }
}
