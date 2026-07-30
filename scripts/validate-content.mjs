import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv";
import { parse as parseYaml } from "yaml";

const root = path.resolve(".");
const errors = [];
const ajv = new Ajv({ allErrors: true, strict: false });

const uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
const timePattern = "^([01]\\d|2[0-3]):[0-5]\\d$";
const datePattern = "^\\d{4}-\\d{2}-\\d{2}$";

const commonEntryProperties = {
  id: { type: "string", pattern: uuidPattern }
};

const schemas = {
  events: {
    type: "object",
    additionalProperties: true,
    required: [
      "id",
      "title",
      "startDate",
      "startTime",
      "endTime",
      "location",
      "type",
      "tag",
      "description",
      "published",
      "includeInCalendar"
    ],
    properties: {
      ...commonEntryProperties,
      title: { type: "string", minLength: 3, maxLength: 160 },
      startDate: { type: "string", pattern: datePattern },
      endDate: { type: "string", pattern: datePattern },
      startTime: { type: "string", pattern: timePattern },
      endTime: { type: "string", pattern: timePattern },
      location: { type: "string", minLength: 2 },
      type: { enum: ["club", "nbv", "event"] },
      tag: { type: "string", minLength: 2, maxLength: 40 },
      description: { type: "string", minLength: 20 },
      published: { type: "boolean" },
      includeInCalendar: { type: "boolean" },
      featuredOnHome: { type: "boolean" },
      homePromotion: {
        type: "object",
        required: ["title", "copyAfterDate", "image", "alt", "linkLabel"],
        properties: {
          title: { type: "string", minLength: 3 },
          copyAfterDate: { type: "string", minLength: 20 },
          image: { type: "string" },
          alt: { type: "string", minLength: 8 },
          linkLabel: { type: "string", minLength: 3 }
        }
      }
    },
    allOf: [
      {
        if: { properties: { featuredOnHome: { const: true } }, required: ["featuredOnHome"] },
        then: { required: ["homePromotion", "detailsUrl"] }
      }
    ]
  },
  sponsors: {
    type: "object",
    required: ["id", "name", "url", "image", "alt", "variant", "published"],
    properties: {
      ...commonEntryProperties,
      name: { type: "string", minLength: 2 },
      url: { type: "string", pattern: "^https?://" },
      image: { type: "string" },
      alt: { type: "string", minLength: 3 },
      variant: { enum: ["landscape", "portrait"] },
      published: { type: "boolean" }
    }
  },
  clubGallery: {
    type: "object",
    required: ["id", "title", "src", "alt", "published"],
    properties: {
      ...commonEntryProperties,
      title: { type: "string", minLength: 3 },
      src: { type: "string" },
      alt: { type: "string", minLength: 12 },
      published: { type: "boolean" }
    }
  },
  trees: {
    type: "object",
    required: [
      "id",
      "species",
      "style",
      "image",
      "alt",
      "realHeightCm",
      "background",
      "scrollSide",
      "treeSide",
      "positionLeft",
      "positionBottom",
      "positionHeight",
      "published"
    ],
    properties: {
      ...commonEntryProperties,
      species: { type: "string", minLength: 3 },
      style: { type: "string", minLength: 3 },
      image: { type: "string" },
      alt: { type: "string", minLength: 8 },
      realHeightCm: { type: "number", minimum: 5, maximum: 300 },
      background: { type: "string", pattern: "^bg_(left|right)_[a-z_]+\\.png$" },
      scrollSide: { enum: ["left", "right"] },
      treeSide: { enum: ["left", "right"] },
      positionLeft: { type: "string", pattern: "^\\d{1,3}%$" },
      positionBottom: { type: "number", minimum: 0, maximum: 100 },
      positionHeight: { type: "number", minimum: 1, maximum: 100 },
      published: { type: "boolean" }
    }
  },
  honoraryMembers: {
    type: "object",
    required: ["id", "name", "label", "image", "alt", "biography", "active"],
    properties: {
      ...commonEntryProperties,
      name: { type: "string", minLength: 3 },
      label: { type: "string", minLength: 3 },
      image: { type: "string" },
      alt: { type: "string", minLength: 3 },
      biography: { type: "string", minLength: 30 },
      active: { type: "boolean" }
    }
  },
  associations: {
    type: "object",
    required: ["id", "name", "town", "url", "x", "y", "featured", "active"],
    properties: {
      ...commonEntryProperties,
      name: { type: "string", minLength: 3 },
      town: { type: "string", minLength: 2 },
      url: { type: "string", minLength: 3 },
      x: { type: "number", minimum: 0, maximum: 200 },
      y: { type: "number", minimum: 0, maximum: 236 },
      featured: { type: "boolean" },
      active: { type: "boolean" }
    }
  }
};

