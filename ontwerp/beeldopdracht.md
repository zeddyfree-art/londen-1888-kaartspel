# Beeldopdracht: nieuwe afbeeldingen voor Het Kaartspel

Het kaartspel hergebruikt illustraties uit Londen 1888 (`tools/kopieer-uit-londen.js`). Dit bestand bewaart de prompts voor eigen illustraties.

## Stand op 28 november 2026

- **Volledige lijst van wat er nog nodig is:** zie `beeldinventaris.md`. Die lijst gaat voor.

- **In het spel.** Het titelscherm, het hoofdkwartier, de vier klassenemblemen, de vier locaties onder Londen, zes barricades, acht Waanzin-kaarten, vijf kaarten uit fase 3 en de achterkant van de trekstapel hebben eigen illustraties. De tabellen behouden de oorspronkelijke prompts en bronformaten. De webversies staan als JPG in `art/`.
- **Personages en iconen.** Dragers gebruikt het groepsportret in `art/bondgenoten/dragers.jpg`. De bokser, sjouwer, agent, kruidenvrouw en het medium hebben eigen portretten in dezelfde map. Het oog van de speelkamer is beschikbaar als favicon en als geschilderd app-icoon in `app/icoon/`.
- **Knooppunten.** De routekaart gebruikt getekende SVG-symbolen voor alle speelbare haltes en voor de baas. De geschilderde medaillons uit §8 blijven een beeldoptie. De Occulte boekwinkel hoort bij fase 3.
- **Later.** Drie extra barricades, acht talismannen en de monsters voor de andere elf goden horen bij de uitbreiding van het spel. De Zegelbreker is reserve voor Vathrûn.

Het importscript leest een lijst met Drive-bestands-ID’s en schrijft de afbeeldingen als JPG naar `art/`. Koppel het nieuwe pad vervolgens in het scherm of de kaartdata.

## Werkwijze

