# Beeldinventaris: alles wat nog nodig is om het spel af te maken

*28 november 2026. Opgesteld omdat het abonnement op de beeldgenerator binnenkort afloopt.* Dit is de volledige lijst voor fase 3 tot en met 6. Wat hier niet staat, is er al of wordt in CSS en SVG getekend.

## Samenvatting

| Groep | Aantal | Prioriteit | Waarom |
|---|---|---|---|
| A1. Talismannen | 10 | **Nodig** | Nu tijdelijk de achterkant van de artefactkaarten. |
| A2. Kaarten met een tijdelijk beeld | 9 | **Nodig** | Nu een plekbeeld, een achterkant of het gezicht van een latere baas. |
| A3. Monsters voor de andere goden (fase 4) | 12 | **Nodig** | Elke god heeft minstens 6 gewone monsters nodig; elf hebben er 5. |
| A4. Luitenants (fase 4) | 2 | **Nodig** | Ulvereth en Sirrhae hebben geen bruikbaar baasportret. |
| A5. Hoofdkwartier: zes hoeken (fase 5) | 6 | Sterk aanbevolen | Elke hoek ontgrendelt iets; een eigen beeld maakt de voortgang zichtbaar. |
| A6. Einde van de run | 2 | Sterk aanbevolen | Dageraad bij winst, verzwolgen door de mist bij verlies. |
| A7. Occulte boekwinkel | 1 | Sterk aanbevolen | Nieuw knooppunt; nu het straatbeeld van Soho. |
| **Totaal nodig en aanbevolen** | **42** | | |
| B1. Knooppunt-medaillons | 14 | Mooi | De kaart gebruikt nu getekende symbolen. Die werken. |
| B2. Statustexturen | 0 | Klaar | Vuur, gif, mist, schild en zegel zitten erin (28 november). |
| B3. Extra barricades | 3 | Mooi | Meer variatie voor Kracht. |
| **Totaal mooi** | **17** | | |

**Advies.** Maak eerst A1 tot en met A4 (33 beelden): daarmee zijn fase 3 en 4 inhoudelijk af. Daarna A5 tot en met A7 (9 beelden). B alleen als er tijd over is.

## Wat je níet hoeft te maken

- **Goden en hun Scheur-locatie.** Alle 12 goden hebben een portret (`art/goden/`) en een Scheurbeeld (`art/scheur/`). Dat laatste wordt de achtergrond van het eindgevecht in akte 3 voor die god.
- **Epische monsters.** Alle 12 staan in `art/monsters/` (de Dichter zonder Ogen, de Anatoom …).
- **Luitenants van tien goden.** Croft, Harrowgate, Greaves, Grieve, Crewe, Quill, Fell, Vance, Kettering en Moeder Brine staan in `art/personen/`.
- **Ontmoetingen van de andere goden.** Die gebruiken de 38 personages en 23 plekken die er al zijn.
- **Fasen van een oude god.** De drie gedaanten van een god krijgen een CSS-filter (groen water, gele mist, rood licht), geen nieuwe schilderijen.
- **Statussen, kaartranden, tellers, iconen.** Allemaal CSS en SVG.
- **De 9 nieuwe artefacten, 5 talismannen en 17 nieuwe kaarten** van deze ronde gebruiken beelden die er al waren, maar nog nergens werden gebruikt.

## Werkwijze

Precies zoals in `beeldopdracht.md`. Kort:

1. Plak de prompt, dan de **stijlregel**, dan de **vermijden-regel**. Verander die twee niet.
2. Nooit tekst, letters of cijfers in het beeld.
3. PNG, met precies de bestandsnaam uit de tabel. Zet ze in de Drive-map `kaartspel/` met dezelfde submappen.
4. Kaarten zijn staand en worden bijgesneden: houd het onderwerp in het midden.

**Stijlregel:**

> Late-Victorian oil painting, 1888 London, rich dark palette of soot black, deep teal and oxblood, warm amber gaslight against cold green-grey fog, visible loose brushstrokes and canvas texture, dramatic chiaroscuro, slightly uncanny atmosphere, museum-quality academic painting

**Vermijden:**

> no text, no letters, no captions, no watermark, no signature, no frame, no border, no modern objects, no photograph look, no 3D render, no anime, no gore