const entriesByCollection = {};
const seenIds = new Map();

for (const [collectionName, schema] of Object.entries(schemas)) {
  const directory = path.join(root, "src", "content", "entries", collectionName);
  const fileNames = (await readdir(directory)).filter((fileName) => fileName.endsWith(".json"));
  const validate = ajv.compile(schema);
  entriesByCollection[collectionName] = [];

  for (const fileName of fileNames) {
    const relativePath = path.relative(root, path.join(directory, fileName));
    const value = await readJson(relativePath);
    if (!value) continue;
    entriesByCollection[collectionName].push(value);

    if (!validate(value)) {
      for (const issue of validate.errors || []) {
        errors.push(`${relativePath}${issue.instancePath || ""}: ${issue.message}`);
      }
    }

    if (value.id) {
      if (seenIds.has(value.id)) {
        errors.push(`${relativePath}: dubbel ID, ook gebruikt in ${seenIds.get(value.id)}`);
      } else {
        seenIds.set(value.id, relativePath);
      }
    }
  }
}

const pageDirectory = path.join(root, "src", "content", "pages");
for (const fileName of (await readdir(pageDirectory)).filter((name) => name.endsWith(".json"))) {
  const relativePath = path.relative(root, path.join(pageDirectory, fileName));
  const page = await readJson(relativePath);
  if (!page) continue;
  if (!page.seo?.title || !page.seo?.description || !page.seo?.socialImage) {
    errors.push(`${relativePath}: SEO-titel, omschrijving en deelafbeelding zijn verplicht`);
  }
  if (fileName !== "error.json" && (!page.hero?.title || !page.hero?.className)) {
    errors.push(`${relativePath}: paginatitel en vaste hero-vormgeving zijn verplicht`);
  }
  validatePlainContent(page, relativePath);
  await validateMediaReferences(page, relativePath);
}

const globalSettings = await readJson("src/content/settings/global.json");
if (!globalSettings?.contact?.email || !globalSettings?.venue?.name) {
  errors.push("src/content/settings/global.json: contact en locatie zijn verplicht");
}
validatePlainContent(globalSettings, "src/content/settings/global.json");

for (const [collectionName, values] of Object.entries(entriesByCollection)) {
  for (const [index, value] of values.entries()) {
    const source = `src/content/entries/${collectionName} (item ${index + 1})`;
    validatePlainContent(value, source);
    await validateMediaReferences(value, source);
  }
}

for (const event of entriesByCollection.events) {
  if (!isRealDate(event.startDate)) errors.push(`Agenda-item "${event.title}": ongeldige startdatum`);
  if (event.endDate && !isRealDate(event.endDate)) errors.push(`Agenda-item "${event.title}": ongeldige einddatum`);
  if (event.endDate && event.endDate < event.startDate) {
    errors.push(`Agenda-item "${event.title}": einddatum ligt voor startdatum`);
  }
}

const featuredEvents = entriesByCollection.events.filter((event) => event.published && event.featuredOnHome);
if (featuredEvents.length !== 1) {
  errors.push(`Er moet precies één gepubliceerd agenda-item op home staan; gevonden: ${featuredEvents.length}`);
}

const featuredAssociations = entriesByCollection.associations.filter(
  (association) => association.active && association.featured
);
if (featuredAssociations.length !== 1) {
  errors.push(`Er moet precies één actieve BVB-marker zijn; gevonden: ${featuredAssociations.length}`);
}

const cmsConfig = parseYaml(await readFile(".pages.yml", "utf8"));
if (!cmsConfig?.actions?.some((action) => action.label === "Website publiceren")) {
  errors.push(".pages.yml: de actie 'Website publiceren' ontbreekt");
}
for (const collectionName of ["events", "sponsors", "club-photos", "trees", "honorary-members", "associations"]) {
  const entry = findCmsEntry(cmsConfig.content || [], collectionName);
  if (!entry) {
    errors.push(`.pages.yml: CMS-onderdeel ${collectionName} ontbreekt`);
    continue;
  }
  if (entry.operations?.rename !== false || entry.operations?.delete !== false) {
    errors.push(`.pages.yml: hernoemen en verwijderen moeten uitstaan voor ${collectionName}`);
  }
}