1. Gebruik bij elke afbeelding de volledige prompt zoals hij er staat, met de stijlregel en de vermijden-regel erachter. Verander die regels niet.
2. Zet nooit tekst, letters of cijfers in een afbeelding. Namen en getallen tekent het spel er zelf overheen.
3. Lever PNG-bestanden op, met precies de bestandsnaam uit de tabel.
4. Zet ze in de Drive-map van Londen 1888, in een submap **kaartspel/** met dezelfde mapnamen als hieronder (bijvoorbeeld `kaartspel/barricades/zandzakken.png`). `tools/haal-art.py` haalt ze op en verkleint ze.
5. Kaarten zijn staand (5:7). De afbeelding vult het bovenste deel en wordt bijgesneden: houd het onderwerp in het midden, met wat ruimte eromheen.

**Stijlregel** (achter elke prompt):

> Late-Victorian oil painting, 1888 London, rich dark palette of soot black, deep teal and oxblood, warm amber gaslight against cold green-grey fog, visible loose brushstrokes and canvas texture, dramatic chiaroscuro, slightly uncanny atmosphere, museum-quality academic painting

**Vermijden** (achter elke prompt):

> no text, no letters, no captions, no watermark, no signature, no frame, no border, no modern objects, no photograph look, no 3D render, no anime, no gore

## 1. Titelscherm en hoofdkwartier

| Bestand | Formaat | Prompt | In het spel |
|---|---|---|---|
| `scherm/titel-kaartspel.png` | 16:9, 2560 × 1440 | a deck of worn Victorian playing cards fanned out on a dark wooden table beside a guttering candle, a revolver, a brass pocket watch and a sprig of dried herbs, behind them a rain-streaked window with the fog-bound Thames and the silhouette of Big Ben, one card face down glowing faintly violet | `art/scherm/titel-kaartspel.jpg` |
| `scherm/hoofdkwartier.png` | 16:9, 2560 × 1440 | the cluttered back room of an occult bookshop in Bloomsbury at night, shelves of crumbling grimoires, a cabinet of curiosities with jars and skulls, a large map of London pinned with red thread, a guest book open on a lectern, a tall grandfather clock, a single green-shaded lamp | `art/scherm/hoofdkwartier.jpg` |

## 2. Emblemen van de klassen

Een voorwerp, geen persoon, geen tekst. 1:1, 1024 × 1024.

| Bestand | Prompt |
|---|---|
| `klassen/kennis.png` | an open leather grimoire with faintly glowing violet sigils on yellowed pages, a brass astrolabe and a stub of candle beside it, on a dark velvet cloth |
| `klassen/waarneming.png` | a brass magnifying glass with a horn handle lying on a police dossier beside a small lit bullseye lantern, a single wet bootprint on the paper |
| `klassen/kracht.png` | a clenched fist in a worn leather boxing glove resting on a rough wooden barrel, brass knuckles and a coil of rope beside it |
| `klassen/charisma.png` | an ivory lace fan half open over an engraved calling card on a silver tray, a glass of claret and a single white glove |

## 3. Akte 3: onder Londen

3:2, 2048 × 1365. Achtergrond van de kaart in akte 3 en van de gevechten daar.

| Bestand | Prompt |
|---|---|
| `akte3/riolen.png` | the vaulted brick sewers of Bazalgette beneath London, black water flowing in a channel, iron walkways and a distant lantern, green mist rising from grates above |
| `akte3/ondergrondse.png` | an abandoned tunnel of the Metropolitan underground railway at night, a stalled steam locomotive in the dark, soot-black arches, a faint violet glow at the far end |
| `akte3/pestputten.png` | a forgotten medieval plague pit beneath Aldgate, exposed by excavation, piles of old earth and broken timber shoring, lanterns hung on poles, bones barely visible under the soil, no gore |
| `akte3/hart.png` | a vast ancient stone chamber deep below the Thames with a sealed door bearing seven wax seals, water seeping through the walls, a colossal pale eye faintly visible behind the cracks |

## 4. Barricades

1:1, 1024 × 1024. Een voorwerp dat je in een steeg of deuropening zet.

| Bestand | Prompt | In het spel |
|---|---|---|
| `barricades/omgevallen-kar.png` | an overturned wooden costermonger's cart lying on its side across a narrow cobbled alley, a wheel still turning, spilled cabbages, fog beyond | `art/barricades/omgevallen-kar.jpg` |
| `barricades/zandzakken.png` | a low wall of wet hessian sandbags stacked across a riverside warehouse door at night, a lantern on top | `art/barricades/zandzakken.jpg` |
| `barricades/glasscherven.png` | the top of an old brick wall set with jagged broken bottle glass catching gaslight, ivy and rain | `art/barricades/glasscherven.jpg` |
| `barricades/kruisbeeld-deur.png` | a tarnished silver crucifix nailed to a narrow doorway in a dark tenement, candle stubs on the step | `art/barricades/kruisbeeld-deur.jpg` |
| `barricades/kerkbank.png` | a heavy carved oak church pew dragged across a cobbled street as a barricade, hymn books scattered | `art/barricades/kerkbank.jpg` |
| `barricades/stormlantaarn-kist.png` | a brass storm lantern burning on top of a wooden shipping crate in a foggy alley, the light pushing the mist back | `art/barricades/stormlantaarn-kist.jpg` |
| `barricades/dragers.png` | a line of Egyptian porters in white galabeyas carrying baskets and crates through a foggy London dock at night | Afgerond met `art/bondgenoten/dragers.jpg` |
| `barricades/zoutkring.png` | a thick ring of coarse salt and iron filings poured on a stone floor, candles at four points, faint violet light inside | Later |
| `barricades/omgevallen-vaten.png` | a pile of rolled beer barrels blocking a narrow alley behind a public house, one leaking dark ale | Later |
| `barricades/ijzeren-hek.png` | a wrought-iron railing torn from a churchyard and propped across an alley, rusted spikes, fog | Later |

## 5. Talismannen

1:1, 1024 × 1024. Kleine voorwerpen die je aan een kaart hangt. Komen in fase 3.

| Bestand | Prompt |
|---|---|
| `talismannen/hoefijzer.png` | a rusty horseshoe on a leather thong, nailed through with a small iron cross |
| `talismannen/haarlok.png` | a lock of red hair tied with black ribbon inside an open silver locket |
| `talismannen/zoutzakje.png` | a tiny linen pouch of salt tied with red thread |
| `talismannen/rozenkrans.png` | a broken jet-black rosary with one bead missing, coiled on a dark cloth |
| `talismannen/wolfstand.png` | a yellowed wolf's tooth on a thin brass chain |
| `talismannen/sleutel.png` | a heavy old iron key with a ribbon of faded green silk |
| `talismannen/medaillon-oog.png` | a small enamel brooch painted with a single realistic eye, Victorian lover's eye |
| `talismannen/munt.png` | a worn Roman coin with a hole bored through it, threaded on string, mud from the Thames still on it |

## 6. Waanzin

1:1, 1024 × 1024. Beelden van verwarring en angst. Geen bloed, geen gore.

| Bestand | Prompt |
|---|---|
| `waanzin/achtervolgingswaan.png` | a lone figure glancing back over the shoulder in a gaslit alley, a long shadow behind them that does not match their shape |
| `waanzin/slapeloosheid.png` | a narrow bed in a cold attic room at night, rumpled sheets, a candle burnt down to nothing, an open eye reflected in a dark window |
| `waanzin/de-stemmen.png` | a figure pressing hands over their ears in a dim room, faint pale faces barely visible in the patterned wallpaper |
| `waanzin/grootheidswaan.png` | a man in a shabby coat standing on a crate in an empty fog-bound square, arms raised as if addressing a crowd that is not there |
| `waanzin/het-teken.png` | the same strange spiral symbol scratched into a wall dozens of times in chalk, a broken piece of chalk on the floor |
| `waanzin/natte-voeten.png` | a pair of bare feet on wooden floorboards in a bedroom, a trail of wet footprints and green river weed leading from the bed to the window |
| `waanzin/het-gefluister.png` | an ear-trumpet lying on a writing desk among scattered letters, one name repeated across every page |
| `waanzin/de-lach.png` | a theatre mask with a fixed grin hanging crookedly on a mirror, the reflection in the mirror not grinning |

## 7. Extra monsters

1:1, 1536 × 1536. Elke oude god moet minstens 6 gewone monsters hebben. Vathrûn heeft er 7 (met cultist en lantaarndrager erbij). De andere elf hebben er 5 en krijgen elk één nieuw monster, in fase 4.

| Bestand | God | Prompt |
|---|---|---|
| `monsters/zegelbreker.png` | Vathrûn (reserve) | a hunched riverman in an oilskin coat with seven wax seals hanging from his belt, holding a crowbar dripping with green slime, on the Thames foreshore at low tide |
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

## 8. Achterkant en knooppunten

| Bestand | Formaat | Prompt |
|---|---|---|
| `achterkanten/kaartspel.png` | 3:4, 1024 × 1365 | the ornate back of a Victorian playing card, dark teal and oxblood, a gold engraved clock face in the centre surrounded by fog and thorns, symmetrical, no letters |
| `knooppunten/<soort>.png` | 1:1, 512 × 512 | Eén rond medaillon per knooppunt (gevecht, scheur, markt, boekwinkel, logement, ziekenhuis, gaarkeuken, kerk, universiteit, seance, ontmoeting, club, kist): **a small round brass medallion engraved with a [crossed sabres / tear in the air / market scales / open book / lodging house door / red cross / soup bowl / church spire / mortarboard / candle / question mark shaped like a hook / cocktail glass / iron chest], dark enamel background** |

## 9. Nieuwe kaarten van fase 3

1:1, 1024 × 1024.

| Bestand | Prompt | In het spel |
|---|---|---|
| `kaarten/bevel.png` | a gloved hand pointing forward sharply in a foggy street, a group of rough men turning to follow the gesture, gaslight | `art/kaarten/bevel.jpg` |
| `kaarten/visitekaartje.png` | an engraved calling card with a family crest on a silver salver, a gloved hand reaching for it, candlelight | `art/kaarten/visitekaartje.jpg` |
| `kaarten/rijtuig-bestellen.png` | a black hansom cab pulling up at a foggy kerb at night, the driver tipping his hat, lamps glowing | `art/kaarten/rijtuig-bestellen.jpg` |
| `kaarten/tralies-yard.png` | a heavy iron cell door with bars, unbolted and propped across an alley as a barricade, a police lantern hanging from it | `art/kaarten/tralies-yard.jpg` |
| `kaarten/zeven-kaarsen.png` | seven tall black candles in a circle on a stone floor, one already guttering out, faint violet smoke rising | `art/kaarten/zeven-kaarsen.jpg` |

## 10. Statustexturen

Op zuiver zwart geschilderd, zonder de stijlregel. In het spel omgezet naar doorzichtige PNG (alfa = helderheid), 512 px.

| Bron | Prompt | In het spel |
|---|---|---|
| `status/vuur.png` | tongues of orange and crimson flame rising from the bottom edge, embers drifting upwards, painterly, isolated on a pure black background | `art/status/vuur.png` (Woede) |
| `status/gif.png` | thick toxic green slime dripping down from the top edge in long drops, glowing faintly, painterly, isolated on a pure black background | `art/status/gif.png` (Pest) |
| `status/mist.png` | soft drifting banks of pale yellow-grey fog, wispy and layered, painterly, isolated on a pure black background | `art/status/mist.png` (Mist) |
| `status/schild.png` | the inner rim of a protective bubble of pale blue arcane light, seen from inside: a bright thin glowing line running along all four edges of a tall rectangular frame, with a faint honeycomb lattice of light only within the outer tenth of the image, fading out quickly towards the centre; a few tiny blue sparks along the rim; the entire centre of the image, about seventy percent, is completely empty pure black; no shield shape, no object, no emblem, no symbol in the middle; tall portrait format 5:7; painterly, isolated on a pure black background, no text | `art/status/schild.png` (Bescherming) |
| `status/zegel.png` | a curse creeping in from the border: small glowing violet occult glyphs, broken arcs of runes and hair-thin lines clustered in the four corners and along the left and right edges of a tall rectangular frame, with thin wisps of violet smoke curling between them; the centre of the image, about sixty-five percent, is completely empty pure black so a face behind it stays visible; no pentagram, no star, no full circle, no large central sigil; tall portrait format 5:7; painterly, isolated on a pure black background, no text | `art/status/zegel.png` (Vervloekt) |
