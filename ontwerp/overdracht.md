# Overdracht voor een nieuwe sessie

*28 november 2026, na fase 3.* Plak de prompt hieronder in een nieuwe chat. Alles wat de nieuwe sessie nodig heeft, staat in de repo.

## Prompt

> We werken verder aan **Londen 1888: Het Kaartspel**, repo `zeddyfree-art/londen-1888-kaartspel` (branch `main`). Clone ook `zeddyfree-art/londen-1888` ernaast; dat is het bordspel waar art, lore en data vandaan komen.
>
> Lees eerst, in deze volgorde:
> 1. `CLAUDE.md`: de werkafspraken (na elke aanpassing een PR naar `main` en zelf mergen, nieuws in `data/nieuws.json`, een regel in `ontwerp/te-doen.md`, alles in het Nederlands) en de opbouw van de code.
> 2. `ontwerp/brief.md`: de oorspronkelijke opdracht, met alle fasen.
> 3. `ontwerp/te-doen.md`: wat er af is, wat er open staat, en de laatste balansmeting.
> 4. `ontwerp/beeldinventaris.md`: welke beelden nog gemaakt worden en hoe ze in het spel komen.
>
> Fase 0 tot en met 3 zijn klaar: vier klassen, 28 helden, Vathrûn als enige god, talismannen, artefacten, de Occulte boekwinkel en zichtbare statuslagen op de kaarten. **Ga verder met fase 4: de andere elf oude goden.** Begin met één god helemaal (monsters, gevechten per akte, godsregel, luitenant, episch monster, eindbaas met fasen, vier ontmoetingen), meet met de testbot, en doe dan de rest.
>
> Controleer voor elke PR: `node tools/controleer-kaarten.js`, `node tools/testbot.js --gevechten 200` en `node tools/bouw.js`. Meet de balans met `node tools/testbot.js --runs 224 --schrijf`; die toont de winkans per stand en per klasse, en per klasse hoe vaak de held verlicht is en hoeveel Waanzin hij oploopt.

## Wat de nieuwe sessie moet weten

- **Motor en scherm zijn strikt gescheiden.** `app/motor/` heeft geen DOM. Een gevecht verandert alleen via `doe(g, actie)`, een run via `runActie(run, actie)`. Het scherm speelt de gebeurtenissen (`ev`) af.
- **Kaarten zijn data.** Effecten staan in JSON (`{ doe, aantal, op, ... }`), de kaarttekst wordt eruit gegenereerd (`app/motor/tekst.js`). Een nieuwe effectsoort: toevoegen in `app/motor/effecten.js`, in `tekst.js` en in de controle.
- **Klasseregels** staan in `data/klassen.json` (`verlichtZonderPrijs`, `ritueelGeest`, `heldAanwijzing`, `ontmaskerdExtra`, `maxBondgenoten` …). **Heldvermogens** staan in `tools/maak-helden.js`; draai dat script na een wijziging.
- **Goden:** `data/goden.json` (uit `tools/zet-monsters-om.js`), gevechten per god en akte in `data/gevechten.json`, bazen in `data/bazen.json`. Een eindbaas met fasen staat in `bazen.json` onder `fasen`; zie Vathrûn als voorbeeld. Nog geen god behalve Vathrûn heeft `speelbaar: true`.
- **Luitenants** voor fase 4 staan in `art/personen/`, behalve voor Ulvereth en Sirrhae (die staan in de beeldinventaris). Haversham en Kettering zijn tijdelijk het beeld van twee Charisma-kaarten.
- **Akte 3** van een god gebruikt `art/scheur/<god>.jpg` als achtergrond van het eindgevecht.
- **Andere sessies** werken soms aan het uiterlijk (de speelkamer, het slagveld, de kaart van Londen). Haal altijd eerst `main` op.
