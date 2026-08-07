/* DarMaroc - Service Worker (PWA) v1.6.3 */
const VERSION = 'darmaroc-v1.6.3';
const CORE_CACHE = 'darmaroc-core-v13';
const IMAGE_CACHE = 'darmaroc-images-v2';
const API_CACHE = 'darmaroc-api-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './services.html',
  './properties.html',
  './deposer-annonce.html',
  './contact.html',
  './about.html',
  './faq.html',
  './mentions-legales.html',
  './politique-de-confidentialite.html',
  './conditions-utilisation.html',
  './thank-you.html',
  './404.html',
  './blog/index.html',
  './blog/acheter-un-bien-immobilier-au-maroc.html',
  './blog/renover-sa-maison-au-maroc.html',
  './blog/choisir-un-artisan-de-confiance.html',
  './css/style.css',
  './js/main.js',
  './js/services.js',
  './js/testimonials.js',
  './js/properties.js',
  './data/data.js',
  './config/site-config.js',
  './utils/helpers.js',
  './utils/supabase.js',
  './utils/store.js',
  './utils/ai.js',
  './utils/photo-pipeline.js',
  './utils/seo.js',
  './utils/stats.js',
  './utils/social.js',
  './utils/geo.js',
  './manifest.json',
  './images/logo.png',
  './images/banner-with-logo.png',
  './images/favicon.svg',
  './images/splash-desktop-left.jpg',
  './images/splash-desktop-right.jpg',
  './images/splash-mobile-left.jpg',
  './images/splash-mobile-right.jpg',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/icon-512-maskable.png',
  './images/apple-touch-icon.png',
  './images/favicon-32.png',
  './images/favicon-16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CORE_CACHE && key !== IMAGE_CACHE && key !== API_CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    }
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => caches.match('./images/logo.png'));
      })
    );
    return;
  }

  if (url.pathname.includes('/api/') || url.pathname.includes('web3forms') || url.hostname.includes('firestore')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* Stratégie réseau d'abord : toujours servir la version la plus
     récente en ligne, et le cache uniquement hors-ligne. */
  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response.ok && url.origin === location.origin) {
          const clone = response.clone();
          caches.open(CORE_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(function () {
        return caches.match(request);
      })
  );
});
