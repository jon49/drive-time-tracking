import { version } from "./server/settings.js"
import { getResponse } from "./service-worker/route-handling.js"
import "./service-worker/routes.js"
import links from "./entry-points.js"
import { GlobalSettings, get, set } from "./server/db.js"
import { clear, createStore, entries } from "idb-keyval"

self.addEventListener("install", async (e: Event) => {
    // @ts-ignore
    e.waitUntil(
        caches.open(version)
        .then((cache: any) => cache.addAll(links.map(x => x.file))))
})

// @ts-ignore
self.addEventListener("fetch", (e: FetchEvent) => e.respondWith(getResponse(e)))

// @ts-ignore
self.addEventListener("activate", async (e: ExtendableEvent) => {
    console.log("Service worker activated.")

    let keys = await caches.keys(),
        deleteMe =
        keys
        .map((x: string) => ((version !== x) && caches.delete(x)))
        .filter(x => x)
    if (deleteMe.length === 0) return
    e.waitUntil(Promise.all(deleteMe))

})

