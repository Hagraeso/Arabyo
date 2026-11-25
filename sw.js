// Arabyo service worker.
//
// Shell cache: the app shell (SHELL below) lives in 'arabyo-shell-vN'.
// IMPORTANT: bump SHELL_CACHE whenever any file in SHELL changes, so devices
// download the new version and drop the old shell cache.
//
// Content caches: the app (not this service worker) stores each level's files
// in caches named 'arabyo-content-level-<n>-v<contentVersion>'.
// This service worker serves a level file only from the cache of that level's
// current contentVersion, read from the content/levels.json copy kept in the
// shell cache. It looks the file up by its clean URL (no query string) and
// never uses another version's cache. If the file is not there, or levels.json
// is missing or unreadable, it fetches the file from the network without
// storing it. Requests with a query string (the app's version download, for
// example ?v=2) go straight to the network and are never cached here.
// Caches whose names start with 'arabyo-content-' are never deleted.

const SHELL_CACHE = 'arabyo-shell-v3';
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

// A level file of level n: from the cache of the level's current
// contentVersion (read from the levels.json copy in the shell cache), looked
// up by its clean URL. Falls back to the network without storing anything.
function levelResponse(req, url, n) {
  const listUrl = new URL('content/levels.json', self.registration.scope).href;
  return caches.open(SHELL_CACHE)
    .then(function (shell) {
      // ignoreSearch only here: the app may request levels.json with a query.
      return shell.match(listUrl, { ignoreSearch: true });
    })
    .then(function (listRes) {
      if (!listRes) return fetch(req);
      return listRes.json()
        .then(function (data) {
          const levels = data && data.levels;
          if (!Array.isArray(levels)) return null;
          for (let i = 0; i < levels.length; i++) {
            const entry = levels[i];
            if (entry && entry.level === n) {
              return typeof entry.contentVersion === 'number' ? entry.contentVersion : null;
            }
          }
          return null;
        })
        .catch(function () { return null; })
        .then(function (version) {
          if (version === null) return fetch(req);
          return caches.open(CONTENT_PREFIX + 'level-' + n + '-v' + version)
            .then(function (cache) { return cache.match(url.origin + url.pathname); })
            .then(function (cached) { return cached || fetch(req); });
        });
    });
}

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const rel = scopePath(url);

  // Level files: only from the current version's cache, otherwise from the
  // network. Nothing is stored here; the app fills the content caches itself.
  const m = rel !== null ? /^content\/level-(\d+)\//.exec(rel) : null;
  if (m) {
    if (url.search) {
      // The app's version download (for example ?v=2): network only.
      event.respondWith(fetch(req).catch(function () { return Response.error(); }));
      return;
    }
    event.respondWith(
      levelResponse(req, url, Number(m[1])).catch(function () { return Response.error(); })
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
              caches.open(SHELL_CACHE)
                .then(function (cache) { return cache.put(req, copy); })
                .catch(function () {})
            );
          }
          return res;
        })
        .catch(function () {
          // Offline: the kept copy, or a network error if there is none.
          return caches.match(req, { ignoreSearch: true }).then(function (cached) {
            return cached || Response.error();
          });
        })
        .catch(function () { return Response.error(); })
    );
    return;
  }

  // Everything else: cache-first.
  event.respondWith(
    caches.match(req, { ignoreSearch: true })
      .then(function (cached) {
        if (cached) return cached;
        return fetch(req).catch(function () {
          // Offline and not cached: for page loads, show the app shell;
          // otherwise a network error.
          if (req.mode === 'navigate') {
            return caches.match('./index.html').then(function (shell) {
              return shell || Response.error();
            });
          }
          return Response.error();
        });
      })
      .catch(function () { return Response.error(); })
  );
});
