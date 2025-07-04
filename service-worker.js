// A name for our cache. This should be unique to your PWA.
const CACHE_NAME = 'dictionary-pwa-cache-v1';

// The base path of your application on the server.
// This is crucial for GitHub Pages deployment.
const BASE_PATH = '/pwa2/';

// Automatically generate the full paths for the Soomaali Mansuur dictionary files.
const SOOMAALI_FILES = "abcdefghijklmnoqrstuwxy".split('').map(char => `${BASE_PATH}dictionaries/soomaali_mansuur/${char}.json`);

// A list of all the files and assets we want to cache for offline use.
const URLS_TO_CACHE = [
    BASE_PATH,
    `${BASE_PATH}index.html`,
    `${BASE_PATH}style.css`,
    `${BASE_PATH}app.js`,
    `${BASE_PATH}manifest.json`,
    `${BASE_PATH}icons/icon-192x192.png`,
    `${BASE_PATH}icons/icon-512x512.png`,
    `${BASE_PATH}icons/screen1.jpg`,
    `${BASE_PATH}icons/screen2.jpg`,
    `${BASE_PATH}dictionaries/biology.json`,
    `${BASE_PATH}dictionaries/physics.json`,
    `${BASE_PATH}dictionaries/geography.json`,
    ...SOOMAALI_FILES
];

/**
 * INSTALL EVENT
 * This is the corrected version. It caches files one-by-one and ignores errors
 * for missing files, preventing the entire installation from failing.
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache. Caching assets individually.');
                // Create an array of promises, one for each file we want to cache.
                const cachePromises = URLS_TO_CACHE.map(urlToCache => {
                    // cache.add() returns a promise. We attach a .catch() to each one.
                    return cache.add(urlToCache).catch(err => {
                        // This will log a warning for any file that fails to cache (like c.json),
                        // but it will NOT stop the other files from being cached.
                        console.warn(`Failed to cache ${urlToCache}:`, err);
                    });
                });
                // Promise.all() waits for all the individual cache operations to complete.
                // Because we've caught the errors above, this Promise.all will not reject.
                return Promise.all(cachePromises);
            })
    );
});


/**
 * FETCH EVENT
 * This is triggered for every network request. It serves from the cache first.
 */
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If a cached version is found, return it.
                if (response) {
                    return response;
                }
                // If not in cache, fetch it from the network.
                return fetch(event.request);
            })
    );
});

/**
 * ACTIVATE EVENT
 * This cleans up old, unused caches.
 */
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});