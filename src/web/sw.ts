import { version } from "./server/settings.js"
import { getResponse } from "./service-worker/route-handling.js"
import "./service-worker/routes.js"
import links from "./entry-points.js"

self.addEventListener("install", async (e: Event) => {
    if (await caches.has(version)) return
    // @ts-ignore
    e.waitUntil(
        caches.open(version)
        .then((cache: any) => cache.addAll(links.map(x => x.file))))
})

// @ts-ignore
self.addEventListener("fetch", (e: FetchEvent) => e.respondWith(getResponse(e)))

// @ts-ignore
self.addEventListener("activate", async (e: ExtendableEvent) => {
    let keys = await caches.keys(),
        deleteMe =
        keys
        .map((x: string) => ((version !== x) && caches.delete(x)))
        .filter(x => x)
    if (deleteMe.length === 0) return
    e.waitUntil(Promise.all(deleteMe))
})

