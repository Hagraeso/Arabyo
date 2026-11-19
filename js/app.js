// Arabyo app shell: register the service worker so the app installs and works offline.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
}
