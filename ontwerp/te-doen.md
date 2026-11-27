# Te doen

Per fase uit de brief een regel; bovenaan wat er nu speelbaar is. De laatste meting van de testbot staat onderaan (volledig in `ontwerp/balans.json`).

## Fasen

- [x] **Fase 0. Opzet.** Repo, `CLAUDE.md`, PWA (manifest, service worker, offline), `tools/bouw.js`, Pages-workflow, `tools/kopieer-uit-londen.js`, woordenlijst.
- [x] **Fase 1. Gevecht.** Motor met tellers, rijen, golven, de beurt, het politiefluitje, terugroepen, alle 10 statussen, Gruwel, Geest, Verlichting en Waanzin. Kracht, Vathrûn. Testbot speelt 1000 gevechten in een paar seconden.
- [x] **Fase 2. Run.** Kaart van Londen met paden, alle knooppunten behalve de Occulte boekwinkel, kaartbeloningen, winkel, rust met een keuze, ontmoetingen, opslaan en hervatten, de drie bazen van Vathrûn (Moeder Brine, de Bisschop van het Slib, Vathrûn in drie fasen).
- [~] **Fase 3. Klassen.** Klaar (27 november): Kennis, Waarneming en Charisma met hun pools (Kennis 27, Waarneming 27, Charisma 30 kaarten inclusief start), rituelen, Aanwijzingen en Deducties, Ontmaskeren, Overtuigen (ook voorgoed), klasseregels, alle 28 helden met vermogen en persoonlijke voorwerpen, vermogens die je inzet met een knop. Nog te doen: Kracht en Londen aanvullen tot 25 en 30 kaarten, talismannen (±15), meer artefacten (25), Occulte boekwinkel.
- [ ] **Fase 4. Goden.** De andere 11 goden met monsters (elk 1 nieuw monster erbij), gevechten, godsregels, luitenants, epische monsters, eindbazen met fasen en minstens 4 ontmoetingen per god.
- [ ] **Fase 5. Hoofdkwartier en moeilijkheid.** Ontgrendelingen via uitdagingen, de dertien klokken (de motor kent er al een paar), geschatte winkans per stand en klok, balans per klasse en god.
- [ ] **Fase 6. Afwerking.** Nieuwe art (`ontwerp/beeldopdracht.md`) en geluiden (`ontwerp/geluidsopdracht.md`), meer animaties, toegankelijkheid.

## Wat nu speelbaar is (versie 3)

- Wijkroutes met benoemde haltes, een akteoverzicht en bewegende reispion. Geestfiches, stapelbare statuszegels en zichtbare Verlichting op de kaarten.

- Vernieuwde speelkamer, omgekeerd slagveld, verlichte sleepdoelen, kaartanimaties en zes nieuwe personage-illustraties.

- Klasse **Kracht** met 7 helden: Hale, Pruitt en Hu Yiping vrij, de rest ontgrendel je door te winnen (of met *Alles vrijgeven*).
- God **Vathrûn** met 7 monsters, 15 gevechten verdeeld over 3 akten, 3 bazen en 6 eigen ontmoetingen (plus 4 algemene).
- 69 kaarten: 20 van Kracht, 14 persoonlijke voorwerpen, 15 uit Londen, 6 middeltjes, 8 Waanzin, en de Dragers van Fathy. 16 artefacten.
- Drie standen: Ontspannen, Normaal, Genadeloos.
- Oefengevecht met hulpteksten bij de Spelregels.

## Open punten en ideeën

- **Paden gebalanceerd (27 november):** beide paden van een gedeelte even lang (2 of 3), elk hooguit één herstel-, één stapel- en één gok-knooppunt, en ongeveer even veel waard (`WAARDE` in `app/motor/run.js`). Gemiddeld waardeverschil van 2,5 naar 0,35; scheve keuzes van 31% naar 0%. Winkans testbot: Ontspannen 94%, Normaal 71%, Genadeloos 30%.

- Klokken: `zware-benen`, `dikke-mist`, `scheurende-stad`, `gesloten-lijnen`, `lege-zakken`, `slapeloze-nachten`, `geen-tweede-worp` en `geen-genade` werken al in de motor, maar zijn nog niet te kiezen.
- Klasseregels (in `data/klassen.json`): Kennis: elke spreuk zet de teller van je held 1 lager. Waarneming: held krijgt 1 Aanwijzing per toeslag, ontmaskerde vijanden nemen 2 schade extra. Kracht: Trofee. Charisma: zes bondgenoten. Zonder deze regels wonnen Kennis en Waarneming maar 5–7% op Normaal.
- Vermogens die in de brief niet goed in een kaartspel pasten, zijn iets aangepast: Thorne zet een vijand achteraan in zijn rij (in plaats van een vrij vak), Ashcombe geneest bij elke toeslag zijn zwakste gewonde bondgenoot 3 Leven (in plaats van te kiezen), Flynn begint met Bob, een politiehond met een Zegel.
- Kaarten met tijdelijke art (een plekbeeld): Een kort bevel, Visitekaartje, Een rijtuig bestellen, Tralies van de Yard, Bezwering van de zeven kaarsen. Ze staan nog niet in de beeldopdracht.
- *Na een verloren run* werkt: een gevallen bondgenoot kan terugkomen in de Logementen, gewond. Hij neemt nog geen talisman mee (die bestaan nog niet).
- De testbot speelt redelijk. Hij verplaatst zijn held naar achteren en gebruikt middeltjes eenvoudig; slimmer verplaatsen zou de winkans iets verhogen.
- Gevechten duren gemiddeld zo'n 18 beurten. Als dat te lang voelt: vijanden iets minder Leven, of golven sneller.

## Laatste meting

27 november 2026, alle vier klassen en alle 28 helden (8 runs per held, 56 per klasse), Vathrûn:

| Stand | Winkans | Kennis | Waarneming | Kracht | Charisma | Doel |
|---|---|---|---|---|---|---|
| Ontspannen | 87% | 91% | 93% | 86% | 77% | 85–90% |
| Normaal | 59% | 55% | 54% | 71% | 54% | 55–65% |
| Genadeloos | 27% | 18% | 29% | 39% | 23% | 25–35% |

- Kracht ligt op Normaal 13 punten boven het gemiddelde (doel: hooguit 10). De startbondgenoten van Kracht zijn al iets zwakker gemaakt; volgende stap is de Trofee alleen voor bondgenoten, niet voor de held.
- Genadeloos geeft vijanden nu +10% Leven (was +20%) en 80% van de Ponden.
- 56 runs per klasse geeft nog ongeveer ±6 punten ruis. Meer runs per held nodig om helden onderling te vergelijken.
- De meeste runs sneuvelen tegen Vathrûn zelf, daarna in de Scheuren (elite) en bij de Bisschop.
