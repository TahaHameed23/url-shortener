const CACHE_NAME = "urlz-shell-v4";
const APP_SHELL = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/favicon.svg",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName.startsWith("urlz-shell-") && cacheName !== CACHE_NAME)
                        .map((cacheName) => caches.delete(cacheName)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cachedPage = await caches.match("/index.html");
                if (!cachedPage) {
                    throw new Error("The URLZ app shell is not available offline.");
                }
                return cachedPage;
            }),
        );
        return;
    }

    if (url.pathname === "/assets/main.js" || url.pathname === "/assets/index.css") {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                try {
                    const response = await fetch(request, { cache: "no-cache" });
                    if (response.ok && response.type === "basic") {
                        await cache.put(request, response.clone());
                    }
                    return response;
                } catch (error) {
                    const cachedResponse = await cache.match(request);
                    if (cachedResponse) return cachedResponse;
                    throw error;
                }
            })(),
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(request).then((response) => {
                if (response.ok && response.type === "basic") {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
                }
                return response;
            });
        }),
    );
});
