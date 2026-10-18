/* Kickass Case Builder service worker.
   Keeps a copy of the app so it opens with no connection.
   Every file is fetched fresh whenever the network is there, so updates arrive
   on the next visit; the stored copy is used only when offline.
   It never touches the user's case data, which lives in IndexedDB on the device. */
var CACHE = 'kickasscase-__V__';
var SHELL = ['/', '/app.css?v=__V__', '/app.js?v=__V__', '/features.js?v=__V__', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-180.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // network first for everything, so a new version is always picked up together;
  // the stored copy is used only when there is no connection
  var key = (req.mode === 'navigate' || url.pathname === '/index.html') ? '/' : req;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(key, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(key).then(function (r) { return r || caches.match(req); });
  }));
});
