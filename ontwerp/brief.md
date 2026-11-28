# Brief voor Claude Code: Londen 1888 — Het Kaartspel

*Opgesteld op 26 november 2026, na een ontwerpgesprek met Frédéric. Dit document is de opdracht. Lees het helemaal voordat je begint.*

## 0. In één alinea

Bouw een **roguelike deckbuilder** in de geest van *Wildfrost* (en een beetje *Slay the Spire*), gespeeld in de wereld van ons eerdere spel **Londen 1888** (repo `zeddyfree-art/londen-1888`). Je kiest een klasse (Kennis, Waarneming, Kracht of Charisma) en een held die op het slagveld staat als leider. Je trekt door een nacht in Londen over een kaart met knooppunten (gevechten, winkels, rust, ontmoetingen), breidt je stapel uit en verslaat aan het eind één ontwakende oude god. Het gevecht draait niet om mana maar om **tellers** (slagen van de klok): kaarten zijn gratis, maar elke kaart op het veld slaat pas toe als haar teller op 0 staat. De horror-kern is **Verlichting**: occulte kaarten worden sterker als je Geest onder de helft zakt. Alles is Nederlands, draait als PWA op iPad en laptop, en hergebruikt zoveel mogelijk de art, lore, muziek en data van Londen 1888.

---

## 1. Werkafspraken

- **Nieuwe repo:** `zeddyfree-art/londen-1888-kaartspel`. Titel in het spel: **Londen 1888: Het Kaartspel**.
- **Alle teksten in het spel zijn Nederlands.** Code, bestandsnamen en data-sleutels ook Nederlands, net als in Londen 1888.
- **Na elke aanpassing:** een pull request naar `main` maken en die zelf mergen. Een GitHub Actions-workflow bouwt de site en zet hem op GitHub Pages (neem `.github/workflows/pages.yml` en `tools/bouw.js` uit Londen 1888 als voorbeeld).
- **Bij elke update die spelers merken:** een nieuw bericht bovenaan `data/nieuws.json` (hoger `id`), getoond als *Wat is er nieuw*, en een regel in `ontwerp/te-doen.md`.
- **Zet deze afspraken in een `CLAUDE.md`** in de nieuwe repo.
- **Bronnen:** clone `zeddyfree-art/londen-1888` naast de nieuwe repo. Lees vooral `lore/`, `data/`, `ontwerp/beeldopdracht.md`, `ontwerp/geluidsopdracht.md`, `ontwerp/keuzes.md` en `tools/`.

---

## 2. Techniek

- **Vanilla JavaScript, HTML en CSS.** Geen framework, geen bundler nodig. Wel ES-modules (`<script type="module">`), zodat de spelregels los van het scherm te testen zijn.
- **Scheid motor en scherm strikt:**
  - `app/motor/` bevat de spelregels als pure functies zonder DOM. Speltoestand is één gewoon object dat je kunt opslaan als JSON. Alle toeval loopt via een **seeded RNG** (`motor/toeval.js`), zodat een run met dezelfde seed precies hetzelfde verloopt. Dat is nodig voor de testbot, voor bugs naspelen en later voor dagelijkse runs.
  - `app/scherm/` tekent de toestand en vertaalt aanrakingen naar acties (`motor.doe(toestand, actie) → nieuwe toestand + gebeurtenissen`). Het scherm speelt de gebeurtenissen af als animaties en geluiden.
- **PWA:** manifest, service worker, offline spelen, *Zet op beginscherm* op de iPad. Kopieer de opzet van Londen 1888.
- **Opslaan:** `localStorage`, met try/catch. Een lopende run kan altijd worden hervat. Meta-voortgang (ontgrendelingen, klokken, statistieken) apart opgeslagen.
- **Bediening:** eerst iPad liggend, daarna laptop. Slepen met pointer events (kaart naar een vak, bondgenoot naar het terugroepvak, kaart naar een vijand). Lang drukken of muis erboven toont de volledige kaarttekst. Kaarten **wiebelen** licht bij oppakken en slepen (de makers van Wildfrost noemen dat een groot verschil voor het spelgevoel). Respecteer `prefers-reduced-motion`.
- **Bouwen:** `node tools/bouw.js` maakt `site/`. Afbeeldingen verkleinen met een script zoals `tools/haal-art.py`.

---

## 3. Het gevecht

### 3.1 Het slagveld

Elke kant heeft **twee rijen van drie vakken**. De bovenste rij heet **Straat**, de onderste **Riool**. Het vak het dichtst bij het midden is het voorste.

```
        VIJAND                         JIJ
  achter  midden  voor  |  voor  midden  achter
 [     ][     ][     ]  |  [     ][     ][     ]   Straat
 [     ][     ][     ]  |  [     ][     ][     ]   Riool
                    Big Ben: versterking over 3 slagen
```

- Een kaart zonder bijzondere eigenschap **valt de voorste vijand in haar eigen rij aan**. Is die rij leeg, dan de voorste in de andere rij. Staat er niemand, dan raakt de aanval niets.
- Eigenschappen kunnen dat veranderen: *Salvo* (hele rij), *Scherpschutter* (kies elk doel), *Achterhoede* (achterste vijand), enzovoort.
- **Verplaatsen** van je eigen kaarten op het veld (tussen vakken en rijen) is gratis en kan onbeperkt in je beurt.

### 3.2 Tellers (slagen)

- Elke kaart op het veld heeft een **teller**, getoond als een klein klokje met een getal. Aan het eind van elke beurt gaan alle tellers 1 omlaag. Staat een teller op 0, dan **slaat de kaart toe** (aanval en/of vermogen) en springt de teller terug naar haar maximum.
- **Volgorde van toeslaan** (altijd zichtbaar als nummertjes op het veld): eerst alle vijanden, dan jouw kant. Per kant: voorste vak Straat, voorste vak Riool, middelste Straat, middelste Riool, achterste Straat, achterste Riool.
- Kaarten met een **reactie** (icoon !) slaan toe bij een gebeurtenis, bijvoorbeeld "als een bondgenoot geraakt wordt". Ze kunnen ook een teller hebben, of geen.
- Kaarten kunnen tellers versnellen (−) of vertragen (+), bij jou en bij de vijand. Dat is het hart van de puzzel.

