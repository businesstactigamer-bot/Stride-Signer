// Stride Sign - Service Worker for 100% Offline PWA Field Use
const CACHE_NAME = 'stride-sign-v8';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/app.css',
  './css/signature.css',
  './js/previews-data.js',
  './js/embedded-templates.js',
  './js/vendor/pdf-lib.min.js',
  './js/templates.js',
  './js/signature.js',
  './js/pdf-generator.js',
  './js/share-email.js',
  './js/app.js',
  './assets/logo.png',
  './manifest.json',
  './assets/manifest.json'
];

// Install Event: Cache all core application code, templates, and UI assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Stride Sign SW] Pre-caching offline assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches if updated
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Stride Sign SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First strategy when online so updates are immediate, falling back to offline cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful basic responses for offline use
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline) - retrieve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
