const CACHE_NAME = "mata_rani-cache-v2";
const urlsToCache = [
  "/",
  "/index.html",    
  "/announcement1.mp3",
  "/announcement2.mp3",
  "/announcement3.mp3",
  "/announcement4.mp3",
  "/announcement5.mp3",
  "/announcement6.mp3",
  "/announcement7.mp3",
  "/announcement8.mp3",
  "/announcement9.mp3",
  "/announcement10.mp3",
  "/announcement11.mp3",
  "/announcement12.mp3",
  "/announcement13.mp3",
  "/announcement14.mp3",
  "/announcement15.mp3",
  "/announcement16.mp3",
  "/announcement17.mp3",
  "/announcement18.mp3",
  "/announcement19.mp3",
  "/announcement20.mp3",
  "/announcement21.mp3",
  "/announcement22.mp3",
  "/announcement23.mp3",
  "/announcement24.mp3",
  "/announcement25.mp3",
  "/announcement26.mp3",
  "/announcement27.mp3",
  "/announcement28.mp3",
  "/announcement29.mp3",
  "/announcement30.mp3",
  
  "/images/background.jpg",
  "/app.js",        
  "/icon-192.png",
  "/icon-512.png"
];

// Install phase - cache all resources
self.addEventListener("install", event => {
  self.skipWaiting(); // Activate immediately
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use individual cache.add calls to prevent failure of one from breaking all
      return Promise.allSettled(
        urlsToCache.map(url => {
          return cache.add(url).catch(error => {
            console.log(`Failed to cache ${url}:`, error);
          });
        })
      );
    })
  );
});

// Activate phase - clear old caches and claim clients
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients to control pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, then cache for online users
self.addEventListener("fetch", event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // For online users, try network first, then cache
  if (navigator.onLine) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        // If we got a response, update the cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(error => {
        // Network request failed, try cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If it's a HTML request and no cache, then return the index.html for SPA
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          throw error;
        });
      })
    );
  } else {
    // For offline users, use cache first approach
    event.respondWith(
      caches.match(event.request).then(response => {
        // Return cached version if found
        if (response) {
          return response;
        }
        
        // Otherwise, try to fetch from network (might fail offline)
        return fetch(event.request).then(networkResponse => {
          // Don't cache non-200 responses or opaque responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          
          // Clone the response and cache it
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        }).catch(error => {
          // For HTML pages, fall back to index.html for SPA routing
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          
          throw error;
        });
      })
    );
  }
});
