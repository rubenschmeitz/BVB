import { readdir, readFile } from "node:fs/promises";

const collectionNames = [
  "events",
  "sponsors",
  "clubGallery",
  "trees",
  "honoraryMembers",
  "associations"
];

function sortCollection(name, values) {
  if (name === "events") {
    return values.sort((left, right) =>
      `${left.startDate}T${left.startTime}`.localeCompare(`${right.startDate}T${right.startTime}`)
    );
  }
  if (name === "sponsors" || name === "trees") {
    return values.sort((left, right) => (left.order || 999) - (right.order || 999));
  }
  if (name === "clubGallery") {
    return values.sort((left, right) =>
      String(left.title).localeCompare(String(right.title), "nl", { numeric: true })
    );
  }
  return values;
}

const entries = await Promise.all(
  collectionNames.map(async (name) => {
    const directory = new URL(`../content/entries/${name}/`, import.meta.url);
    const fileNames = (await readdir(directory))
      .filter((fileName) => fileName.endsWith(".json"))
      .sort();
    const values = await Promise.all(
      fileNames.map(async (fileName) =>
        JSON.parse(await readFile(new URL(fileName, directory), "utf8"))
      )
    );
    return [name, sortCollection(name, values)];
  })
);

export default Object.fromEntries(entries);