**Tip voor een aflopend abonnement.** Werk per groep. Maak bij portretten en monsters twee varianten en kies er één; bij voorwerpen is één poging meestal genoeg. Bewaar alles eerst in de Drive en kies later.

---

## A1. Talismannen (10)

1:1, 1024 × 1024. Een klein voorwerp, groot in beeld, donkere achtergrond. Ze verschijnen als rond medaillon op een kaart: houd het voorwerp gecentreerd met ruimte eromheen.

| Bestand | Prompt |
|---|---|
| `talismannen/hoefijzer.png` | a rusty horseshoe on a leather thong, nailed through with a small iron cross, close up on dark velvet |
| `talismannen/haarlok.png` | a lock of red hair tied with black ribbon inside an open silver locket, close up on dark velvet |
| `talismannen/zoutzakje.png` | a tiny linen pouch of coarse salt tied with red thread, a few grains spilled, close up on dark wood |
| `talismannen/rozenkrans.png` | a broken jet-black rosary with one bead missing, coiled on a dark cloth, faint candlelight |
| `talismannen/wolfstand.png` | a yellowed wolf's tooth on a thin brass chain, close up on dark velvet |
| `talismannen/sleutel.png` | a heavy old iron key with a ribbon of faded green silk, close up on dark wood |
| `talismannen/medaillon-oog.png` | a small enamel brooch painted with a single realistic human eye, a Victorian lover's eye, gold rim, close up |
| `talismannen/rivieremunt.png` | a worn Roman coin with a hole bored through it, threaded on string, grey Thames mud still in the engraving, close up |
| `talismannen/rouwband.png` | a black crepe mourning armband with a small jet brooch pinned to it, folded on a dark table |
| `talismannen/uilenveer.png` | a single pale barn owl feather tied with a thread of silver wire, close up on dark velvet, soft moonlight |

## A2. Kaarten met een tijdelijk beeld (9)

1:1, 1024 × 1024.

| Bestand | Kaart | Prompt | Nu |
|---|---|---|---|
| `kaarten/het-motief.png` | Het motief (Waarneming) | a detective's desk at night covered in photographs connected by red string, one photograph circled in ink, a single lamp | `achterkanten/mysterie.jpg` |
| `kaarten/arrestatie.png` | Arrestatie (Waarneming) | a pair of Victorian iron handcuffs snapping shut around a gloved wrist, a police lantern behind, rain | `plekken/whitehall.jpg` |
| `kaarten/rondje-van-de-zaak.png` | Rondje van de zaak (Charisma) | a crowded Soho public house at night, a gentleman raising his glass as rough men around him cheer, warm gaslight and smoke | `plekken/soho.jpg` |
| `kaarten/vleierij.png` | Vleierij (Charisma) | a lady in an evening gown whispering into the ear of a stern man while two others glare at each other behind her, a Mayfair salon | `plekken/mayfair.jpg` |
| `kaarten/beloning-uitloven.png` | Een beloning uitloven (Charisma) | a hand slapping a wanted poster without words onto a brick wall, a purse of coins tied beneath it, a crowd gathering in the fog | `plekken/city.jpg` |
| `kaarten/zang-sirene.png` | Zang van de sirene (Charisma) | a singer on a dim music-hall stage, her mouth open in song, the audience in the stalls swaying with glassy eyes | `plekken/leicester-square.jpg` |
| `kaarten/toespraak.png` | Een toespraak op een kist (Charisma) | a ragged but fiery orator standing on an orange crate in a foggy East End street, a crowd of dockworkers raising their fists | `plekken/spitalfields.jpg` |
| `kaarten/aanbod.png` | Een aanbod dat hij niet weigert (Charisma) | a gloved hand sliding a signed contract and a small stack of gold sovereigns across a dark desk towards a nervous cultist in a hood | `achterkanten/spullen.jpg` |
| `kaarten/goed-woord.png` | Een goed woord (Charisma) | a gentleman resting a friendly hand on the shoulder of a hesitant hooded cultist in a foggy alley, the cultist lowering his knife | `personen/edmund-haversham.jpg` (wordt de luitenant van Sirrhae) |

## A3. Monsters voor de andere goden (12)

