/* Offline: de pagina, scripts en data eerst van het netwerk (zodat updates doorkomen), afbeeldingen en geluid eerst uit de cache. */
const CACHE = "kaartspel1888-__VERSIE__";
const VOORAF = __BESTANDEN__;
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(VOORAF)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/art/") || url.pathname.includes("/icoon/")) {
    if (e.request.headers.has("range")) return; /* audio met bereikverzoeken: laat de browser het doen */
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const kopie = res.clone(); if (res.ok && res.status === 200) caches.open(CACHE).then(c => c.put(e.request, kopie)); return res; })));
  } else {
    e.respondWith(fetch(e.request).then(res => { const kopie = res.clone(); if (res.ok) caches.open(CACHE).then(c => c.put(e.request, kopie)); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  }
});
