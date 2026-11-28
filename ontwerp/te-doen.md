# Te doen

Per fase uit de brief een regel; bovenaan wat er nu speelbaar is. De laatste meting van de testbot staat onderaan (volledig in `ontwerp/balans.json`).

## Fasen

- [x] **Fase 0. Opzet.** Repo, `CLAUDE.md`, PWA (manifest, service worker, offline), `tools/bouw.js`, Pages-workflow, `tools/kopieer-uit-londen.js`, woordenlijst.
- [x] **Fase 1. Gevecht.** Motor met tellers, rijen, golven, de beurt, het politiefluitje, terugroepen, alle 10 statussen, Gruwel, Geest, Verlichting en Waanzin. Kracht, Vathrûn. Testbot speelt 1000 gevechten in een paar seconden.
- [x] **Fase 2. Run.** Kaart van Londen met paden, alle knooppunten behalve de Occulte boekwinkel, kaartbeloningen, winkel, rust met een keuze, ontmoetingen, opslaan en hervatten, de drie bazen van Vathrûn (Moeder Brine, de Bisschop van het Slib, Vathrûn in drie fasen).
- [x] **Fase 3. Klassen.** Klaar (28 november): vier klassen met hun pools (Kennis 29, Waarneming 25, Kracht 27, Charisma 28, Londen 30 kaarten), rituelen, Aanwijzingen en Deducties, Ontmaskeren, Overtuigen, klasseregels, alle 28 helden met vermogen en persoonlijke voorwerpen, 15 talismannen, 25 artefacten en de Occulte boekwinkel.
- [ ] **Fase 4. Goden.** De andere 11 goden met monsters (elk 1 nieuw monster erbij), gevechten, godsregels, luitenants, epische monsters, eindbazen met fasen en minstens 4 ontmoetingen per god.
- [ ] **Fase 5. Hoofdkwartier en moeilijkheid.** Ontgrendelingen via uitdagingen, de dertien klokken (de motor kent er al een paar), geschatte winkans per stand en klok, balans per klasse en god.
- [ ] **Fase 6. Afwerking.** Nieuwe art (`ontwerp/beeldopdracht.md`) en geluiden (`ontwerp/geluidsopdracht.md`), meer animaties, toegankelijkheid.

## Wat nu speelbaar is (versie 7)

- Dertig eigen illustraties voor schermen, klassenemblemen, akte 3, kaarten en de trekstapel.

- Het oog uit de speelkamer als favicon en een vierkant amethistoog als app-icoon.

- Wijkroutes met benoemde haltes, een akteoverzicht en bewegende reispion. Geestfiches, stapelbare statuszegels en zichtbare Verlichting op de kaarten.

- Vernieuwde speelkamer, omgekeerd slagveld, verlichte sleepdoelen, kaartanimaties en zes nieuwe personage-illustraties.

- Klasse **Kracht** met 7 helden: Hale, Pruitt en Hu Yiping vrij, de rest ontgrendel je door te winnen (of met *Alles vrijgeven*).
- God **Vathrûn** met 7 monsters, 15 gevechten verdeeld over 3 akten, 3 bazen en 6 eigen ontmoetingen (plus 4 algemene).
- 69 kaarten: 20 van Kracht, 14 persoonlijke voorwerpen, 15 uit Londen, 6 middeltjes, 8 Waanzin, en de Dragers van Fathy. 16 artefacten.
- Drie standen: Ontspannen, Normaal, Genadeloos.
- Oefengevecht met hulpteksten bij de Spelregels.

## Open punten en ideeën

- [x] **Oefenlessen (28 november):** het oefengevecht is nu vijf lessen (`app/scherm/oefening.js`): de basis, statussen, Geest/Verlichting/Waanzin (Ambrose met *De stemmen* in de hand, 1 Geest boven de drempel), de speurder en de aanvoerder. Tips met een voorwaarde verschijnen zodra die voor het eerst klopt. Alle vijf met de testbot gewonnen (40 van 40). Gehaalde lessen staan in `meta.oefeningen`.
- **Kaarttekst bij Kennis:** de verlichte tekst toont ‘Je verliest 1 Geest’, ook al betaalt de occultist dat niet (`verlichtZonderPrijs`). De les legt het uit; netter is de tekst in de hand aanpassen aan de klasse.