### 3.3 Een beurt

1. Je hebt een hand van **6 kaarten**. Aan het begin van het gevecht trek je 6, daarna trek je aan het begin van elke beurt aan tot 6. Is je trekstapel leeg, dan schud je de aflegstapel.
2. Je doet **één beurtactie**:
   - **een kaart spelen**: een bondgenoot of barricade in een leeg vak zetten, of een spul, spreuk of middeltje op een doel gebruiken;
   - **het politiefluitje blazen**: je legt je hele hand af en trekt 6 nieuwe kaarten. Dit kost je beurt. Heb je het fluitje 4 beurten op rij niet gebruikt, dan is het **opgeladen** en kost het één keer geen beurt;
   - **een bondgenoot terugroepen** naar je hand: hij geneest volledig en verliest al zijn statussen. Dit kost je beurt.
3. Daarna gaan alle tellers 1 omlaag en slaat toe wat op 0 staat, in de vaste volgorde.
4. De Big Ben-teller gaat 1 omlaag. Op 0 komt de volgende **golf** vijanden binnen in lege vakken.

Er is **geen knop om een beurt over te slaan**. De makers van Wildfrost hebben die bewust weggelaten: hij voegde rommel toe zonder echte waarde.

**Zegel (kroon):** een kaart met een Zegel zit gegarandeerd in je beginhand en kost geen beurtactie om te spelen.

### 3.4 Winnen en verliezen

- Je wint het gevecht als **alle golven verslagen** zijn, of zodra een **baas** verslagen is (dan vluchten de rest).
- Je verliest de run als het **Lichaam van je held op 0** komt.
- Een bondgenoot die valt, gaat terug naar je stapel als **Gewond**: halve aanval en half leven, tot je rust bij het Ziekenhuis of een Logement. (Met de klok *Geen genade* is hij weg voor de rest van de run.)

### 3.5 Vaste woordenlijst

Consistentie is een harde eis. Leg deze termen vast in `ontwerp/woordenlijst.md` en gebruik ze overal hetzelfde:

- **Treffer:** een aanval die een doel raakt, ook als die 0 schade doet. Schade door Pest of Doorns is **geen** treffer.
- **Schade** gaat van Leven (bondgenoten, vijanden) of Lichaam (held) af.
- **Gruwel** is een tweede soort schade. Op je held gaat Gruwel van **Geest** af. Op een bondgenoot geeft elke punt Gruwel 1 **Angst**. Vijanden hebben geen Geest.
- **Toeslaan:** de teller van een kaart bereikt 0 en ze doet haar actie.
- **Spelen:** een kaart uit je hand gebruiken.
- **Afleggen, Verbannen, Trekken, Schudden.**

### 3.6 Statussen

Ze stapelen als getal op de kaart. Gebruik de fiches uit `art/fiches/` waar die er zijn; voor de rest maken we kleine iconen.

| Status | Werking | Afbouw | Thuis bij |
|---|---|---|---|
| **Mist** | Teller en reacties staan stil | −1 per beurt | Vathrûn, algemeen |
| **Pest** | Aan het eind van de beurt evenveel schade (geen treffer) | −1 per keer | Morghast |
| **Doorns** | Wie deze kaart treft, krijgt evenveel schade (geen treffer) | blijft | Ysmara, Kracht |
| **Gezegend** | Blokkeert de volgende treffer volledig | −1 per geblokkeerde treffer | Kerk, Kracht |
| **Bescherming** | Vangt schade op voordat Leven daalt | verbruikt | Kracht |
| **Vervloekt** | Volgende treffer doet dubbele schade | weg na die treffer | Nebet-Ankhu, Waarneming |
| **Inkt** | Vermogens en reacties doen niets | −1 per beurt | Yth-Nemora |
| **Bekoring** | Volgende aanval treft de eigen kant | weg na die aanval | Sirrhae, Charisma |
| **Angst** | −1 aanval per punt | −1 na elke eigen aanval | algemeen, Gruwel op bondgenoten |
| **Woede** | +1 schade per punt bij de volgende aanval | weg na die aanval | Kracht |

Begin met deze tien. Voeg er alleen een toe als een oude god er echt om vraagt.

---

## 4. Geest, Gruwel en Verlichting (de horror-kern)

- Je held heeft **Lichaam** (leven) en **Geest**. Startwaarden uit de held in Londen 1888 (zie §5.3).
- Veel monsters doen naast schade ook **Gruwel**, wat op je held van de Geest afgaat.
- **Verlichting:** occulte kaarten (vooral spreuken, artefacten en sommige bondgenoten) hebben **twee teksten**: een gewone en een **verlichte**. Zolang je Geest **boven de helft** van je maximum staat, geldt de gewone tekst. Zakt je Geest **tot of onder de helft**, dan geldt de verlichte tekst. De verlichte tekst is sterker en heeft vaak een prijs ("+3 schade, je verliest 1 Geest").
  - Laat het overschakelen zien: de kaartrand kleurt ziekelijk violet, de verlichte tekst schuift in beeld, een zacht fluisterend geluid speelt.
  - Sommige kaarten kosten bewust Geest ("Verlies 2 Geest: …"). Zo kiest de speler zelf of hij verlicht wil raken.
  - In de kaartdata: `"tekst"` en `"verlicht"` (optioneel), elk met een eigen `effect`.
- **Waanzin:** valt je Geest op 0, dan ga je **niet** dood. Er komt een **Waanzin-kaart** in je stapel (een vloek: onspeelbaar of met een nadeel, zoals "Als je deze trekt, krijgt je held 2 Angst") en je Geest herstelt tot de helft. Waanzin raak je kwijt bij de Kerk of de Kunstenaars. Maak 6 tot 8 Waanzin-kaarten, gebaseerd op de waanzin uit Londen 1888 (`data/toestanden.json`).
- Je verliest alleen door Lichaam 0.

Het doel: "hoeveel durf ik te weten?" moet een echte keuze zijn, geen tweede levensbalk.