const qualityWorkflowSource = await readFile(".github/workflows/quality.yml", "utf8");
const publishWorkflowSource = await readFile(".github/workflows/publish.yml", "utf8");
const dependabotSource = await readFile(".github/dependabot.yml", "utf8");
const qualityWorkflow = parseYaml(qualityWorkflowSource);
const publishWorkflow = parseYaml(publishWorkflowSource);
parseYaml(dependabotSource);

if (
  !qualityWorkflow?.on ||
  !Object.hasOwn(qualityWorkflow.on, "push") ||
  !Object.hasOwn(qualityWorkflow.on, "pull_request")
) {
  errors.push(".github/workflows/quality.yml: controles moeten bij pushes en pull requests draaien");
}
if (/deploy-pages/.test(qualityWorkflowSource)) {
  errors.push(".github/workflows/quality.yml: de gewone kwaliteitsworkflow mag niet publiceren");
}
if (publishWorkflow?.on?.push) {
  errors.push(".github/workflows/publish.yml: gewone pushes mogen niet publiceren");
}
if (!publishWorkflow?.on?.workflow_dispatch?.inputs?.payload) {
  errors.push(".github/workflows/publish.yml: Pages CMS payload-input ontbreekt");
}
if (!/actions\/upload-pages-artifact@v4/.test(publishWorkflowSource) || !/path:\s*_site/.test(publishWorkflowSource)) {
  errors.push(".github/workflows/publish.yml: alleen _site moet als Pages-artifact worden geüpload");
}
if (!/actions\/deploy-pages@v4/.test(publishWorkflowSource)) {
  errors.push(".github/workflows/publish.yml: de expliciete Pages-publicatiestap ontbreekt");
}

if (errors.length) {
  console.error(`Inhoudscontrole mislukt met ${errors.length} fout(en):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const entryCount = Object.values(entriesByCollection).reduce((total, values) => total + values.length, 0);
  console.log(`Inhoudscontrole geslaagd: ${entryCount} collectie-items en alle pagina-instellingen zijn geldig.`);
}

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(relativePath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: ongeldige JSON (${error.message})`);
    return null;
  }
}

function validatePlainContent(value, source, trail = "") {
  if (typeof value === "string" && /<[^>]*>/.test(value)) {
    errors.push(`${source}${trail}: HTML is niet toegestaan in beheerde inhoud`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validatePlainContent(item, source, `${trail}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      validatePlainContent(child, source, `${trail}.${key}`);
    }
  }
}

async function validateMediaReferences(value, source, trail = "") {
  if (Array.isArray(value)) {
    await Promise.all(value.map((item, index) => validateMediaReferences(item, source, `${trail}[${index}]`)));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const childTrail = `${trail}.${key}`;
    if (typeof child === "string" && ["image", "src", "socialImage", "flyer"].includes(key)) {
      const normalized = child.replace(/^\/+/, "");
      if (!/^[A-Za-z0-9._/-]+$/.test(normalized)) {
        errors.push(`${source}${childTrail}: bestandsnaam bevat onveilige tekens`);
        continue;
      }
      try {
        const fileStat = await stat(path.join(root, normalized));
        if (!fileStat.isFile()) throw new Error("geen bestand");
        if (fileStat.size > 20 * 1024 * 1024) {
          errors.push(`${source}${childTrail}: bestand is groter dan 20 MB`);
        }
      } catch {
        errors.push(`${source}${childTrail}: bestand bestaat niet (${normalized})`);
      }
      if ((key === "image" || key === "src") && !value.alt) {
        errors.push(`${source}${trail}: betekenisvolle alt-tekst ontbreekt`);
      }
    }
    await validateMediaReferences(child, source, childTrail);
  }
}

function isRealDate(value) {
  if (!datePattern || !/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function findCmsEntry(entries, name) {
  for (const entry of entries) {
    if (entry.name === name) return entry;
    const nested = findCmsEntry(entry.items || [], name);
    if (nested) return nested;
  }
  return null;
}
