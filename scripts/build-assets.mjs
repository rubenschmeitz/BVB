import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const root = path.resolve(".");
const buildRoot = path.join(root, ".build");
const imageOutputRoot = path.join(buildRoot, "images");

await mkdir(path.join(buildRoot, "css"), { recursive: true });
await mkdir(path.join(buildRoot, "docs"), { recursive: true });
await mkdir(imageOutputRoot, { recursive: true });

const cssEntry = await readFile("src/assets/css/index.css", "utf8");
const imports = Array.from(cssEntry.matchAll(/@import\s+["'](.+?)["'];/g), (match) => match[1]);
if (!imports.length) throw new Error("Geen CSS-modules gevonden in src/assets/css/index.css");

const cssParts = await Promise.all(
  imports.map((relativePath) =>
    readFile(path.resolve("src/assets/css", relativePath), "utf8")
  )
);
const compiledCss = cssParts.join("");
await writeFile(path.join(buildRoot, "css", "index.css"), compiledCss, "utf8");

const { stdout: trackedImageOutput } = await execFileAsync(
  "git",
  ["ls-files", "-z", "--", "images"],
  { cwd: root, encoding: "buffer", maxBuffer: 10 * 1024 * 1024 }
);
const trackedImages = trackedImageOutput
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .filter((fileName) => !fileName.toLowerCase().endsWith("desktop.ini"));

const supportedRaster = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const passthrough = new Set([".svg", ".gif"]);
const imageManifest = {};
const outputImagePaths = new Map();

for (const sourcePath of trackedImages) {
  const extension = path.extname(sourcePath).toLowerCase();
  if (!supportedRaster.has(extension) && !passthrough.has(extension)) {
    throw new Error(`Niet-ondersteund afbeeldingstype: ${sourcePath}`);
  }

  const source = path.resolve(sourcePath);
  const relativeImagePath = normalizeSafeImagePath(path.relative("images", sourcePath));
  const normalizedKey = relativeImagePath.toLowerCase();
  if (outputImagePaths.has(normalizedKey)) {
    throw new Error(
      `Afbeeldingsnamen komen na veilige normalisatie overeen: ${sourcePath} en ${outputImagePaths.get(normalizedKey)}`
    );
  }
  outputImagePaths.set(normalizedKey, sourcePath);
  const destination = path.join(imageOutputRoot, relativeImagePath);
  await mkdir(path.dirname(destination), { recursive: true });

  const sourceBytes = await readFile(source);
  if (sourceBytes.byteLength > 20 * 1024 * 1024) {
    throw new Error(`Afbeelding is groter dan 20 MB: ${sourcePath}`);
  }

  await copyFile(source, destination);

  if (supportedRaster.has(extension)) {
    const metadata = await sharp(sourceBytes).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error(`Afmetingen konden niet worden gelezen: ${sourcePath}`);
    }
    if (metadata.width > 12000 || metadata.height > 12000) {
      throw new Error(`Afbeelding is groter dan 12000 pixels: ${sourcePath}`);
    }

    const optimizedRelative = path.join(
      "_optimized",
      relativeImagePath.replace(/\.(jpe?g|png|webp)$/i, ".webp")
    );
    const optimizedDestination = path.join(imageOutputRoot, optimizedRelative);
    await mkdir(path.dirname(optimizedDestination), { recursive: true });

    const optimized = await sharp(sourceBytes)
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();
    await writeFile(optimizedDestination, optimized);

    const optimizedMetadata = await sharp(optimized).metadata();
    imageManifest[sourcePath.replaceAll("\\", "/")] = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      public: `images/${relativeImagePath.replaceAll("\\", "/")}`,
      optimized: `images/${optimizedRelative.replaceAll("\\", "/")}`,
      optimizedWidth: optimizedMetadata.width,
      optimizedHeight: optimizedMetadata.height
    };
  } else {
    imageManifest[sourcePath.replaceAll("\\", "/")] = {
      format: extension.slice(1),
      public: `images/${relativeImagePath.replaceAll("\\", "/")}`,
      optimized: null
    };
  }
}

await writeFile(
  path.join(buildRoot, "image-manifest.json"),
  `${JSON.stringify(imageManifest, null, 2)}\n`,
  "utf8"
);

const { stdout: trackedDocumentOutput } = await execFileAsync(
  "git",
  ["ls-files", "-z", "--", "docs"],
  { cwd: root, encoding: "buffer", maxBuffer: 1024 * 1024 }
);
for (const sourcePath of trackedDocumentOutput.toString("utf8").split("\0").filter(Boolean)) {
  if (path.extname(sourcePath).toLowerCase() !== ".pdf") continue;
  const relativeDocumentPath = path.relative("docs", sourcePath);
  if (!/^[A-Za-z0-9._/-]+$/.test(relativeDocumentPath.replaceAll("\\", "/"))) {
    throw new Error(`Documentnaam bevat onveilige tekens: ${sourcePath}`);
  }
  const destination = path.join(buildRoot, "docs", relativeDocumentPath);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.resolve(sourcePath), destination);
}

function normalizeSafeImagePath(relativePath) {
  return relativePath
    .replaceAll("\\", "/")
    .split("/")
    .map((segment) => {
      const extension = path.extname(segment);
      const stem = segment.slice(0, Math.max(0, segment.length - extension.length));
      const safeStem = stem
        .normalize("NFKD")
        .replaceAll(/[\u0300-\u036f]/g, "")
        .replaceAll(/[^A-Za-z0-9._-]+/g, "-")
        .replaceAll(/-+/g, "-")
        .replaceAll(/^[-.]+|[-.]+$/g, "");
      if (!safeStem) throw new Error(`Afbeeldingsnaam kan niet veilig worden gemaakt: ${relativePath}`);
      return `${safeStem}${extension.toLowerCase()}`;
    })
    .join("/");
}

const { stdout: versionedFileOutput } = await execFileAsync(
  "git",
  ["ls-files", "-z", "--", "src/assets/js", "src/content", "src/_data", "src/generated", "src/config"],
  { cwd: root, encoding: "buffer", maxBuffer: 10 * 1024 * 1024 }
);
const versionedFiles = versionedFileOutput.toString("utf8").split("\0").filter(Boolean).sort();
const versionHash = createHash("sha256").update(compiledCss);
for (const fileName of versionedFiles) {
  versionHash.update(fileName);
  versionHash.update(await readFile(fileName));
}
await writeFile(
  path.join(buildRoot, "asset-version.txt"),
  `${versionHash.digest("hex").slice(0, 12)}\n`,
  "utf8"
);
