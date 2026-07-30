# Contactformulier: beheer en veilige uitrol

De website gebruikt Google Apps Script voor opslag in Google Sheets en
e-mailmeldingen. De versie in
`integrations/google-apps-script/Code.gs` ondersteunt zowel het oude JSON-antwoord
als het nieuwe bevestigingsbericht via een verborgen iframe. Daardoor kan het
backend vóór de websitecutover worden gepubliceerd.

## Script Properties

Bewaar `TURNSTILE_SECRET_KEY` uitsluitend in **Project Settings → Script
Properties** van Apps Script. Zet geheimen nooit in GitHub. Controleer in
`CONFIG` de productiedomeinen, het verwachte Turnstile-actionveld `contact`, de
ontvanger, tabbladnaam en snelheidslimiet.

## Nieuwe backendversie publiceren

1. Open het bestaande, aan de Google Sheet gekoppelde Apps Script-project.
2. Bewaar het nummer van de huidige deploymentversie voor herstel.
3. Kopieer `Code.gs` en `appsscript.json` uit deze repository naar het project.
4. Controleer dat `TURNSTILE_SECRET_KEY` nog in Script Properties staat.
5. Maak een **nieuwe versie** binnen de bestaande web-app deployment; verander
   de `/exec`-URL niet.
6. Voer eerst een aanvraag zonder `submissionId` en `parentOrigin` uit. Die moet
   nog JSON teruggeven zodat de huidige website compatibel blijft.
7. Publiceer pas daarna de websitebranch.

Voor rollback kiest een beheerder in **Deploy → Manage deployments** de
voorgaande opgeslagen versie. Verwijder oude versies niet.

## Live acceptatietest na cutover

Voer één echt bericht uit vanaf `https://bonsai-brabant.nl/contact.html` en
controleer:

- de pagina toont alleen succes nadat Apps Script expliciet `success` meldt;
- de rij staat eenmaal in Google Sheets;
- de notificatiemail komt eenmaal aan;
- een ontbrekende/ongeldige Turnstile-token wordt geweigerd;
- een onbekende hostname of action wordt geweigerd;
- na drie aanvragen met hetzelfde e-mailadres binnen een uur volgt de
  snelheidsmelding;
- een backendfout en een timeout tonen een herstelbare fout, nooit succes.

Controleer daarnaast in de browserconsole dat het antwoord alleen van een
toegestane Google-origin komt en dat de `submissionId` overeenkomt met de
verzonden aanvraag.