- **Beelden:** `ontwerp/beeldinventaris.md` is de volledige lijst van wat er nog gemaakt moet worden (42 nodig of aanbevolen, 22 mooi om te hebben), met prompts. Tien talismannen gebruiken tot dan de achterkant van de artefactkaarten.
- **Statuslagen** (`statusLagen` in `app/scherm/kaart-dom.js`, CSS onder "statuslagen" in `app/stijl.css`): elke status een eigen laag, sterkte met `--n` (1 tot 5). Geschilderde texturen kunnen later in dezelfde lagen (zie beeldinventaris B2).
- [x] **Statustexturen (28 november):** Woede, Pest en Mist gebruiken geschilderde texturen (`art/status/`, omgezet met `tools/maak-statuslaag.py` naar doorzichtige PNG). Bescherming en Vervloekt volgden met nieuwe beelden: een gloeiende rand en runen die vanaf de rand naar binnen kruipen, met het midden vrij.
- [x] **Alle tien statussen geschilderd (28 november):** ook Gezegend, Doorns, Bekoring, Inkt en Angst hebben nu een textuur (Inkt en Angst op wit, omgezet met `--wit`). Geen statuslaag gebruikt nog `mix-blend-mode`; dat deed niets binnen `.statuslagen`, omdat `z-index: 1` er een eigen stapel van maakt.
- [x] **Waanzin als brandstof (28 november):** drie verlichte Kennis-spreuken worden sterker per Waanzin-kaart in je stapel (effectveld `perWaanzin`, werkt op schade en statussen): *Fluistering van de doden* (+1 schade), *Ontbinding* (+1 Pest) en *Grote verbanning* (+1 schade aan elke vijand). De bonus geldt alleen bij Verlichting; ook op de onverlichte tekst was Kennis te sterk (71% op Normaal). Rituelen geven geen 2 Geest meer terug; verlichte teksten blijven gratis (zonder die regel: 9 tot 10 Waanzin en 43 tot 47% winst). De kaartuitleg in een gevecht toont hoeveel Waanzin je nu hebt. De testbot houdt Waanzin bij twee of meer van die spreuken (tot 4 kaarten, niet naar de Kerk).
- **Verlichting en Kennis:** Kennis is het vaakst verlicht (57% van de beurten op Normaal) en loopt nu 5,6 Waanzin per run op (was 3,6; de anderen 1 tot 4). Het doel van 6 tot 7 is net niet gehaald. Kan later met meer spreuken die `perWaanzin` gebruiken, of een ritueel dat Waanzin verbant en iets teruggeeft.
- **Luitenants voor fase 4:** Greaves (Ysmara) was een bondgenoot; die kaart is nu Obadiah Penrose. Haversham en Kettering staan nog als beeld op twee Charisma-kaarten tot hun eigen illustratie er is.

- **Paden gebalanceerd (27 november):** beide paden van een gedeelte even lang (2 of 3), elk hooguit één herstel-, één stapel- en één gok-knooppunt, en ongeveer even veel waard (`WAARDE` in `app/motor/run.js`). Gemiddeld waardeverschil van 2,5 naar 0,35; scheve keuzes van 31% naar 0%. Winkans testbot: Ontspannen 94%, Normaal 71%, Genadeloos 30%.

- Klokken: `zware-benen`, `dikke-mist`, `scheurende-stad`, `gesloten-lijnen`, `lege-zakken`, `slapeloze-nachten`, `geen-tweede-worp` en `geen-genade` werken al in de motor, maar zijn nog niet te kiezen.
- Klasseregels (in `data/klassen.json`): Kennis: elke spreuk zet de teller van je held 1 lager. Waarneming: held krijgt 1 Aanwijzing per toeslag, ontmaskerde vijanden nemen 2 schade extra. Kracht: Trofee. Charisma: zes bondgenoten. Zonder deze regels wonnen Kennis en Waarneming maar 5–7% op Normaal.
- Vermogens die in de brief niet goed in een kaartspel pasten, zijn iets aangepast: Thorne zet een vijand achteraan in zijn rij (in plaats van een vrij vak), Ashcombe geneest bij elke toeslag zijn zwakste gewonde bondgenoot 3 Leven (in plaats van te kiezen), Flynn begint met Bob, een politiehond met een Zegel.
- *Na een verloren run* werkt: een gevallen bondgenoot kan terugkomen in de Logementen, gewond. Hij neemt nog geen talisman mee (die bestaan nog niet).
- De testbot speelt redelijk. Hij verplaatst zijn held naar achteren en gebruikt middeltjes eenvoudig; slimmer verplaatsen zou de winkans iets verhogen.
- Gevechten duren gemiddeld zo'n 18 beurten. Als dat te lang voelt: vijanden iets minder Leven, of golven sneller.

## Laatste meting

28 november 2026, na *Waanzin als brandstof*: alle vier klassen en alle 28 helden (224 runs per stand, 56 per klasse), Vathrûn:

| Stand | Winkans | Kennis | Waarneming | Kracht | Charisma | Doel |
|---|---|---|---|---|---|---|
| Ontspannen | 86% | 96% | 95% | 86% | 68% | 85–90% |
| Normaal | 60% | 66% | 52% | 70% | 52% | 55–65% |
| Genadeloos | 27% | 30% | 29% | 25% | 25% | 25–35% |

Op Normaal, per klasse:

| Klasse | Beurten verlicht | Waanzin per run | Geest aan spreuken per run |
|---|---|---|---|
| Kennis | 57% | 5,6 | 44 |
| Waarneming | 28% | 1,1 | 2 |
| Kracht | 35% | 3,8 | 5 |
| Charisma | 38% | 3,2 | 9 |

- Kennis wint even vaak als vóór de wijziging (66% op Normaal), maar loopt meer Waanzin op en is vaker verlicht. Op Genadeloos 30% (was 25%).
- Op Normaal liggen alle klassen binnen 10 punten van het gemiddelde (Kracht net aan). Charisma is op Ontspannen de zwakste.
- Klassewaarden nu: Kennis held 2/teller 4, Waarneming 3/3, Kracht 3/4, Charisma 2/3.
- De meeste runs sneuvelen tegen Vathrûn zelf, in de Scheuren en bij de Bisschop.
