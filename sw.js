/* ==============================================
   SERVICE WORKER

   A Service Worker is a special script that runs
   in the background, separate from the web page.
   It has two main jobs for this app:

   1. CACHING — It saves a copy of the app's files
      (HTML, CSS, JS, icons) so the app loads instantly
      and works even without internet.

   2. PWA — Having a service worker is required for
      the "Add to Home Screen" feature on iPhones
      and Android phones.

   Think of it like a local copy of the app that
   lives on your phone.
   ============================================== */


/*
  CACHE_NAME is like a version number for our cached files.
  When we update the app, we change this name, which tells
  the browser to download fresh copies of everything.
*/
var CACHE_NAME = 'link-saver-v2';

/*
  FILES_TO_CACHE is the list of files that make up the app.
  These get downloaded and stored on the device the first
  time someone visits.
*/
var FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];


/* ==============================================
   INSTALL EVENT

   This runs once when the service worker is first
   registered (i.e., when someone first visits the app).
   It downloads and caches all the app files.
   ============================================== */
self.addEventListener('install', function(event) {
  console.log('[SW] Installing and caching app files...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  // "skipWaiting" makes the new service worker take over immediately
  // instead of waiting for all tabs to close first
  self.skipWaiting();
});


/* ==============================================
   ACTIVATE EVENT

   This runs when the service worker takes control.
   We use it to delete old cached files from
   previous versions of the app.
   ============================================== */
self.addEventListener('activate', function(event) {
  console.log('[SW] Activated. Cleaning up old caches...');

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          // Delete any cache that isn't our current version
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );

  // Take control of all open tabs immediately
  self.clients.claim();
});


/* ==============================================
   FETCH EVENT

   This runs every time the app tries to load a file
   (HTML page, CSS, JS, image, etc.).

   Strategy: "Cache First"
   1. Look in the cache for the file
   2. If found, return it instantly (super fast!)
   3. If not found, fetch from the network
   4. Cache the network response for next time

   This means the app loads almost instantly from
   local storage, even on slow connections.
   ============================================== */
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Found in cache — return it immediately
        return cachedResponse;
      }

      // Not in cache — fetch from the network
      return fetch(event.request).then(function(networkResponse) {
        // Only cache GET requests for our own origin
        // (We don't want to cache external API calls or favicons)
        if (
          event.request.method === 'GET' &&
          event.request.url.startsWith(self.location.origin)
        ) {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(function() {
      // Both cache and network failed — we're truly offline
      // For navigation requests, return the cached index page
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