---

## 5. Klassen en helden

### 5.1 Vier klassen

| Klasse | Rol | Kenmerkend mechaniek | Kleur van de kaartrand |
|---|---|---|---|
| **Kennis** | Occultist | **Spreuken en rituelen.** Spreuken kosten Geest, rituelen hebben een lange teller en een groot effect. Manipuleert tellers. Speelt het meest met Verlichting. | violet en goud |
| **Waarneming** | Speurder | **Aanwijzingen.** Kaarten leveren Aanwijzingen (fiche). Bij 3 Aanwijzingen mag je een **Deductie** spelen (krachtige kaarten die Aanwijzingen verbruiken). **Ontmaskeren** geeft Vervloekt en laat de teller en eigenschappen van een vijand zien. Kan op elk doel mikken. | teal |
| **Kracht** | Vechter | **Trofeeën:** een kaart die een vijand doodt, krijgt +1 aanval voor de rest van het gevecht (sommige permanent). **Barricades** (het equivalent van de clunkers), Doorns, Gezegend en Bescherming. | ossenbloedrood |
| **Charisma** | Aanvoerder | **Veel bondgenoten en Ponden.** **Overtuigen:** menselijke vijanden (cultisten, logebroeders en andere `mens`-vijanden) kunnen overlopen en worden een bondgenoot voor dit gevecht, of voorgoed met sommige kaarten. Bekoring. | amber |

Elke klasse heeft een eigen **kaartenpool van ongeveer 25 kaarten**. Daarnaast is er een gedeelde **Londen-pool van ongeveer 30 kaarten** (de revolver, laudanum, dieren, huurlingen…). Bij kaartbeloningen komt ongeveer 70% uit de eigen klasse en 30% uit Londen.

### 5.2 De 28 helden, 7 per klasse

Alle 28 helden uit Londen 1888 doen mee: de 25 uit `data/helden.json` en de 3 uit `data/oude-wereld.json` (`helden`). Portretten staan in `art/helden/`. Waarden: Kennis / Waarneming / Kracht / Charisma.

| Kennis | Waarneming | Kracht | Charisma |
|---|---|---|---|
| Professor Ambrose Pell (4/3/1/2) | Silas Rook (2/4/3/1) | Hu Yiping (1/3/4/2) | Albert Gosling (1/3/2/4) |
| Dr. Septimus Crane (4/2/1/3) | Winnie Lusk (3/4/1/2) | Sergeant Tobias Hale (1/2/4/3) | Lady Cordelia Vane (2/2/2/4) |
| Julian Hartwell (4/2/2/2) | Miss Violet Thorne (2/4/2/2) | Aggie Pruitt (2/1/4/3) | Esme Valentine (3/2/1/4) |
| Professor Khalil Nasr (4/1/2/3) | Lottie "Muis" Finch (1/4/2/3) | Daffadar Arjan Singh (1/4/4/1) | Clementine Ashby (2/3/1/4) |
| Hester Quayle (4/4/1/1) | Teresa Canul (3/4/1/2) | Ang Nima Sherpa (1/3/4/2) | Broeder Ezra Whitlock (1/2/3/4) |
| Bridie Kavanagh (3/2/2/3) | DS Owen Marsh (2/3/3/2) | Ra'is Mahmoud Fathy (2/3/3/2) | Benedict Ashcombe (3/1/2/4) |
| Pema Lhamo (3/3/3/3) | Madame Odile Fairweather (3/3/1/3) | Dr. Cornelius Bray (3/3/3/1) | Constable Paddy Flynn (1/3/3/3) |

### 5.3 Helden als leider

- Je held is een kaart op het slagveld, net als de leider in Wildfrost. Hij kan niet worden teruggeroepen.
- **Lichaam** = `3 × lichaam + 6` (dus 18 tot 30). **Geest** = `2 × geest` (dus 8 tot 16). **Aanval** en **teller** per klasse: Kennis 2 / teller 4, Waarneming 2 / teller 3, Kracht 3 / teller 3, Charisma 1 / teller 3. Deze getallen zijn een startpunt: de testbot stelt ze bij.
- Het hoogste kenmerk geeft een kleine klassebonus. Een tweede kenmerk van 3 of meer mag een kleine bijbonus geven (bijvoorbeeld Pema Lhamo, die in balans is).
- **Vermogen:** vertaal elk vermogen uit Londen 1888 naar een vermogen in dit spel, met dezelfde naam en hetzelfde gevoel. Voorstellen (mag je verfijnen):

