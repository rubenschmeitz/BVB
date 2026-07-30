# Website beheren zonder broncode te openen

## Eenmalige toegang

1. Een repositorybeheerder installeert de Pages CMS GitHub App uitsluitend voor
   `rubenschmeitz/BVB`.
2. De beheerder nodigt redacteuren als collaborator voor die repository uit.
3. Ga naar Pages CMS, meld aan met GitHub en kies de repository BVB.

Redacteuren wijzigen alleen inhoud en media via de afgeschermde formulieren.
`.pages.yml`, sjablonen, scripts en workflows blijven beheerderswerk.

## Wijzigen en opslaan

1. Kies links het gewenste onderdeel, bijvoorbeeld **Agenda**,
   **Pagina's**, **NBS**, **Sponsoren**, **Clubfoto's** of
   **Tentoonstellingsbomen**.
2. Vul de Nederlandstalige velden in. Verplichte velden hebben een melding.
3. Gebruik bij afbeeldingen een korte, veilige bestandsnaam en vul altijd een
   betekenisvolle fotobeschrijving in.
4. Zet **Publiceren** of **Tonen** alleen aan als het item compleet is.
5. Sla op.

Opslaan maakt een leesbare Git-commit op naam van de redacteur en start de
kwaliteitscontrole. Het verandert de live site nog niet.

Items worden normaal niet verwijderd. Zet **Publiceren**, **Tonen** of
**Actief** uit om ze te archiveren. Vaste IDs mogen nooit worden aangepast.

## Website publiceren

1. Wacht tot **Website controleren** op GitHub groen is.
2. Klik in Pages CMS op **Website publiceren**.
3. Bevestig de actie.
4. De website wordt opnieuw, schoon opgebouwd en volledig getest.
5. Alleen als alle controles slagen, vervangt `_site/` de huidige live website.

Bij een rode controle blijft de laatst geslaagde versie live. Open de mislukte
stap op GitHub; de foutmelding noemt doorgaans het bestand en veld. Corrigeer de
inhoud, sla opnieuw op en start daarna opnieuw **Website publiceren**.

Een gewone inhouds- of mediawijziging vergelijkt niet opnieuw alle letters en
foto's met de oude website: die verschillen zijn juist de bedoeling van de
wijziging. Aanpassingen aan vormgeving, sjablonen of scripts krijgen wel altijd
de strenge visuele vergelijking op alle pagina's en schermformaten.

## Veelvoorkomende taken

### Agenda-item toevoegen

- Maak een item met een automatisch vast ID.
- Vul startdatum, begin- en eindtijd, type, label, locatie en omschrijving in.
- **In downloadagenda** bepaalt of het item in ICS en kalenderknoppen verschijnt.
- Er mag precies één gepubliceerd item als promotie op de homepagina staan.

### Sponsor, clubfoto of boom toevoegen

- Upload eerst de afbeelding bij het passende onderdeel.
- Vul een beschrijving in die vertelt wat er zichtbaar is; “foto” is niet
  voldoende.
- De publicatiecontrole weigert ontbrekende afbeeldingen, onveilige namen,
  bestanden boven 20 MB en afbeeldingen boven 12.000 pixels.
- De originele upload blijft bewaard. De build maakt daarnaast een begrensde
  WebP-versie en verwijdert nooit een upload.

### NBS-programma wijzigen

Werk programmadagen, tijdschema, demonstratoren, praktische informatie en flyer
bij via **NBS**. Controleer kalenderdatums en de PDF-koppeling voor publicatie.

## Jaarlijkse rollover

1. Archiveer afgelopen agenda-items door **Publiceren** uit te zetten.
2. Voeg nieuwe data toe en controleer begin- en eindtijden.
3. Werk het NBS-programma, de flyer en demonstratoren bij.
4. Controleer contactgegevens, locatie, sponsoren en socialemedia-links.
5. Voer **Website publiceren** uit en controleer agenda, ICS, sitemap en
   kalenderknoppen op de live site.

De kalenderbestandsnaam blijft bewust gelijk zodat bestaande links niet breken.

## Herstellen

Een beheerder kan in GitHub bij **Actions → Website publiceren → Run workflow**
een eerdere commit-SHA of tag invullen in **ref**. Dezelfde controles worden
uitgevoerd voordat die versie wordt gepubliceerd. Een foutieve inhoudscommit kan
ook met een nieuwe herstelcommit worden teruggedraaid; verwijder geen geschiedenis
en force-push niet.
