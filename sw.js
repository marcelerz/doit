// Service Worker for DoIt PWA

// Replaced at build time by scripts/fix-github-pages.js with the version from
// version.json. Without this the file was byte-identical across every deploy,
// so the browser never saw a new worker: no updatefound event, the "Update
// available" toast was unreachable in production, and superseded caches were
// never purged.
const BUILD_VERSION = "0.1.165";

const CACHE_NAME = `doit-cache-${BUILD_VERSION}`;
const STATIC_CACHE_NAME = `doit-static-${BUILD_VERSION}`;
const DYNAMIC_CACHE_NAME = `doit-dynamic-${BUILD_VERSION}`;

// Derived from the registration scope rather than hardcoded, so the same file
// works under the GitHub Pages basePath (/doit) and at the root in dev. The
// hardcoded value meant dev precached /doit/, which does not exist there.
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/favicon.ico`,
  `${BASE_PATH}/favicon.svg`,
  `${BASE_PATH}/favicon-16x16.png`,
  `${BASE_PATH}/favicon-32x32.png`,
  `${BASE_PATH}/apple-touch-icon.png`,
  `${BASE_PATH}/android-chrome-192x192.png`,
  `${BASE_PATH}/android-chrome-512x512.png`,
  `${BASE_PATH}/site.webmanifest`,
];

// Sound files to cache (ambient sounds for Pomodoro)
const SOUND_ASSETS = [
  `${BASE_PATH}/sounds/10-minutes-swedish-summer-evening-19559.mp3`,
  `${BASE_PATH}/sounds/bushes-medium-heavy-wind-in-dry-vegetation-19537.mp3`,
  `${BASE_PATH}/sounds/crickets_night_2-19628.mp3`,
  `${BASE_PATH}/sounds/cricketsandfrogs-19596.mp3`,
  `${BASE_PATH}/sounds/field-recording-backyard-new-york-19524.mp3`,
  `${BASE_PATH}/sounds/gentle-rain-on-window-for-sleep-422420.mp3`,
  `${BASE_PATH}/sounds/light-rain-on-metal-roof-114527.mp3`,
  `${BASE_PATH}/sounds/rain-and-distant-thunder-60230.mp3`,
  `${BASE_PATH}/sounds/rain-and-thunder-61426.mp3`,
  `${BASE_PATH}/sounds/relaxing-rain-387677.mp3`,
  `${BASE_PATH}/sounds/relaxing-rain-444802.mp3`,
  `${BASE_PATH}/sounds/rooftop-city-neighbourhood-morning-distant-traffic-residents-activity-19574.mp3`,
  `${BASE_PATH}/sounds/sea-sound-4-19385.mp3`,
  `${BASE_PATH}/sounds/small-town-ambiance-60015.mp3`,
  `${BASE_PATH}/sounds/sweden-springtime-birds-field-recording-190420-19629.mp3`,
  `${BASE_PATH}/sounds/tranquil-flow-387676.mp3`,
  `${BASE_PATH}/sounds/tranquil-stream-387678.mp3`,
  `${BASE_PATH}/sounds/winter-morning-60210.mp3`,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    Promise.all([
      // Cache static assets (don't fail install if some assets fail)
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log("[SW] Caching static assets");
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.log(`[SW] Failed to cache ${url}:`, err.message);
            }),
          ),
        );
      }),
      // Cache sound files (don't fail install if these fail)
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log("[SW] Caching sound assets");
        return Promise.allSettled(
          SOUND_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.log(`[SW] Failed to cache ${url}:`, err.message);
            }),
          ),
        );
      }),
    ]).then(() => {
      console.log("[SW] Installation complete");
      // Deliberately no skipWaiting() here.
      //
      // Activating immediately meant a new worker never entered the waiting
      // state, so registration.waiting was always null -- and applyUpdate,
      // which is guarded on exactly that, did nothing. The "Update" button in
      // the update toast has therefore never worked.
      //
      // The new worker now waits, the toast offers the update, and the
      // SKIP_WAITING message below activates it when the user accepts.
    }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Remove old versioned caches
              return name.startsWith("doit-") && name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME;
            })
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.log("[SW] Activation complete");
        // Take control of all pages immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Skip external requests (only cache same-origin)
  if (url.origin !== self.location.origin) {
    return;
  }

  // For navigation requests (HTML pages), use network-first strategy
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // For static assets (images, fonts, etc.), use cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // For sounds, use cache-first strategy
  if (url.pathname.startsWith("/sounds/") || url.pathname.startsWith(`${BASE_PATH}/sounds/`)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // For Next.js static assets (_next/static), use cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith(`${BASE_PATH}/_next/static/`)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // For other _next requests, use stale-while-revalidate
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith(`${BASE_PATH}/_next/`)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
});

// Cache strategies

// Network first - try network, fall back to cache
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses (skip 206 partial responses which can't be cached)
    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (_error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a navigation request and we have no cache, return offline page
    if (request.mode === "navigate") {
      const offlineResponse = await caches.match(`${BASE_PATH}/`);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // Return a basic offline response
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Cache first - try cache, fall back to network
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses (skip 206 partial responses which can't be cached)
    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (_error) {
    // Return a basic error response
    return new Response("Resource not available offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Stale while revalidate - return cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch in background to update cache (skip 206 partial responses which can't be cached)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok && networkResponse.status !== 206) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Helper to identify static assets
function isStaticAsset(pathname) {
  const staticExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".css",
    ".js",
    ".webmanifest",
    ".json",
  ];

  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Handle messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(cacheNames.filter((name) => name.startsWith("doit-")).map((name) => caches.delete(name)));
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        }),
    );
  }
});

// Background sync for when coming back online
// Handle push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title || "DoIt", {
        body: data.body || "You have a notification",
        icon: `${BASE_PATH}/android-chrome-192x192.png`,
        badge: `${BASE_PATH}/favicon-32x32.png`,
        data: data.data,
      }),
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (new URL(client.url).pathname === `${BASE_PATH}/` && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(`${BASE_PATH}/`);
      }
    }),
  );
});

console.log("[SW] Service worker loaded");