| Held | Vermogen | Voorstel |
|---|---|---|
| Pell | Sterrenkaart | Je ziet altijd welke vijanden in de volgende golf zitten. Eén keer per gevecht: zet een vijandelijke teller +1. |
| Crane | Ontcijferen | De eerste spreuk in elk gevecht kost geen Geest. |
| Hartwell | Zwaard van licht | +1 aanval voor elke spreuk die je dit gevecht speelde. Hij raakt al verlicht bij 60% Geest. |
| Nasr | Les geven | Eén keer per gevecht: een bondgenoot krijgt voorgoed +1 aanval. |
| Quayle | Catalogus | Bij elke kaartbeloning één extra keuze. |
| Bridie | Theebladeren | De eerste spreuk die je in een gevecht speelt, komt terug in je hand. |
| Pema Lhamo | Vorige levens | Kaartbeloningen komen uit alle vier de klassen. |
| Rook | Dossier | Begint elk gevecht met 1 Aanwijzing. Deductie kost 1 Aanwijzing minder. |
| Lusk | Kruisverwijzing | Als je een vijand ontmaskert, krijgt een bondgenoot teller −1. |
| Thorne | Onderschepping | Eén keer per gevecht: verplaats een vijand naar een andere rij of een ander vak. |
| Finch | Verstoppen | Kan niet worden aangevallen zolang een bondgenoot in haar rij voor haar staat. +5 Ponden na elk gewonnen gevecht. |
| Canul | Glasplaat | De eerste Ontmaskering in elk gevecht kost geen beurt. |
| Marsh | Bevoegdheid | Eén keer per akte: wissel op de kaart naar het andere pad. |
| Odile | Voorgevoel | Eén keer per gevecht: annuleer de volgende vijandelijke aanval. |
| Hu Yiping | Ademdiscipline | +2 aanval tegen menselijke vijanden. |
| Hale | Doorvechter | Doodt hij een vijand, dan valt hij meteen nog een keer aan (één keer per beurt). |
| Pruitt | Brede schouders | Aanvallen op bondgenoten in haar rij gaan naar haar. Ze heeft Doorns 1. |
| Singh | Stalen zenuwen | Je held en je bondgenoten nemen 1 Gruwel minder van elke aanval. |
| Ang Nima | Gids van de pas | Begint elk gevecht met 2 Gezegend, te verdelen over held en bondgenoten. |
| Fathy | Honderd dragers | Begint elk gevecht met de barricade *Dragers* in de hand. Schatkisten geven één extra keuze. |
| Bray | Opgraving | Bij elk artefact mag je kiezen uit 2. |
| Gosling | Verdwijntruc | Eén keer per gevecht: laat een vijand (geen baas) verdwijnen. Hij komt terug in de volgende golf. |
| Vane | Salonkringen | Alles in winkels kost 25% minder. |
| Valentine | Lied dat bindt | Een spreuk die een bondgenoot helpt, helpt ook de bondgenoot ernaast. |
| Ashby | Droommelodie | Elke 3 beurten: je held herstelt 1 Geest en elke bondgenoot 1 Leven. |
| Whitlock | Gaarkeuken | Na elk gevecht herstelt je held 3 Lichaam. Rusten herstelt extra. |
| Ashcombe | Handoplegging | De aanval van je held geneest een gewonde bondgenoot in plaats van een vijand te raken (jij kiest elke keer). |
| Flynn | Agent met hond | Begint met een vaste hond als bondgenoot (art: `spullen/dier-terrier.jpg` of `dier-mastiff.jpg`). |

### 5.4 Startstapel

Ongeveer 10 kaarten:

- de **2 persoonlijke voorwerpen** van de held (uit `data/persoonlijk.json`, veld `held`; art in `art/persoonlijk/`), vertaald naar kaarten;
- **2 bondgenoten** uit de klasse;
- **5 startkaarten** van de klasse (basisaanval, basisverdediging, één kaart die het mechaniek van de klasse laat zien);
- **1 neutrale kaart** uit Londen.

**Elke klasse krijgt gegarandeerd vroeg een sleutelkaart van haar mechaniek.** Bij de recensies van Wildfrost was toeval dat je build onmogelijk maakte een van de grootste klachten.

### 5.5 Bondgenoten

- Maximaal **4 bondgenoten** in je stapel. Krijg je er meer, dan kies je wie naar de **reserve** gaat. Tussen knooppunten mag je wisselen.
- Bronnen voor bondgenoten:
  - de 38 personages (`data/personen.json`, `art/personen/`);
  - de bondgenoot-kaarten (`art/spullen/bondgenoot-*.jpg`);
  - de dieren (`art/spullen/dier-*.jpg`);
  - overgelopen vijanden (Charisma).

---

## 6. Kaarten

### 6.1 Soorten

| Soort | Blijft op het veld? | Bron in Londen 1888 |
|---|---|---|
| **Held** | ja, nooit terug te roepen | `helden.json` |
| **Bondgenoot** | ja, terug te roepen | `personen.json`, `bondgenoot-*`, `dier-*` |
| **Barricade** | ja, heeft **schroot** in plaats van leven: elke treffer kost precies 1 schroot | nieuw (zoutkring, stormlantaarn, kruisbeeld, omgevallen kar…) |
| **Spul** | nee, gaat naar de aflegstapel | `spullen.json` |
| **Spreuk** | nee, kost vaak Geest, heeft vaak een verlichte tekst | `spreuken.json` |
| **Middeltje** | nee, en het **verdwijnt** na gebruik. Je hebt een aparte zak met maximaal 3 middeltjes, die je zonder beurtactie gebruikt | laudanum, vlugzout, brandewijn, cocawijn, carbol… uit `spullen.json` |
| **Waanzin / Vloek** | onspeelbaar of nadelig | `toestanden.json` |

### 6.2 Wat je naast kaarten verzamelt

- **Talismannen** (de charms van Wildfrost): kleine voorwerpen die je **aan één kaart hangt** en die haar voor de rest van de run veranderen ("+2 aanval", "teller −1", "begint met 2 Gezegend", "krijgt een verlichte tekst"…). Maximaal 1 per kaart (2 met een latere ontgrendeling). Ongeveer 15 stuks.
- **Artefacten** (de relikwieën van Slay the Spire): gelden voor de hele run, vaak met een prijs in Geest. Gebruik de 33 artefacten uit `data/artefacten.json` en `art/artefacten/`, maar herschrijf hun tekst voor dit spel. Bazen geven een keuze uit 3 artefacten.
- **Zegels** (de kronen van Wildfrost): te koop in de winkel. Gebruik het fiche `gezegend`.
- **Ponden**: geld. Fiche `pond`.

### 6.3 Kaartdata

Eén JSON-bestand per soort in `data/`. Elke kaart heeft een vaste vorm, die `tools/controleer-kaarten.js` controleert:

```json
{
  "id": "kring-van-zout",
  "naam": "Kring van zout en ijzer",
  "soort": "spreuk",
  "klasse": "kennis",
  "zeldzaamheid": "gewoon",
  "geest": 1,
  "doel": "eigen-rij",
  "tekst": "Je hele rij krijgt 1 Gezegend.",
  "effect": [{ "doe": "status", "status": "gezegend", "aantal": 1, "op": "eigen-rij" }],
  "verlicht": "Je hele rij krijgt 2 Gezegend. Je verliest 1 Geest.",
  "effectVerlicht": [
    { "doe": "status", "status": "gezegend", "aantal": 2, "op": "eigen-rij" },
    { "doe": "geest", "aantal": -1, "op": "held" }
  ],
  "art": "spreuken/zout-en-ijzer.jpg",
  "verbeterd": { "tekst": "…", "effect": [] }
}
```

