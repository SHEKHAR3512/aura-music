const CACHE_NAME = 'aura-sound-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy Network-First with Cache-Fallback for API, Cache-First for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or streaming audio / binary ranges
  if (event.request.method !== 'GET') return;
  if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.mp3') || url.hostname.includes('saavncdn')) {
    return;
  }

  // Handle Music Metadata API requests (/api/music/*)
  if (url.pathname.startsWith('/api/music/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful response
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: try to serve from cache
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          return new Response(JSON.stringify({ error: 'Offline', isOfflineFallback: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // Handle Static assets & document
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and refresh in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // If offline and request is for page navigation, return cached index
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
      });
    })
  );
});
