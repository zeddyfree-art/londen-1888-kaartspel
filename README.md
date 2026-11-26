# Londen 1888: Het Kaartspel

Een roguelike deckbuilder in de wereld van [Londen 1888](https://github.com/zeddyfree-art/londen-1888). Je kiest een klasse en een held, trekt door één nacht in Londen over een kaart met paden, breidt je stapel uit en verslaat aan het eind een ontwakende oude god.

Het gevecht draait niet om mana maar om **tellers**: kaarten zijn gratis, maar elke kaart op het veld slaat pas toe als haar teller op 0 staat. De horror-kern is **Verlichting**: occulte kaarten worden sterker als je Geest onder de helft zakt.

## Spelen

De site staat op GitHub Pages en werkt offline als app (*Zet op beginscherm* op de iPad).

Lokaal:

```
node tools/bouw.js
cd site && python3 -m http.server 8000
```

## Werken aan het spel

Lees eerst `CLAUDE.md` (werkafspraken en opbouw) en `ontwerp/woordenlijst.md`.

| Wat | Waar |
|---|---|
| Spelregels (pure functies, geen DOM) | `app/motor/` |
| Scherm, slepen, animaties, geluid | `app/scherm/` |
| Kaarten, vijanden, goden, gevechten | `data/` |
| Kaartdata controleren | `node tools/controleer-kaarten.js` |
| Testbot | `node tools/testbot.js --gevechten 1000` of `--runs 300 --schrijf` |
| Art en geluid uit Londen 1888 halen | `node tools/kopieer-uit-londen.js ../londen-1888` |
| Monsters omzetten | `node tools/zet-monsters-om.js` |
| Helden omzetten | `node tools/maak-helden.js` |
| Nieuwe art en geluid | `ontwerp/beeldopdracht.md`, `ontwerp/geluidsopdracht.md` |
| Wat er nog moet | `ontwerp/te-doen.md` |
