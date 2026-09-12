// Stride Sign - Rock-Solid Offline-First Service Worker (v9)
// Built specifically for healthcare field ATPs with zero-signal basements & expired link immunity.

const CACHE_NAME = 'stride-sign-v9-offline';

const CORE_ASSETS = [
  './',
  './index.html',
  'index.html',
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
  './manifest.json'
];

// Helper: safe fetch and cache without aborting the whole install if one fails
async function cacheAsset(cache, url) {
  try {
    const request = new Request(url, { cache: 'no-cache' });
    const response = await fetch(request);
    if (response && (response.status === 200 || response.type === 'opaque')) {
      await cache.put(request, response.clone());
      return true;
    }
  } catch (err) {
    console.warn('[Stride SW] Could not cache:', url, err.message);
  }
  return false;
}

// Install Event: Download and save every core asset into local hardware cache
self.addEventListener('install', (event) => {
  console.log('[Stride SW v9] Installing offline-first service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache assets individually with Promise.allSettled so no single failure stops installation
      const results = await Promise.allSettled(CORE_ASSETS.map((url) => cacheAsset(cache, url)));
      const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`[Stride SW v9] Successfully cached ${succeeded}/${CORE_ASSETS.length} offline assets.`);
    }).then(() => {
      // Force the waiting service worker to become the active service worker immediately
      return self.skipWaiting();
    })
  );
});

// Activate Event: Claim clients immediately and purge older deprecated caches
self.addEventListener('activate', (event) => {
  console.log('[Stride SW v9] Activating & claiming clients...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Stride SW v9] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notify all open windows that offline mode is active and ready
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'STRIDE_OFFLINE_READY' });
        });
      });
    })
  );
});

// Fetch Event: Cache-First Strategy
// Guarantees that even if the host link expires, server dies, or device has 0 cell bars,
// the entire app and all templates load instantly from phone storage.
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests (ignore POST like /api/save-pdf)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. NAVIGATION REQUESTS (HTML page load / Home Screen icon tap)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // A. Try exact match in cache first
        const cachedPage = await cache.match(event.request, { ignoreSearch: true })
          || await cache.match('./index.html')
          || await cache.match('index.html')
          || await cache.match('./');

        if (cachedPage) {
          // Stale-While-Revalidate: serve cached HTML immediately, optionally refresh in background
          fetch(event.request).then((networkRes) => {
            // Only update cache if network returns a genuine 200 OK HTML page (not 404, 502, or expired link page)
            if (networkRes && networkRes.status === 200 && networkRes.headers.get('content-type')?.includes('text/html')) {
              cache.put(event.request, networkRes.clone());
            }
          }).catch(() => {
            // Network offline or link expired — expected in field, ignore
          });

          return cachedPage;
        }

        // B. If not in cache yet, try network
        try {
          const networkRes = await fetch(event.request);
          if (networkRes && networkRes.status === 200) {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        } catch (err) {
          // Network failed and not in cache: fallback to whatever index.html is available in any cache
          return caches.match('./index.html') || caches.match('index.html');
        }
      })
    );
    return;
  }

  // 2. STATIC ASSETS (JS, CSS, Images, Manifest)
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Check cache first
      const cachedResponse = await cache.match(event.request, { ignoreSearch: true });
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not cached, fetch from network and save
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // If offline and request is an image or script, try fallback
        console.log('[Stride SW v9] Offline fetch fallback for:', event.request.url);
        return cachedResponse;
      }
    })
  );
});

// Message Listener: Support explicit cache verification & refresh from UI
self.addEventListener('message', async (event) => {
  if (!event.data) return;

  if (event.data.type === 'VERIFY_CACHE' || event.data.type === 'FORCE_CACHE') {
    const cache = await caches.open(CACHE_NAME);
    let cachedCount = 0;
    for (const url of CORE_ASSETS) {
      const match = await cache.match(url);
      if (match) {
        cachedCount++;
      } else {
        // Missing asset, attempt to download
        const ok = await cacheAsset(cache, url);
        if (ok) cachedCount++;
      }
    }
    
    event.source.postMessage({
      type: 'CACHE_VERIFICATION_RESULT',
      total: CORE_ASSETS.length,
      cached: cachedCount,
      allReady: cachedCount >= (CORE_ASSETS.length - 2) // Allow index.html aliases
    });
  }
});