- Effecten zijn **data, geen code**. Er is een kleine bibliotheek van effectsoorten (`schade`, `gruwel`, `status`, `teller`, `trek`, `geest`, `ponden`, `oproepen`, `overtuigen`, `aanwijzing`…) in `motor/effecten.js`. Bijzondere kaarten mogen een eigen functie hebben, maar zo weinig mogelijk.
- Elke kaart heeft een **verbeterde versie** (Universiteit).
- De kaarttekst wordt zoveel mogelijk **gegenereerd uit het effect**, zodat tekst en werking nooit uit elkaar lopen.

### 6.4 Aantallen voor versie 1.0

- 4 × 25 klassenkaarten
- 30 Londen-kaarten
- ongeveer 10 barricades
- 10 middeltjes
- 15 talismannen
- 25 artefacten
- 8 Waanzin-kaarten

Schrijf de kaarten in de toon van Londen 1888: een korte naam, een droge regeltekst, en waar het past een regel sfeer (`"sfeer": "Dertig jaar lang wees hij ermee waar gegraven moest worden."`).

---

## 7. Vijanden, bazen en de oude goden

### 7.1 Eén god per run

- Er zijn **12 oude goden** (`data/oude-goden.json`, art in `art/goden/`, sfeerlussen in `art/geluid/sfeer-*.mp3`).
- Bij het begin van een run is de god **standaard willekeurig**. Je kunt hem ook **zelf kiezen**.
- De god bepaalt:
  - **welke monsters** je tegenkomt (de godenlijst in `data/monsters.json`);
  - **de bazen**;
  - **de sfeermuziek**;
  - één **godsregel** die de hele run geldt. Vertaal die uit de `regel` van de god. Bijvoorbeeld Vathrûn: "Vijanden in het Riool beginnen met 1 Mist minder en hebben +1 Leven."
- Geef elke god een eigen status of eigenschap (zie §3.6), zodat runs echt verschillend aanvoelen. Het lijkt op de alternatieve akten van Slay the Spire 2.

### 7.2 Monsters omzetten

- De 38 monsters uit Londen 1888 hebben `gruwel`, `taaiheid`, `schade` en `leven`. Zet ze om naar **Leven, Aanval, Gruwel, Teller en een eigenschap**. Zet de omrekening in een script (`tools/zet-monsters-om.js`), zodat ze opnieuw kan, en stel de getallen daarna met de hand en de testbot bij.
- Markeer menselijke vijanden met `"mens": true` (logebroeder, cultist, lantaarndrager, lijkenrover, pestdokter, krantenjongen, deurwaarder…). Charisma kan ze overtuigen, Hu Yiping doet er extra schade op.
- Elke god moet **minstens 6 gewone monsters** hebben. Waar dat niet zo is, maken we nieuwe monsters (zie §10).
- **Gevechten** zijn vooraf ontworpen groepen met een naam en een icoon op de kaart ("Lantaarndragers op de kade", "Het koor in de kerk"). Elk gevecht heeft 2 of 3 golven. Per god en per akte een lijst van gevechten.

### 7.3 Bazen

| Akte | Baas | Bron |
|---|---|---|
| 1 | Een **luitenant**: een sleutelpersoon uit de factie van de god (bijvoorbeeld Moeder Brine voor Vathrûn, Magister Croft voor Azh-Ilareth) | `data/personen.json` en `lore/facties.md`, `art/personen/` |
| 2 | Het **epische monster** van de god (De Bisschop van het Slib, De Dichter zonder Ogen…) | `data/epische-monsters.json`, `art/monsters/` |
| 3 | **De oude god zelf.** Een grote kaart over twee vakken met 2 of 3 fasen. Bij elke fase verandert het slagveld (de Mist rijst, het Riool loopt onder, de ster valt…). | `art/goden/`, `art/scheur/` |

- Een baas heeft een eigen vermogen en verschijnt in een latere golf, met de gewone vijanden eerst.
- Verslaan beëindigt het gevecht meteen.

---

## 8. De run en de kaart van Londen

### 8.1 Opbouw

- Een run is **één nacht in drie akten**. Totaal ongeveer **8 gevechten** en **30 tot 45 minuten**.
- Elke akte bestaat uit **3 gedeelten**. Elk gedeelte is een **keuze tussen twee paden** (zoals in Wildfrost) met 2 tot 4 knooppunten, en eindigt met een gevecht. Het laatste gedeelte van een akte eindigt met de baas.
- Akten en achtergronden:

| Akte | Wijken | Achtergrond |
|---|---|---|
| 1. De kades en de East End | Wapping, Limehouse, Whitechapel, Spitalfields, St Katharine Docks, Southwark | `art/plekken/` |
| 2. De West End en de salons | Mayfair, Soho, Marylebone, Pall Mall, Bloomsbury, Covent Garden, Strand | `art/plekken/` |
| 3. Onder Londen, door de Scheur | Riolen, Ondergrondse, pestputten, en het hart van de Scheur | `art/scheur/` en nieuwe beelden |

- De kaart toont het bord van Londen (`art/bord/londen.jpg`) met de paden erop getekend, zoals het bordspel dat doet.
- **Elk gevecht toont vooraf zijn naam en icoon**, zodat je je stapel en bondgenoten kunt voorbereiden. Wildfrost voegde dat later toe en het was een verbetering.

### 8.2 Knooppunten

Elk knooppunt gebruikt een plek of dienst uit Londen 1888, met de plekkaart als achtergrond.

