// Arabyo service worker.
//
// Shell cache: the app shell (SHELL below) lives in 'arabyo-shell-vN'.
// IMPORTANT: bump SHELL_CACHE whenever any file in SHELL changes, so devices
// download the new version and drop the old shell cache.
//
// Content caches: the app (not this service worker) stores each level's files
// in caches named 'arabyo-content-level-<n>-v<contentVersion>'. This service
// worker never deletes any cache whose name starts with 'arabyo-content-'; it
// only serves level files from those caches when they are there.

const SHELL_CACHE = 'arabyo-shell-v2';
const CONTENT_PREFIX = 'arabyo-content-';

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
    caches.open(SHELL_CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

// Activate: remove old shell caches (never content caches), then take
// control of open pages.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (name) {
              return name !== SHELL_CACHE && name.indexOf(CONTENT_PREFIX) !== 0;
            })
            .map(function (name) { return caches.delete(name); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

// The path of url relative to this service worker's scope (for example
// 'content/levels.json'), or null if url is outside the scope.
function scopePath(url) {
  const base = new URL(self.registration.scope).pathname;
  return url.pathname.indexOf(base) === 0 ? url.pathname.slice(base.length) : null;
}

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const rel = scopePath(url);

  // Level files: from any cache if stored, otherwise from the network.
  // Nothing is stored here; the app fills the content caches itself.
  if (rel !== null && /^content\/level-\d+\//.test(rel)) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (cached) {
        return cached || fetch(req);
      })
    );
    return;
  }

  // Level list: network-first, keeping a copy for offline use.
  if (rel === 'content/levels.json') {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          if (res && res.ok) {
            const copy = res.clone();
            event.waitUntil(
              caches.open(SHELL_CACHE).then(function (cache) {
                return cache.put(req, copy);
              })
            );
          }
          return res;
        })
        .catch(function (err) {
          return caches.match(req, { ignoreSearch: true }).then(function (cached) {
            if (cached) return cached;
            throw err;
          });
        })
    );
    return;
  }

  // Everything else: cache-first.
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
