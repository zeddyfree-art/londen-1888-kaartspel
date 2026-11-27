# Te doen

Per fase uit de brief een regel; bovenaan wat er nu speelbaar is. De laatste meting van de testbot staat onderaan (volledig in `ontwerp/balans.json`).

## Fasen

- [x] **Fase 0. Opzet.** Repo, `CLAUDE.md`, PWA (manifest, service worker, offline), `tools/bouw.js`, Pages-workflow, `tools/kopieer-uit-londen.js`, woordenlijst.
- [x] **Fase 1. Gevecht.** Motor met tellers, rijen, golven, de beurt, het politiefluitje, terugroepen, alle 10 statussen, Gruwel, Geest, Verlichting en Waanzin. Kracht, Vathrûn. Testbot speelt 1000 gevechten in een paar seconden.
- [x] **Fase 2. Run.** Kaart van Londen met paden, alle knooppunten behalve de Occulte boekwinkel, kaartbeloningen, winkel, rust met een keuze, ontmoetingen, opslaan en hervatten, de drie bazen van Vathrûn (Moeder Brine, de Bisschop van het Slib, Vathrûn in drie fasen).
- [ ] **Fase 3. Klassen.** Kennis, Waarneming en Charisma met hun pools (±25 kaarten per klasse), Aanwijzingen en Deducties, Overtuigen. Alle 28 helden met vermogen in het spel (de 7 van Kracht werken al). Kracht en Londen aanvullen tot 25 en 30 kaarten. Talismannen (±15). Meer artefacten (25). Occulte boekwinkel.
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

- Klokken: `zware-benen`, `dikke-mist`, `scheurende-stad`, `gesloten-lijnen`, `lege-zakken`, `slapeloze-nachten`, `geen-tweede-worp` en `geen-genade` werken al in de motor, maar zijn nog niet te kiezen.
- Vermogens van helden buiten Kracht staan als tekst klaar in `tools/maak-helden.js`; de motor kent ze nog niet.
- *Na een verloren run* werkt: een gevallen bondgenoot kan terugkomen in de Logementen, gewond. Hij neemt nog geen talisman mee (die bestaan nog niet).
- De testbot speelt redelijk. Hij verplaatst zijn held naar achteren en gebruikt middeltjes eenvoudig; slimmer verplaatsen zou de winkans iets verhogen.
- Gevechten duren gemiddeld zo'n 18 beurten. Als dat te lang voelt: vijanden iets minder Leven, of golven sneller.

## Laatste meting

26 november 2026, 105 runs per stand, alle 7 Kracht-helden, Vathrûn:

| Stand | Winkans testbot | Doel |
|---|---|---|
| Ontspannen | 96% | 85–90% |
| Normaal | 70% | 55–65% |
| Genadeloos | 27% | 25–35% |

- De meeste runs sneuvelen tegen Vathrûn zelf (akte 3). Op Genadeloos ook bij de Bisschop en in de Scheuren.
- Per held (Normaal, 15 runs elk, dus nog ruis): Hale en Singh 87%, Ang Nima 80%, Pruitt 73%, Hu Yiping 60%, Fathy 53%, Bray 47%. Bray en Fathy krijgen hun voordeel buiten het gevecht; meer runs nodig voor een oordeel.
- Normaal en Ontspannen zijn iets te makkelijk. Volgende stap: vijanden in akte 2 en 3 iets sterker, of minder herstel tussen de akten.
- Gemiddeld 18 beurten per gevecht, 10 gevechten per gewonnen run.