| Knooppunt | Wat het doet | Gelijk aan |
|---|---|---|
| **Gevecht** | Ponden plus kies 1 uit 3 kaarten (overslaan geeft extra Ponden) | gevecht |
| **Scheur** | Elitegevecht, beloning: een artefact | elite |
| **Markt** | Winkel: spullen, middeltjes, een Zegel, talismannen | Woolly Snail |
| **Occulte boekwinkel** | Winkel: spreuken en talismannen | winkel |
| **Logementen** | Kies 1 uit 3 bondgenoten | Frozen Travelers |
| **Ziekenhuis** | Herstel Lichaam en genees Gewonde bondgenoten | rust |
| **Gaarkeuken** | Herstel Geest | rust |
| **Kerk** | Verwijder tot 2 kaarten (ook Waanzin of Vloek) | Muncher |
| **Universiteit** | Verbeter een kaart | smidse |
| **Seance** | Gok: verlies Geest, krijg een artefact of een talisman | gebeurtenis |
| **Ontmoeting** | Een verhaalkaart met een alinea sfeertekst en 2 of 3 keuzes | gebeurtenis |
| **Club** | Hoor wat de baas van deze akte doet, of koop een gerucht | informatie |
| **Kist** | Kies 1 uit 3 spullen of barricades | schatkist |

- De **ontmoetingen** zijn de kans om de lore te laten leven. Gebruik `data/ontmoetingen/*.json` (139 verhaalkaarten en 94 stadskaarten) en de verhaallijnen per god uit `lore/verhaallijnen.md`. Herschrijf de uitkomsten naar dit spel (kaart erbij, Geest eraf, bondgenoot, Ponden, vloek…). Per god minstens 4 eigen ontmoetingen, zodat het verhaal van die god in de run meekomt.
- Rustknopen bieden een **keuze**, bijvoorbeeld: herstel óf verbeter. Geen gratis alles.

### 8.3 Na een verloren run

Net als in Wildfrost kan een bondgenoot uit je vorige verloren run opduiken als **Gewonde bondgenoot**, met zijn talismannen nog aan zich. Dat past bij de horror: wie je achterliet, vind je terug.

---

## 9. Tussen de runs: het hoofdkwartier en de moeilijkheid

### 9.1 Het hoofdkwartier

- De achterkamer van een occulte boekwinkel in Bloomsbury. Daar ontgrendel je dingen, zoals in Snowdwell bij Wildfrost.
- **Gebouwen of hoeken** met elk een eigen soort ontgrendeling:

| Hoek | Wat je er ontgrendelt |
|---|---|
| **Het rariteitenkabinet** | spullen en barricades |
| **De leeszaal** | spreuken en talismannen |
| **Het gastenboek** | bondgenoten |
| **De kaartentafel** | nieuwe knooppunten en ontmoetingen |
| **De wachtkamer** | helden |
| **De torenklok** | klokken |

- **Ontgrendelen gaat via uitdagingen**, zoals "Win met elke klasse", "Versla Vathrûn", "Speel 5 spreuken in één gevecht", "Win een gevecht met 1 Lichaam".
- **Bij de eerste start** zijn per klasse 3 helden vrij, plus de basiskaarten. Er komt een instelling *Alles vrijgeven* voor wie meteen alles wil.
- **Bij het begin van een run:**
  1. Kies een klasse.
  2. Je krijgt 3 willekeurige ontgrendelde helden van die klasse om uit te kiezen, met een knop om toch zelf elke ontgrendelde held te kiezen.
  3. Kies de god: willekeurig of zelf.
  4. Kies de stand en de klokken.

### 9.2 Moeilijkheid: een duidelijke en gebalanceerde schaal

Frédéric wil **een duidelijke schaal van makkelijk tot extreem moeilijk, maar haalbaar**. Wildfrost kreeg kritiek op een schokkerige moeilijkheid zonder ladder, en de makers zeiden achteraf zelf dat ze een zachtere beginmoeilijkheid zouden kiezen. Dus:

**1. Drie standen**, zoals in het bordspel:

| Stand | Wat er verandert | Doel-winkans |
|---|---|---|
| **Ontspannen** | +25% Lichaam en Geest voor je held, vijanden −1 aanval | ±85–90% |
| **Normaal** | basiswaarden | ±55–65% |
| **Genadeloos** | vijanden +1 aanval en +20% leven, minder Ponden | ±25–35% |

De winkansen gelden voor een redelijke speler, gemeten door de testbot met een goede strategie.

**2. Dertien klokken** (`art/klokken/`, data in `data/klokken.json` van Londen 1888). Het zijn modificatoren die je stapelt, zoals de Storm Bells van Wildfrost en de Ascension van Slay the Spire. Je ontgrendelt ze één voor één door te winnen met de vorige aan. Herinterpretatie voor het kaartspel (mag je verfijnen, namen en beelden blijven):

| Klok | In het kaartspel |
|---|---|
| Lege zakken | Winkelprijzen +25% |
| Zware benen | Je held heeft teller +1 |
| Zwijgende getuigen | Ontmoetingen geven minder; de Club zegt niets |
| Gesloten lijnen | Vaker maar één pad op de kaart |
| Taaie wezens | Vijanden +20% Leven |
| Huiveringwekkend | Vijanden doen +1 Gruwel |
| Dikke mist | Big Ben-golven komen 1 beurt eerder |
| Scheurende stad | Eén extra Scheur (elite) per akte |
| Slapeloze nachten | Geen Geest-herstel na gevechten; rust herstelt minder |
| Geen tweede worp | Het politiefluitje laadt niet vanzelf op |
| Ongeduldige god | Bazen hebben een extra vermogen |
| Geen genade | Gevallen bondgenoten zijn weg voor de rest van de run |
| Dertien slagen | De oude god heeft een extra, vierde fase |

**3. Op het startscherm** toont het spel bij de gekozen stand en klokken een **geschatte winkans**, net als het klokkenmodel van Londen 1888 (`ontwerp/klokkenmodel.md`). Een klok moet altijd voelbaar zijn (ongeveer −3 tot −8 procentpunt), en **Genadeloos met alle 13 klokken moet haalbaar blijven: minstens 3 tot 5% voor de testbot**.

### 9.3 De testbot

- `tools/testbot.js` speelt hele runs zonder scherm, met de motor en een seed.
- **De bot speelt redelijk, niet perfect.** Hij kiest de zet die na een korte vooruitblik (de huidige beurt plus de tellers van de volgende 2 beurten) het meeste schade voorkomt en doet. Kaartkeuzes maakt hij met een eenvoudige score per kaart. Hij roept bondgenoten terug als die anders vallen.
- **Wat hij meet:**
  - winkans per klasse, per held, per god, per stand en per klok;
  - in welk gevecht runs sneuvelen;
  - welke kaarten in winnende stapels zitten;
  - gemiddelde lengte in beurten.
