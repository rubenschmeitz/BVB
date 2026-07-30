import { readFile } from "node:fs/promises";

const pageNames = [
  "home",
  "agenda",
  "gallery",
  "nbs",
  "about",
  "associations",
  "contact",
  "error"
];

const pageEntries = await Promise.all(
  pageNames.map(async (name) => {
    const source = new URL(`../content/pages/${name}.json`, import.meta.url);
    return [name, JSON.parse(await readFile(source, "utf8"))];
  })
);

export default Object.fromEntries(pageEntries);
