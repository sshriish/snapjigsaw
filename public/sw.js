// SnapJigsaw Service Worker for Offline Capabilities (Pure JavaScript)
//
// Caching strategy (this is the important part — read before editing):
//
// - App shell / navigations (index.html, "/", manifest.json) are
//   NETWORK-FIRST: always try the network for the latest deploy first, and
//   only fall back to whatever is cached if the network is unavailable
//   (offline). This is what stops visitors getting stuck on a stale build
//   after a new deploy — the old bug where a cache-first strategy served an
//   old index.html pointing at JS/CSS files that no longer existed.
// - Hashed build assets under /assets/ (Vite fingerprints every JS/CSS file
//   per build — a given filename's contents never change) are CACHE-FIRST.
//   That's safe to do aggressively and keeps things fast/offline-capable.
// - Anything else same-origin: network-first with a cache fallback.
//
// Bump CACHE_NAME whenever this file's logic changes so old caches get
// cleaned up on activate.
const CACHE_NAME = 'snapjigsaw-cache-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Activate this new worker immediately instead of waiting for every open
  // tab of the old version to close first.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
      )
    )
  );
  // Take control of any already-open tabs right away.
  self.clients.claim();
});

function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/');
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't intercept cross-origin requests

  // App shell / page navigations: always prefer a fresh copy so new deploys
  // show up immediately; fall back to cache (and finally cached index.html
  // for SPA routing) only when offline.
  if (
    request.mode === 'navigate' ||
    url.pathname === '/index.html' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  // Hashed, content-addressed build output: safe to cache aggressively.
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else same-origin: try network, fall back to cache if offline.
  event.respondWith(networkFirst(request));
});