- **Resultaten** in `ontwerp/balans.json`, en een samenvatting in `ontwerp/te-doen.md`, zoals in Londen 1888.
- **Balansdoelen:**
  - geen klasse meer dan 10 procentpunt boven of onder het gemiddelde;
  - geen god meer dan 12 procentpunt;
  - geen held die nooit gekozen zou worden.

---

## 10. Art

### 10.1 Stijl

- Alles blijft **laat-Victoriaanse olieverf**, donker en sfeervol, precies zoals Londen 1888. Gebruik de stijlregel en de "vermijden"-regel uit `ontwerp/beeldopdracht.md` letterlijk.
- **Nooit tekst in een afbeelding.** Namen en getallen tekent het spel erover.
- **Kaartranden, klokjes en getallen zijn CSS en SVG,** geen afbeeldingen. Elke klasse heeft een eigen randkleur (zie §5.1). De kaart is staand (ongeveer 5:7) met de afbeelding bovenaan, bijgesneden uit de bestaande art (helden zijn 3:4, monsters en spullen 1:1).

### 10.2 Hergebruiken (kopieer uit Londen 1888)

| Map | Wordt |
|---|---|
| `art/helden/` (28) | helden en portretten bij de klassekeuze |
| `art/monsters/` (50) | vijanden en epische bazen |
| `art/personen/` (38) | bondgenoten en luitenants (akte 1-bazen) |
| `art/spullen/` (65) | spullen, middeltjes, dieren, bondgenoten |
| `art/persoonlijk/` (52) | startkaarten van de helden |
| `art/spreuken/` (27) | spreuken |
| `art/artefacten/` (33) | artefacten en talismannen |
| `art/goden/` (12), `art/scheur/` (11) | eindbazen, akte 3, Scheur-knooppunten |
| `art/plekken/` (23) | achtergronden van knooppunten en gevechten |
| `art/bord/londen.jpg` | de kaart van de run |
| `art/klokken/` (13) | de moeilijkheidsklokken |
| `art/fiches/` | iconen voor Gezegend, Vervloekt, Mist, Aanwijzing, Pond, Trofee |
| `art/achterkanten/` | achterkant van de trek- en aflegstapel |
| `art/scherm/` | `big-ben.jpg` voor de golfteller, `klok.jpg` |
| `art/geluid/` | alle muziek, effecten en sfeerlussen |

Schrijf een script `tools/kopieer-uit-londen.js` dat deze mappen uit een clone van Londen 1888 kopieert, zodat het opnieuw kan als daar iets verandert.

### 10.3 Nieuw te maken

Maak een **`ontwerp/beeldopdracht.md`** in dezelfde vorm als die van Londen 1888, met een prompt per afbeelding, bestandsnaam en formaat. Frédéric maakt ze met een beeldgenerator en zet ze in de Drive. Daarna haalt `tools/haal-art.py` ze op (de Drive-map van Londen 1888 heeft al die werkwijze; maak een eigen submap of map). Lijst voor versie 1.0:

| Wat | Aantal | Formaat |
|---|---|---|
| Titelscherm | 1 | 16:9, 2560 × 1440 |
| Embleem per klasse (een voorwerp, geen tekst: een opengeslagen grimoire, een vergrootglas met lantaarn, een gebalde vuist met bokshandschoen, een waaier met visitekaartje) | 4 | 1:1, 1024 × 1024 |
| Het hoofdkwartier (achterkamer van een occulte boekwinkel) | 1 | 16:9 |
| Achtergrond van akte 3: riolen, Ondergrondse, pestputten, hart van de Scheur | 4 | 3:2, 2048 × 1365 |
| Barricades (zoutkring, stormlantaarn op een kist, omgevallen kar, kruisbeeld in een deuropening, zandzakken, kerkbank…) | ±10 | 1:1, 1024 × 1024 |
| Talismannen die niet uit de artefacten komen | ±8 | 1:1, 1024 × 1024 |
| Waanzin-kaarten (beelden van verwarring en angst, geen gore) | 8 | 1:1, 1024 × 1024 |
| Extra monsters voor goden met minder dan 6 monsters | tel het na | 1:1, 1536 × 1536 |
| Nieuwe achterkant van de kaart voor dit spel | 1 | 3:4, 1024 × 1365 |
| Knooppunt-iconen (klein, rond, uit te snijden) | ±13 | 1:1, 512 × 512 |

Tel voor de extra monsters eerst per god hoeveel monsters er zijn, en zet de tekorten in de beeldopdracht.

---

## 11. Geluid

- **Hergebruik** de muziek (8 stukken, `data/muziek.json` met de muziekspeler), de sfeerlussen per god en de effecten uit Londen 1888.
- **Maak een `ontwerp/geluidsopdracht.md`** in de vorm van die van Londen 1888 (Engelse prompt, duur, bestandsnaam). Frédéric maakt ze in ElevenLabs. Nieuw nodig:

| Bestand | Wanneer | Duur | Prompt (voorstel) |
|---|---|---|---|
| `kaart-spelen.mp3` | Je legt een kaart op het veld | 0,6 s | `a thick old playing card slapped down on a felt table, close up, dry, no music` |
| `tik.mp3` | Een teller gaat omlaag | 0,3 s | `a single soft tick of an antique pocket watch, close up, dry` |
| `slag.mp3` | Een kaart slaat toe | 0,8 s | `a short muffled strike, wooden club hitting a sack, Victorian, dry, no music` |
| `treffer.mp3` | Een treffer met schade | 0,6 s | `a heavy dull impact with a faint cloth tear, close up, dry` |
| `blok.mp3` | Gezegend blokkeert | 0,8 s | `a soft clear bell ring with a brief shimmer, protective, short` |
| `fluitje.mp3` | Het politiefluitje | 1 s | `a Victorian police whistle blown once, short, slightly distant, foggy street` |
| `golf.mp3` | Een golf vijanden komt binnen | 2,5 s | `a single deep Big Ben bell toll in thick fog, low drone, ominous` |
| `verlicht.mp3` | Je raakt verlicht | 2 s | `a faint rising whisper of many voices with a cold glassy shimmer, eerie, no music` |
| `waanzin.mp3` | Je Geest valt op 0 | 2,5 s | `a sudden high violin screech dissolving into breathy distorted laughter, horror, short` |
| `overtuigd.mp3` | Een vijand loopt over | 1,5 s | `a murmured voice of agreement and a coin dropped into a palm, short, Victorian` |
| `dood.mp3` | Een kaart valt | 1 s | `a card crumpling and a soft sigh fading into silence, dry` |
| `baas.mp3` | Een baas verschijnt | 3 s | `a deep orchestral stab with a low choir and a heavy door slamming far away, horror` |

