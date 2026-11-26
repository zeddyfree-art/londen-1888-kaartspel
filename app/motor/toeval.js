// Seeded toeval. De toestand van de generator staat in het object zelf (veld `rng`),
// zodat een opgeslagen run of gevecht precies zo verder loopt als hij zou zijn gegaan.

export function maakSeed() {
  return (Math.random() * 2 ** 32) >>> 0;
}

/** Een getal in [0, 1). Schuift de generator in `t.rng` één stap op (mulberry32). */
export function willekeurig(t) {
  let a = (t.rng = (t.rng + 0x6d2b79f5) >>> 0);
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
}

export function geheel(t, n) {
  return Math.floor(willekeurig(t) * n);
}

export function kies(t, lijst) {
  return lijst.length ? lijst[geheel(t, lijst.length)] : undefined;
}

/** Schudt een kopie van de lijst. */
export function schud(t, lijst) {
  const a = lijst.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = geheel(t, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Kies `n` verschillende uit een lijst, met optionele gewichten (functie item → gewicht). */
export function kiesMeerdere(t, lijst, n, gewicht) {
  const pool = lijst.slice(), uit = [];
  while (uit.length < n && pool.length) {
    if (!gewicht) { uit.push(pool.splice(geheel(t, pool.length), 1)[0]); continue; }
    const g = pool.map(gewicht), som = g.reduce((s, x) => s + x, 0);
    let r = willekeurig(t) * som, i = 0;
    while (i < pool.length - 1 && (r -= g[i]) >= 0) i++;
    uit.push(pool.splice(i, 1)[0]);
  }
  return uit;
}
