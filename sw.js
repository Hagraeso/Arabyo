// Arabyo service worker: keeps the app shell available offline.
//
// IMPORTANT: bump CACHE (e.g. 'arabyo-shell-v2') whenever any file in SHELL
// changes, so devices download the new version and drop the old one.
//
// Later steps will add separate per-level content caches (for example
// 'arabyo-level-0-v1'). Those must be kept by the activate handler below,
// which currently deletes every cache that is not the current shell cache.

const CACHE = 'arabyo-shell-v1';

// Every file the empty app needs to start. All paths are relative to this
// file, so the app works at a domain root or inside a subfolder.
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// Install: download and store the whole shell, then activate right away.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

// Activate: remove old shell caches, then take control of open pages.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (name) { return name !== CACHE; })
            .map(function (name) { return caches.delete(name); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Fetch: cache-first for same-origin GET requests.
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req).catch(function (err) {
        // Offline and not cached: for page loads, show the app shell.
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw err;
      });
    })
  );
});
