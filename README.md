# Website Bonsai Vereniging Brabant

Dit is de onderhoudbare bron van `bonsai-brabant.nl`. De zichtbare website blijft
statisch en wordt met Eleventy opgebouwd uit sjablonen en gecontroleerde
inhoudsbestanden.

## Voor redacteuren

Gebruik Pages CMS om teksten, agenda-items, foto's, bomen, sponsoren en het
NBS-programma te wijzigen. Opslaan zet de inhoud in GitHub en start controles,
maar verandert de live website niet. Klik pas daarna in Pages CMS op
**Website publiceren**.

De volledige Nederlandstalige werkwijze staat in
[`docs/website-beheer.md`](docs/website-beheer.md).

## Voor beheerders

Vereisten:

- Node.js `24.14.0`, zoals vastgelegd in `.nvmrc`;
- npm vanaf versie 11;
- exact de afhankelijkheden uit `package-lock.json`.

In een Codex-taak wordt de meegeleverde lokale Node-runtime gebruikt. Er hoeft
geen globale Node-installatie aan het systeem te worden toegevoegd. In CI wordt
dezelfde Node 24-lijn tijdelijk door de workflow geladen.

```bash
npm ci
npm run build
npm run check
npm run test:e2e
npm run test:visual
npm run test:lighthouse
```

De enige publiceerbare map is `_site/`. Bronbestanden, tests, scripts,
Apps Script-code en interne documentatie mogen nooit als Pages-artifact worden
geüpload.

## Indeling

- `src/content/`: inhoud die in Pages CMS aangepast mag worden;
- `src/pages/`: pagina-opbouw;
- `src/_includes/`: gedeelde kop, navigatie, voettekst en metadata;
- `src/assets/`: modulaire CSS en gedrags-JavaScript;
- `src/generated/`: agenda-, gallery-, ICS- en sitemapuitvoer;
- `integrations/google-apps-script/`: versiebeheer voor het contact-backend;
- `tests/`: interactie-, toegankelijkheids- en visuele regressietests;
- `public/`: kleine bestanden die ongewijzigd in `_site/` moeten komen.

`npm run build` verwijdert en herschrijft uitsluitend `.build/` en `_site/`.
Originele uploads in `images/` worden nooit door de build verwijderd.
