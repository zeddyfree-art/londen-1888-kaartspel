# Werkafspraken

- **Na elke aanpassing:** een pull request maken naar `main` en die zelf mergen. De workflow `.github/workflows/pages.yml` bouwt de site (`node tools/bouw.js`) en zet hem op GitHub Pages.
- **Bij elke update die spelers merken:** een nieuw bericht bovenaan `data/nieuws.json` (hoger `id`), getoond als *Wat is er nieuw*, en een regel in `ontwerp/te-doen.md`.
- **Alle teksten in het spel zijn Nederlands.** Code, bestandsnamen en data-sleutels ook.
- **Vaste woorden:** gebruik overal de termen uit `ontwerp/woordenlijst.md` (Treffer, Schade, Gruwel, Toeslaan, Spelen, Afleggen, Verbannen, Trekken, Schudden).
- **Bronnen:** clone `zeddyfree-art/londen-1888` naast deze repo. `node tools/kopieer-uit-londen.js` haalt de art, het geluid en de brongegevens (`bron/`) daaruit.

# Documenten

- `ontwerp/brief.md`: de oorspronkelijke opdracht met alle fasen.
- `ontwerp/te-doen.md`: stand van de fasen, open punten, laatste balansmeting.
- `ontwerp/beeldinventaris.md`: alle beelden die nog gemaakt moeten worden, met prompts. `ontwerp/beeldopdracht.md` bewaart de prompts van wat al gemaakt is.
- `ontwerp/overdracht.md`: een startprompt voor een nieuwe sessie.

# Opbouw

- `app/motor/`: de spelregels als pure functies, zonder DOM. Eén toestand als gewoon JSON-object. Al het toeval via `motor/toeval.js` (seeded).
  - `gevecht.js`: slagveld, tellers, treffers, statussen, golven, Geest en Verlichting. `doe(g, actie)` geeft `{ g, ev }`.
  - `effecten.js`: de effectsoorten (`schade`, `status`, `teller`, …). Effecten zijn data.
  - `run.js`: de kaart met paden, knooppunten, beloningen. `runActie(run, actie)`.
  - `tekst.js`: kaarttekst gegenereerd uit de effecten.
- `app/scherm/`: tekent de toestand en speelt de gebeurtenissen af als animaties en geluid.
- `data/`: kaarten, vijanden, bazen, goden, gevechten, artefacten, ontmoetingen. `tools/controleer-kaarten.js` controleert de vorm.
- `tools/testbot.js`: speelt gevechten en runs zonder scherm. Gebruik `--gevechten 1000` of `--runs 300 --schrijf` (schrijft `ontwerp/balans.json`).

# Controleren voor een PR

```
node tools/controleer-kaarten.js
node tools/testbot.js --gevechten 200
node tools/bouw.js
```
