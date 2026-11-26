// Bouwt de site: site/ met index.html, de scripts, data, art, iconen en offline-ondersteuning.
// Gebruik: node tools/bouw.js
import fs from "fs";
import path from "path";
import crypto from "crypto";
const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const site = path.join(root, "site");
fs.rmSync(site, { recursive: true, force: true });
const lijst = dir => fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir), { recursive: true }).map(f => path.join(dir, f)).filter(f => fs.statSync(path.join(root, f)).isFile()) : [];
const kopieer = (van, naar) => { fs.mkdirSync(path.dirname(path.join(site, naar)), { recursive: true }); fs.copyFileSync(path.join(root, van), path.join(site, naar)); };

const bestanden = [];
// de app zelf: app/... komt in de wortel van de site
for (const f of lijst("app")) { if (f.endsWith("sw.js")) continue; const doel = f.replace(/^app[\/\\]/, ""); kopieer(f, doel); bestanden.push(doel); }
for (const f of lijst("data")) { kopieer(f, f); bestanden.push(f); }
for (const f of lijst("art")) if (/\.(jpg|png|webp|mp3)$/i.test(f)) { kopieer(f, f); bestanden.push(f); }
// welke geluiden er zijn, zodat het spel alleen bestaande bestanden laadt
const geluiden = lijst("art/geluid").filter(f => f.endsWith(".mp3")).map(f => path.basename(f, ".mp3")).sort();
fs.writeFileSync(path.join(site, "data/geluiden.json"), JSON.stringify(geluiden) + "\n"); bestanden.push("data/geluiden.json");
// de geschatte winkans per stand, uit de laatste meting van de testbot
const balans = path.join(root, "ontwerp/balans.json");
if (fs.existsSync(balans)) {
  const b = JSON.parse(fs.readFileSync(balans, "utf8"));
  const w = { datum: b.datum, standen: Object.fromEntries(Object.entries(b.standen || {}).map(([k, v]) => [k, v.winkans])) };
  fs.writeFileSync(path.join(site, "data/winkans.json"), JSON.stringify(w) + "\n"); bestanden.push("data/winkans.json");
}

const h = crypto.createHash("sha1");
for (const f of bestanden.filter(f => !f.startsWith("art/"))) h.update(f).update(fs.readFileSync(path.join(site, f)));
const versie = h.digest("hex").slice(0, 10);
const vooraf = ["./", ...bestanden.filter(f => !f.startsWith("art/") && !f.endsWith(".webmanifest") || f === "manifest.webmanifest")];
fs.writeFileSync(path.join(site, "sw.js"), fs.readFileSync(path.join(root, "app/sw.js"), "utf8").replace("__VERSIE__", versie).replace("__BESTANDEN__", JSON.stringify(vooraf)));
fs.writeFileSync(path.join(site, ".nojekyll"), "");
console.log(`Gebouwd: site/ (${bestanden.length + 1} bestanden, versie ${versie})`);
