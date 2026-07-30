# Eenmalige live cutover

Er zijn geen tussentijdse live deployments. Voer deze checklist pas uit nadat
de migratiebranch volledig groen is en de visuele verschillen handmatig zijn
goedgekeurd.

## Voor de cutover

- `npm ci`, `npm run check`, `npm run test:e2e`,
  `npm run test:visual` en `npm run test:lighthouse` slagen.
- Alle huidige URLs, ankers, WordPress-querylinks en de webmailredirect zijn
  getest.
- Alle pagina's zijn bij 1440, 1024, 390 en 360 pixels met de oude site
  vergeleken.
- De Pages CMS GitHub App heeft uitsluitend toegang tot
  `rubenschmeitz/BVB`; redacteuren zijn als collaborators uitgenodigd.
- De backend uit `integrations/google-apps-script/` is als nieuwe versie in de
  bestaande deployment gepubliceerd en de oude JSON-client blijft werken.
- Turnstile-geheimen staan alleen in Apps Script Properties.

## Branch opnemen

1. Laat `refactor/maintainable-site` via een pull request controleren.
2. Controleer dat de workflow **Website controleren** groen is.
3. Merge de losse, omkeerbare commits naar `main`.
4. Controleer dat de gewone push niet publiceert. De bestaande site blijft live.

## Eén definitieve publicatie

1. Open Pages CMS op `main`.
2. Klik **Website publiceren**.
3. Controleer in GitHub Actions dat **Website publiceren** alle tests uitvoert.
4. Controleer dat het Pages-artifact uitsluitend de inhoud van `_site/` bevat.
5. Wacht tot de deployment groen is; dit is de enige live cutover.

Als een controle faalt, blijft de laatst geslaagde deployment live. Corrigeer de
branch en start de publicatie opnieuw. Forceer geen ongeteste deployment.

## Meteen na publicatie

- Open home, agenda, galerij, NBS, over ons, verenigingen, contact en 404 op
  desktop en mobiel.
- Test navigatie, agendaweergaven, kalenderknoppen, lichtbak, tokonoma,
  kaartmarkeringen, NBS-uitklappers en toetsenbordbediening.
- Doe één echte contactinzending en controleer Sheet plus e-mail.
- Open `/sitemap.xml`, `/robots.txt`,
  `/docs/bvb_agenda_2026.ics`, `/webmail/` en oude WordPress-querylinks.
- Controleer browserconsole, HTTPS, canonical metadata, JSON-LD en gedeelde
  socialemedia-afbeeldingen.

## Herstel

Open **Actions → Website publiceren → Run workflow** en vul bij `ref` de SHA van
de laatst bekende goede commit in. Ook deze herstelversie moet alle controles
doorlopen. Voor alleen het contact-backend kiest een beheerder in Apps Script de
voorgaande bewaarde deploymentversie.
