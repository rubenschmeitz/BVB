# Go-live checklist voor bonsai-brabant.nl

Deze checklist is bedoeld voor de verhuizing van de oude WordPress-hosting naar GitHub Pages, met behoud van het domein `bonsai-brabant.nl`.

## 1. Voorbereiding in deze repository

- `CNAME` moet exact dit bevatten:
  `bonsai-brabant.nl`
- `robots.txt` moet verwijzen naar:
  `https://bonsai-brabant.nl/sitemap.xml`
- `sitemap.xml`, canonical tags, Open Graph tags en structured data moeten `https://bonsai-brabant.nl` gebruiken.
- Commit en push de laatste wijzigingen naar `main`, zodat de GitHub Pages workflow opnieuw publiceert.

## 2. GitHub Pages instellen

Ga naar de repository `rubenschmeitz/BVB` op GitHub.

1. Open `Settings`.
2. Ga naar `Pages`.
3. Controleer dat de bron via GitHub Actions/publicatie van deze repository loopt.
4. Zet `Custom domain` op:
   `bonsai-brabant.nl`
5. Sla op.
6. Als GitHub om verificatie vraagt, voeg de voorgestelde TXT-record toe bij je DNS-provider.
7. Wacht tot GitHub het domein accepteert.
8. Zet daarna `Enforce HTTPS` aan zodra die optie beschikbaar is.

## 3. DNS aanpassen bij je host

Laat mailrecords staan. Verwijder of wijzig alleen de website-records.

Verwijderen:

- Root `A` naar `5.254.117.242`
- Root `AAAA` naar `2a03:5180:7:2::2`
- Wildcard `* A` naar `5.254.117.242`, tenzij je die bewust nog voor subdomeinen gebruikt

Toevoegen voor het rootdomein `bonsai-brabant.nl`:

| Naam | Type | Waarde |
| --- | --- | --- |
| leeg / `@` | A | `185.199.108.153` |
| leeg / `@` | A | `185.199.109.153` |
| leeg / `@` | A | `185.199.110.153` |
| leeg / `@` | A | `185.199.111.153` |
| leeg / `@` | AAAA | `2606:50c0:8000::153` |
| leeg / `@` | AAAA | `2606:50c0:8001::153` |
| leeg / `@` | AAAA | `2606:50c0:8002::153` |
| leeg / `@` | AAAA | `2606:50c0:8003::153` |

Toevoegen voor `www`:

| Naam | Type | Waarde |
| --- | --- | --- |
| `www` | CNAME | `rubenschmeitz.github.io` |

Laat deze records staan:

- MX-records
- SPF TXT
- DKIM-records
- `_dmarc`
- `eprov`
- andere mail/authenticatie-records

## 4. Controle na DNS-wijziging

Controleer na enkele minuten:

- `https://bonsai-brabant.nl`
- `https://www.bonsai-brabant.nl`
- `https://bonsai-brabant.nl/sitemap.xml`
- `https://bonsai-brabant.nl/robots.txt`

De live site hoort door GitHub te worden geserveerd. Je ziet dan niet meer `server: LiteSpeed` in de headers.

## 5. Google Search Console

1. Open Google Search Console.
2. Controleer dat `bonsai-brabant.nl` nog geverifieerd is.
3. Dien opnieuw deze sitemap in:
   `https://bonsai-brabant.nl/sitemap.xml`
4. Gebruik URL-inspectie voor:
   `https://bonsai-brabant.nl/`
5. Vraag indexering aan als Google de nieuwe versie nog niet heeft opgehaald.

Gebruik geen `Change of Address`, want het domein blijft hetzelfde. Dit is een hostingmigratie, geen domeinverhuizing.

## 6. Oude WordPress-links

De nieuwe site vangt deze oude WordPress-links client-side op:

- `/?page_id=36` -> `/`
- `/?page_id=100` -> `/contact.html`
- `/?page_id=108` -> `/vereniging.html`
- `/?page_id=155` -> `/agenda.html`
- `/?post_type=tribe_events` -> `/agenda.html`

Voor maximale SEO zijn echte server-side `301` redirects beter. GitHub Pages ondersteunt dat niet zelf. Als deze oude links belangrijk blijken in Google Search Console, gebruik dan later Cloudflare, Netlify, Vercel of tijdelijke oude hostingregels voor echte `301` redirects.
