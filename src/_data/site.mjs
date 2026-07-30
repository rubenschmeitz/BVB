import { readFile } from "node:fs/promises";

const core = JSON.parse(
  await readFile(new URL("../config/site-core.json", import.meta.url), "utf8")
);
const globalSettings = JSON.parse(
  await readFile(new URL("../content/settings/global.json", import.meta.url), "utf8")
);

export default {
  ...core,
  ...globalSettings,
  contact: {
    ...core.contact,
    ...globalSettings.contact
  }
};