Het spel moet ook **zonder** deze bestanden werken met eenvoudige ingebouwde klanken, zoals Londen 1888 dat doet.

---

## 12. Schermen

1. **Startscherm:** titel, *Nieuwe run*, *Hervatten*, *Hoofdkwartier*, *Muziek*, *Wat is er nieuw*, *Spelregels*.
2. **Run kiezen:** klasse, dan held (3 voorgesteld of zelf kiezen), dan god (willekeurig of kiezen), dan stand en klokken met de geschatte winkans.
3. **Kaart:** het bord van Londen met de paden, je stapel, je artefacten, Ponden, Lichaam en Geest.
4. **Gevecht:** het slagveld, je hand, trek- en aflegstapel, het politiefluitje met zijn oplaadteller, het terugroepvak, Big Ben, en de middeltjeszak. De volgorde van toeslaan staat als nummertjes op het veld (aan of uit te zetten).
5. **Knooppunten:** winkel, kies-1-uit-3, ontmoeting met sfeertekst, rust, kerk, universiteit.
6. **Stapel bekijken:** alle kaarten met hun talismannen, verbeterde versies en verlichte tekst.
7. **Einde van de run:** gewonnen of verloren, wat je ontgrendelde, statistieken.
8. **Spelregels:** een korte uitleg en een **oefengevecht** met hulpteksten. Het eerste gevecht van een eerste run is bewust makkelijk.

---

## 13. Fasen

Werk in deze volgorde. Na elke fase moet er iets speelbaars online staan.

| Fase | Inhoud | Klaar als |
|---|---|---|
| **0. Opzet** | Repo, `CLAUDE.md`, PWA, bouwscript, Pages-workflow, kopieerscript voor de art, woordenlijst | Lege app staat online en werkt op de iPad |
| **1. Gevecht** | Motor met tellers, rijen, golven, de beurt, het fluitje, terugroepen, alle 10 statussen, Gruwel, Geest, Verlichting en Waanzin. Eén klasse (Kracht), één held, één god (Vathrûn), 3 gevechten. Eerste versie van de testbot. | Je kunt een gevecht spelen en de testbot kan er 1000 spelen |
| **2. Run** | Kaart met paden, alle knooppunten, kaartbeloningen, winkel, rust, ontmoetingen, opslaan en hervatten, de drie bazen voor Vathrûn | Een hele run tegen Vathrûn is speelbaar |
| **3. Klassen** | Alle 4 klassen met hun pools, alle 28 helden met hun vermogens, startstapels, talismannen, artefacten, middeltjes | Elke klasse en elke held speelbaar |
| **4. Goden** | Alle 12 goden met hun monsters, gevechten, godsregels, luitenants, epische monsters, eindbazen met fasen en ontmoetingen | Elke god speelbaar |
| **5. Hoofdkwartier en moeilijkheid** | Ontgrendelingen, uitdagingen, drie standen, dertien klokken, geschatte winkans, balanceren met de testbot | Balansdoelen uit §9 gehaald |
| **6. Afwerking** | Nieuwe art en geluiden inbouwen, animaties, oefengevecht, spelregels, toegankelijkheid | Versie 1.0 |

Maak per fase een duidelijke regel in `ontwerp/te-doen.md`, en zet in `data/nieuws.json` wat er voor spelers nieuw is.

---

## 14. Ontwerpprincipes (lees dit als twijfel opkomt)

1. **Eenvoud en consistentie gaan voor.** Kaarten mogen ingewikkeld samenwerken, maar de regels eromheen moeten eenvoudig blijven. Dat was de belangrijkste regel van de makers van Wildfrost.
2. **Elke beurt is een kleine puzzel.** De speler moet kunnen zien wat er gaat gebeuren (tellers, volgorde, doelen) en dat met één kaart kunnen beïnvloeden.
3. **Toeval mag spannend zijn, nooit uitzichtloos.** Garandeer sleutelkaarten van de klasse, geef herkansingen (fluitje, overslaan voor Ponden, Kerk) en laat zien welk gevecht eraan komt.
4. **Verlichting is een keuze.** De speler moet zich afvragen of hij de verlichte kracht wil, niet alleen proberen zijn Geest hoog te houden.
5. **Klassieke griezel, geen splatter.** Wat je niet ziet, is enger. Mensen zijn de gevaarlijkste tegenstanders. Dat komt uit `lore/wereld.md`.
6. **Elke god voelt anders.** Monsters, regel, statussen, ontmoetingen, muziek.
7. **Meten, niet gokken.** Balans gaat via de testbot. Getallen in dit document zijn startwaarden.

---

## 15. Open punten om met Frédéric af te stemmen

- Of er helden zijn die voor hem en Dieuwertje vanaf het begin vrij moeten zijn. Tot dat bekend is: per klasse 3 vrij, plus de instelling *Alles vrijgeven*.
- De precieze tekst van de vermogens (§5.3) na de eerste speelronde.
- Of er later een tweede, bijgemengde klasse komt, zoals de bondgenoot-clan in Monster Train 2. Dat is een idee voor na versie 1.0, geen eis.
- Dagelijkse runs met een vaste seed en een scorebord (Londen 1888 heeft al een Cloudflare-scorebord in `cloud/scorebord/`). Ook na versie 1.0.
