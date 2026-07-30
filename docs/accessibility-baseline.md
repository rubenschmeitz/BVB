# Toegankelijkheidsbaseline en visuele gelijkheid

De oude website heeft op iedere pagina bestaande WCAG-kleurcontrastmeldingen.
Onder andere de vaste klei-accentkleur, gedempte voettekst en decoratieve
404-cijfers halen de automatische AA-grens niet.

Deze migratie verandert die kleuren niet, omdat de opdracht zichtbare
gelijkheid boven onderhoudsopschoning en restyling plaatst. De pixeltests
bewaken die keuze op vier schermbreedtes.

De geautomatiseerde toegankelijkheidstest:

- scant iedere openbare pagina volledig met axe;
- maskeert uitsluitend externe kaart-, Turnstile- en kalendercomponenten;
- weigert alle nieuwe `serious` en `critical` bevindingen;
- behandelt alleen de bestaande regel `color-contrast` als vastgelegde
  parity-uitzondering.

Een latere, apart goedgekeurde ontwerpwijziging kan de kleuren verbeteren. Leg
dan eerst nieuwe screenshots vast, verwijder de uitzondering pas nadat alle
contrastmeldingen zijn opgelost en laat die wijziging niet ongemerkt onderdeel
van regulier inhoudsbeheer worden.
