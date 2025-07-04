// A name for our cache. This should be unique to your PWA2.
const CACHE_NAME = 'dictionary-pwa-cache-v1';

// The base path of your application on the server.
// This is crucial for GitHub Pages deployment.
const BASE_PATH = '/pwa2/';

// Automatically generate the full paths for the Soomaali Mansuur dictionary files.
const SOOMAALI_FILES = "abcdefghijklmnopqrstuvwxy".split('').map(char => `${BASE_PATH}dictionaries/soomaali_mansuur/${char}.json`);

// A list of all the files and assets we want to cache for offline use.
// We include the base path for all assets.
const URLS_TO_CACHE = [
    BASE_PATH,
    `${BASE_PATH}index.html`,
    `${BASE_PATH}style.css`,
    `${BASE_PATH}app.js`,
    `${BASE_PATH}manifest.json`,
    `${BASE_PATH}icons/icon-192x192.png`,
    `${BASE_PATH}icons/icon-512x512.png`,
    `${BASE_PATH}dictionaries/biology.json`,
    `${BASE_PATH}dictionaries/physics.json`,
    `${BASE_PATH}dictionaries/geography.json`,
    ...SOOMAALI_FILES
];

/**
 * INSTALL EVENT
 * This is triggered when the service worker is first installed.
 * We open the cache and add all our assets to it.
 * This version is resilient: it will not fail if some of the dictionary files are missing (404 error).
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache. Caching core assets.');
                // We cache each file individually and catch any errors.
                // This prevents the entire installation from failing if one file is not found.
                const cachePromises = URLS_TO_CACHE.map(urlToCache => {
                    return cache.add(urlToCache).catch(err => {
                        // Log the error for the specific file that failed, but don't stop the service worker.
                        console.warn(`Failed to cache ${urlToCache}:`, err);
                    });
                });
                // Wait until all individual caching operations are settled.
                return Promise.all(cachePromises);
            })
    );
});

/**
 * FETCH EVENT
 * This is triggered for every network request made by the page.
 * We use a "Cache First, then Network" strategy.
 */
self.addEventListener('fetch', event => {
    event.respondWith(
        // Try to find a matching request in the cache.
        caches.match(event.request)
            .then(response => {
                // If a cached version is found, return it.
                if (response) {
                    return response;
                }
                // If the request is not in the cache, fetch it from the network.
                return fetch(event.request);
            })
    );
});

/**
 * ACTIVATE EVENT
 * This is triggered when the new service worker becomes active.
 * It's the perfect place to clean up old, unused caches.
 */
self.addEventListener('activate', event => {
    // A list of caches we want to keep. In this case, only the current one.
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // If a cache is found that is not in our whitelist, delete it.
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});