const CACHE_NAME = 'dictionary-pwa-cache-v1';
const BASE_PATH = '/pwa2/'; // The name of your GitHub repository

// Generate the list of files to cache automatically
const SOOMAALI_FILES = "abcdefghijklmnopqrstuvwxy".split('').map(char => `${BASE_PATH}dictionaries/soomaali_mansuur/${char}.json`);

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

// Install event: cache all the core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request);
            })
    );
});

// Activate event: clean up old caches
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