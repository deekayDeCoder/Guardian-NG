// Guardian-NG Security Framework Service Worker
// Designed for resilient low-bandwidth emergency operations in Zamfara State

const CACHE_NAME = 'guardian-cache-v3';
const RUNTIME_CACHE = 'guardian-runtime-cache';

// Core critical assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching critical emergency assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Resilient Network-First/Stale-While-Revalidate Caching Strategy
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS (bypass chrome-extension or other non-http requests)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Special Handling for API incidents list (GET)
  if (url.pathname === '/api/v1/incidents' && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone response and save to runtime cache
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If offline, retrieve from runtime cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[Service Worker] Offline fallback - serving incidents list from cache');
              return cachedResponse;
            }
            // Return a offline fallback json structure
            return new Response(
              JSON.stringify({
                success: true,
                incidents: [],
                cached: true,
                offlineMessage: 'Running in offline cached mode.'
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // General Static Assets caching (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => { /* Ignore offline dynamic fetch failures */ });

        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache newly discovered local resources
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Safe document fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle custom service worker messaging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PING') {
    event.ports[0].postMessage({ type: 'PONG', status: 'active' });
  }
});