1:1, 1536 × 1536. Eén per god, zodat elke god zes gewone monsters heeft. De prompts staan ook in `beeldopdracht.md` §7.

| Bestand | God | Prompt |
|---|---|---|
| `monsters/spiegeldrager.png` | Azh-Ilareth | a footman in livery carrying a tall mirror that shows a burning star instead of his reflection |
| `monsters/balsemer.png` | Nebet-Ankhu | a gaunt figure in linen wrappings and a borrowed Victorian top hat, carrying jars of natron |
| `monsters/meidoornkind.png` | Ysmara | a pale child in a nightgown with hawthorn twigs growing through her hair, standing barefoot in a misty park |
| `monsters/snijzaalassistent.png` | Morghast | a hospital orderly in a stained apron carrying a covered stretcher through a gaslit corridor, his face hidden by a surgical mask |
| `monsters/lam-van-de-kudde.png` | Ommeth | a woman in a grey shawl with blank white eyes, walking in step with an unseen crowd down a Spitalfields street |
| `monsters/reliekschrijn.png` | Karathos | a walking medieval reliquary of gold and glass, a severed saint's hand visible inside, lurching across a museum gallery |
| `monsters/ijsventer.png` | Ulvereth | a street seller with frost growing over his coat and his barrow of ice, his breath hanging frozen in the air |
| `monsters/salonzanger.png` | Sirrhae | a handsome singer in evening dress at a piano, his mouth open in song, the guests around him frozen in rapture |
| `monsters/uurwerkhond.png` | Ouroch | a hound made of brass cogs and clock springs, its eyes two ticking watch faces |
| `monsters/zetduivel.png` | Yth-Nemora | a small inky creature made of tangled lead type crawling out of a printing press |
| `monsters/incasseerder.png` | Gul-Marrach | a faceless debt collector in a bowler hat with a ledger chained to his wrist, standing in a workhouse doorway |
| `monsters/zegelbreker.png` | Vathrûn (reserve) | a hunched riverman in an oilskin coat with seven wax seals hanging from his belt, holding a crowbar dripping with green slime, on the Thames foreshore at low tide |

## A4. Luitenants (2)

3:4, 1024 × 1365. De baas van akte 1. Tien goden hebben al een geschikt portret. Voor Ulvereth zijn alle drie de personages bondgenoten in het spel, en Sirrhae heeft geen gezicht.

| Bestand | God | Prompt |
|---|---|---|
| `personen/windroos-meester.png` | Ulvereth | a gaunt Victorian meteorologist in a frost-rimed greatcoat on a rooftop observatory, an iron weather vane spinning wildly behind him, his eyes pale as ice, snow falling upwards around him |
| `personen/gastvrouw.png` | Sirrhae | a tall hostess in a black silk gown in a candlelit Mayfair salon, her face entirely hidden behind an open painted fan, guests frozen mid-gesture around her, one gloved hand beckoning |

## A5. Hoofdkwartier: zes hoeken (6)

4:3, 1600 × 1200. Elk een hoek van dezelfde achterkamer van de occulte boekwinkel in Bloomsbury (zelfde licht, hetzelfde hout als `scherm/hoofdkwartier.jpg`).

| Bestand | Hoek (wat je ontgrendelt) | Prompt |
|---|---|---|
| `hoofdkwartier/rariteitenkabinet.png` | Spullen en barricades | a tall glass-fronted cabinet of curiosities in a dark bookshop back room, shelves of strange weapons, a revolver, jars, a crowbar and a brass lantern, warm lamplight |
| `hoofdkwartier/leeszaal.png` | Spreuken en talismannen | a reading corner with a leather armchair, a lectern holding a huge open grimoire, candles, small charms hanging on threads from a beam |
| `hoofdkwartier/gastenboek.png` | Bondgenoten | a heavy guest book open on a writing desk, many different handwritings on the pages, calling cards and old photographs tucked between the leaves |
| `hoofdkwartier/kaartentafel.png` | Knooppunten en ontmoetingen | a large table covered with a map of London, pins and red thread, a magnifying glass and a cold cup of tea |
| `hoofdkwartier/wachtkamer.png` | Helden | a narrow waiting room with a wooden bench, coats and hats on pegs belonging to very different people, a stethoscope, a cricket bat, a lady's parasol |
| `hoofdkwartier/torenklok.png` | Klokken | the inside of a tall grandfather clock face seen up close, thirteen hours on its dial painted without numerals, brass gears, a pendulum swinging |

