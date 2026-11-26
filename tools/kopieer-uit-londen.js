// Kopieert art en geluid uit een clone van Londen 1888 naar deze repo, en verkleint de afbeeldingen.
// Gebruik: node tools/kopieer-uit-londen.js [pad-naar-londen-1888]   (standaard: ../londen-1888)
// Verkleinen gebeurt met tools/verklein-art.py (Python + Pillow). Zonder Python wordt alleen gekopieerd.
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");
const root = path.join(__dirname, "..");
const bron = path.resolve(process.argv[2] || path.join(root, "..", "londen-1888"));
if (!fs.existsSync(path.join(bron, "art"))) { console.error(`Geen Londen 1888 gevonden in ${bron}`); process.exit(1); }

// map in Londen 1888 → map hier, en de grootste zijde in pixels (0 = niet verkleinen)
const mappen = {
  helden: 640, monsters: 640, personen: 640, spullen: 512, persoonlijk: 512, spreuken: 512, artefacten: 512,
  goden: 1400, scheur: 1400, plekken: 1400, bord: 2400, klokken: 256, fiches: 256, achterkanten: 640, scherm: 1600, geluid: 0,
};
// ook een paar gegevens die het kaartspel als bron gebruikt
const gegevens = ["helden.json", "monsters.json", "oude-goden.json", "persoonlijk.json", "personen.json", "spullen.json", "spreuken.json",
  "artefacten.json", "toestanden.json", "klokken.json", "epische-monsters.json", "muziek.json", "bord.json", "oude-wereld.json"];

let n = 0;
for (const [map, maat] of Object.entries(mappen)) {
  const van = path.join(bron, "art", map), naar = path.join(root, "art", map);
  if (!fs.existsSync(van)) continue;
  fs.mkdirSync(naar, { recursive: true });
  for (const f of fs.readdirSync(van)) {
    if (!/\.(jpg|jpeg|png|webp|mp3)$/i.test(f)) continue;
    if (map === "geluid" && /^sfeer-ow-/.test(f)) continue; // de Oude Wereld zit niet in het kaartspel
    fs.copyFileSync(path.join(van, f), path.join(naar, f)); n++;
  }
  if (maat) spawnSync("python3", [path.join(__dirname, "verklein-art.py"), naar, String(maat)], { stdio: "inherit" });
}
fs.mkdirSync(path.join(root, "bron"), { recursive: true });
for (const f of gegevens) if (fs.existsSync(path.join(bron, "data", f))) fs.copyFileSync(path.join(bron, "data", f), path.join(root, "bron", f));
console.log(`${n} bestanden gekopieerd uit ${bron}; brongegevens in bron/`);
