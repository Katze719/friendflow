const SHELL_CACHE = "friendflow-shell-v5";
const SHELL_FILES = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/favicon-192.png",
  "/favicon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL_FILES);

    // The generated JS/CSS filenames contain a build hash and therefore cannot
    // be listed here ahead of time. Discover them from the production HTML so
    // the app can start offline immediately after its first successful load.
    const indexResponse = await fetch("/index.html");
    if (!indexResponse.ok) return;

    const html = await indexResponse.text();
    const assetPaths = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map((match) => match[1])
      .filter((path) => path.startsWith("/") && !path.startsWith("/api/"));

    const uniqueAssetPaths = [...new Set(assetPaths)];
    await cache.addAll(uniqueAssetPaths);

    // Vite can keep platform adapters as dynamic chunks that are not linked in
    // index.html. Cache sibling chunks referenced by the entry module as well.
    const scriptQueue = uniqueAssetPaths.filter((path) => path.endsWith(".js"));
    const visitedScripts = new Set();
    for (let index = 0; index < scriptQueue.length; index += 1) {
      const scriptPath = scriptQueue[index];
      if (visitedScripts.has(scriptPath)) continue;
      visitedScripts.add(scriptPath);

      if (!(await cache.match(scriptPath))) await cache.add(scriptPath);
      const scriptResponse = await cache.match(scriptPath);
      if (!scriptResponse) continue;
      const script = await scriptResponse.text();
      for (const match of script.matchAll(/["']\.\/([^"'?#]+\.js)["']/g)) {
        scriptQueue.push(new URL(match[1], new URL(scriptPath, self.location.origin)).pathname);
      }
    }
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("friendflow-shell-") && key !== SHELL_CACHE)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(url.href).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })),
    );
  }
});