## A6. Einde van de run (2)

16:9, 2560 × 1440.

| Bestand | Wanneer | Prompt |
|---|---|---|
| `scherm/dageraad.png` | Gewonnen | dawn breaking over the Thames, the last yellow fog lifting from the water, Tower Bridge under construction in silhouette, a lone figure on the embankment watching the sunrise, exhausted but alive |
| `scherm/verzwolgen.png` | Verloren | thick yellow-green fog swallowing a gaslit London street, a dropped lantern still burning on the cobbles, a vast pale shape barely visible in the mist above the rooftops |

## A7. Occulte boekwinkel (1)

16:9, 2560 × 1440. Achtergrond van het nieuwe knooppunt.

| Bestand | Prompt |
|---|---|
| `plekken/occulte-boekwinkel.png` | the cramped front of an occult bookshop in Soho at night, towering shelves of crumbling books, a counter with a brass bell and a tray of small amulets, a narrow staircase to a back room, green-shaded lamp |

---

## B1. Knooppunt-medaillons (14)

1:1, 512 × 512. Rond medaillon, gecentreerd. Prompt per symbool: **a small round brass medallion engraved with [SYMBOOL], dark enamel background, centered**.

| Bestand | Symbool |
|---|---|
| `knooppunten/gevecht.png` | crossed sabres |
| `knooppunten/baas.png` | a crown of thorns |
| `knooppunten/scheur.png` | a tear in the air with violet light behind it |
| `knooppunten/markt.png` | market scales |
| `knooppunten/boekwinkel.png` | an open book with a small eye on the page |
| `knooppunten/logement.png` | a lodging house door with a lamp |
| `knooppunten/ziekenhuis.png` | a red cross |
| `knooppunten/gaarkeuken.png` | a steaming soup bowl |
| `knooppunten/kerk.png` | a church spire |
| `knooppunten/universiteit.png` | an academic mortarboard |
| `knooppunten/seance.png` | a single candle flame |
| `knooppunten/ontmoeting.png` | a question mark shaped like a hook |
| `knooppunten/club.png` | a cocktail glass |
| `knooppunten/kist.png` | an iron-bound chest |

## B2. Statustexturen (klaar)

Alle vijf zitten in het spel; de prompts staan in `beeldopdracht.md` §10. Nieuwe statustexturen (bijvoorbeeld voor Gezegend, Angst of Bekoring) volgen dezelfde regels:

- De laag ligt over het **hele portret van een kaart op het veld** (staand, 5:7, op een telefoon 70 tot 120 pixels breed). Alles wat licht is, ligt óver het gezicht.
- **Het midden moet leeg zijn.** Het effect zit aan de randen, of komt van één kant (onder of boven), nooit als een voorwerp in het midden.
- **Zuiver zwart (#000)** waar niets is. Staand 1024 × 1434, of 1:1 voor effecten die van één kant komen.
- Omzetten: `python3 -I tools/maak-statuslaag.py <bron.png> art/status/<naam>.png`, daarna de laag in `app/stijl.css` op het beeld zetten.

## B3. Extra barricades (3)

1:1, 1024 × 1024. Prompts staan in `beeldopdracht.md` §4: `barricades/zoutkring.png`, `barricades/omgevallen-vaten.png`, `barricades/ijzeren-hek.png`.

---

## Na het genereren

1. Zet de PNG's in de Drive-map `kaartspel/` (dezelfde submappen als hierboven).
2. Zet de Drive-ID's in `tools/art-drive.json`, bijvoorbeeld `{"talismannen/hoefijzer": "<id>"}`, en draai `python3 -I tools/haal-art.py tools/art-drive.json`.
3. Zet in de data het `art`-pad op het nieuwe bestand en haal `artTijdelijk` weg. Voor talismannen in `data/talismannen.json`, voor kaarten in het JSON-bestand van hun soort.
4. `node tools/controleer-kaarten.js` meldt elk pad dat niet bestaat.
