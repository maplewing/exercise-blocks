// Network-first service worker: always tries the live site so updates show up
// right away, and falls back to the last copy it saw when there's no signal.
const CACHE = "exercise-blocks-v2";
const SHELL = [
  "./", "index.html", "style.css", "app.js", "exercises.js",
  "manifest.webmanifest", "icon-192.png", "apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    // "no-cache" = always check with the server (a cheap 304 when unchanged), so a fresh
    // deploy shows up right away instead of after the browser's own cache expires.
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./")))
  );
});
