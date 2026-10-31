/* Service worker: keeps a copy of the app on the phone so it opens with no
   signal. Bump CACHE whenever index.html changes, or phones keep the old one. */
var CACHE = 'survey-v8';
var FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  // cache: 'reload' goes past the browser's own short-term cache. Without it
  // an update can store the old page again - GitHub Pages lets browsers keep
  // files for ten minutes - and phones stay on the old version.
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    // Anything else goes to the network. Only with no signal does a page
    // address fall back to the app itself.
    return fetch(e.request).catch(function (err) {
      if (e.request.mode === 'navigate') return caches.match('./index.html');
      throw err;
    });
  }));
});
