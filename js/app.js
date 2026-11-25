// Arabyo app shell: register the service worker so the app installs and works offline.
//
// Level content: after the page loads, the app stores level 0's level file,
// images and audio in the cache 'arabyo-content-level-<n>-v<contentVersion>'.
// Files already in that cache are skipped, so an interrupted download resumes
// on the next load. Only when every file is stored are older versions of the
// same level deleted; other levels and the shell cache are never touched.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
}

(function () {
  var LEVEL = 0;
  var CACHE_PREFIX = 'arabyo-content-level-' + LEVEL + '-v';
  var CACHE_PATTERN = new RegExp('^arabyo-content-level-' + LEVEL + '-v(\\d+)$');

  function warn(msg, err) {
    console.warn('Arabyo content: ' + msg, err === undefined ? '' : err);
  }

  function getJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      return res;
    });
  }

  function requestPersistence() {
    try {
      if (navigator.storage && typeof navigator.storage.persist === 'function') {
        var p = navigator.storage.persist();
        if (p && typeof p.catch === 'function') {
          p.catch(function (err) { warn('persist() failed', err); });
        }
      }
    } catch (err) {
      warn('persist() failed', err);
    }
  }

  function downloadLevel0() {
    if (!('caches' in window) || typeof fetch !== 'function') return;
    requestPersistence();
    if (navigator.onLine === false) return;

    var base = document.baseURI;
    var version, cacheName, levelJsonHref, levelRes;

    // levels.json uses its clean URL with cache: 'no-store'; the service worker
    // fetches it from the network and keeps one offline copy under that URL.
    getJson(new URL('content/levels.json', base).href)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var levels = data && data.levels;
        var entry = null;
        for (var i = 0; levels && i < levels.length; i++) {
          if (levels[i] && levels[i].level === LEVEL) { entry = levels[i]; break; }
        }
        if (!entry || typeof entry.contentVersion !== 'number' || !entry.folder || !entry.file) {
          throw new Error('level ' + LEVEL + ' missing from levels.json');
        }
        version = entry.contentVersion;
        cacheName = CACHE_PREFIX + version;
        var folderHref = new URL('content/' + entry.folder + '/', base).href;
        levelJsonHref = new URL(entry.file, folderHref).href;
        return getJson(levelJsonHref + '?v=' + version);
      })
      .then(function (res) {
        levelRes = res.clone();
        return res.json();
      })
      .then(function (level) {
        // Asset paths in the level file are relative to the level's folder,
        // which is the folder of the level file itself.
        var seen = {};
        var hrefs = [];
        function add(href) {
          if (!seen[href]) { seen[href] = true; hrefs.push(href); }
        }
        add(levelJsonHref);
        var items = (level && level.items) || [];
        items.forEach(function (item) {
          ['image', 'audioAr', 'audioSv'].forEach(function (field) {
            if (item && typeof item[field] === 'string' && item[field]) {
              add(new URL(item[field], levelJsonHref).href);
            }
          });
        });
        return caches.open(cacheName).then(function (cache) {
          return downloadMissing(cache, hrefs).then(function () {
            return deleteOlderIfComplete(cache, hrefs);
          });
        });
      })
      .catch(function (err) { warn('level ' + LEVEL + ' download stopped', err); });

    function findMissing(cache, hrefs) {
      return Promise.all(hrefs.map(function (href) {
        return cache.match(href).then(function (hit) { return hit ? null : href; });
      })).then(function (list) {
        return list.filter(function (href) { return href !== null; });
      });
    }

    function downloadMissing(cache, hrefs) {
      return findMissing(cache, hrefs).then(function (missing) {
        // One file at a time, so a slow device is not flooded with requests.
        return missing.reduce(function (chain, href) {
          return chain.then(function () {
            if (href === levelJsonHref && levelRes) {
              return cache.put(href, levelRes)
                .catch(function (err) { warn('could not store ' + href, err); });
            }
            return fetch(href + '?v=' + version, { cache: 'no-store' })
              .then(function (res) {
                if (res.ok) return cache.put(href, res);
                warn('HTTP ' + res.status + ' for ' + href);
              })
              .catch(function (err) { warn('could not store ' + href, err); });
          });
        }, Promise.resolve());
      });
    }

    function deleteOlderIfComplete(cache, hrefs) {
      return findMissing(cache, hrefs).then(function (missing) {
        if (missing.length > 0) {
          warn(missing.length + ' file(s) still missing; will resume on next load');
          return;
        }
        return caches.keys().then(function (names) {
          return Promise.all(names
            .filter(function (name) { return CACHE_PATTERN.test(name) && name !== cacheName; })
            .map(function (name) { return caches.delete(name); }));
        });
      });
    }
  }

  window.addEventListener('load', function () {
    try {
      downloadLevel0();
    } catch (err) {
      warn('level ' + LEVEL + ' download failed', err);
    }
  });
})();
