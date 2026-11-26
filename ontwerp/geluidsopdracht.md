# Geluidsopdracht: geluiden maken met ElevenLabs

Het kaartspel hergebruikt de muziek, de sfeerlussen en de effecten van Londen 1888. Daarnaast heeft het ingebouwde, eenvoudige klanken. Zodra er een bestand met de juiste naam in `art/geluid/` staat, speelt het spel dat bestand in plaats van de ingebouwde klank. Wat ontbreekt, blijft gewoon werken.

## Stap voor stap in ElevenLabs

1. Open **Sound Effects**.
2. Plak de Engelse prompt uit de tabel. Engels werkt beter dan Nederlands.
3. Zet **Duration** op de duur uit de tabel (Auto uit) en **Prompt influence** op ongeveer 60%.
4. Klik op **Generate**, luister de varianten en kies er één.
5. Download als **MP3** met precies de bestandsnaam uit de tabel. Knip stilte aan het begin weg. Houd effecten onder de 100 KB.
6. Zet het bestand in `art/geluid/` en maak een pull request; of zet het in de Drive-map `kaartspel/geluid/`.

## Nieuwe effecten

| Bestand | Wanneer | Duur | Prompt |
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

Zolang `kaart-spelen`, `baas`, `dood`, `waanzin` en `golf` ontbreken, leent het spel `kaart`, `monster`, `slecht`, `onheil` en `gevaar` uit Londen 1888.

## Hergebruikt uit Londen 1888

- De acht muziekstukken (`muziek.mp3`, `muziek-2.mp3` … `muziek-8.mp3`), met titels in `data/muziek.json`.
- De sfeerlussen per oude god (`sfeer-vathrun.mp3` enzovoort) en `sfeer-start.mp3` voor het startscherm.
- `klik`, `kaart`, `goed`, `slecht`, `winst`, `verlies`, `schat`, `monster`, `onheil`, `gevaar`.
