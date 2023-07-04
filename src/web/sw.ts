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

    // migrate database to not use stores but use arrays instead
    let settings : GlobalSettings | undefined = <any> (await get("global-settings"))
    if (!settings) return
    let users = settings.users
    if (!users) return
    for (let i = 0; i < users.length; i++) {
        // let user = users[i]
        let store = createStore(`drive-${i}`, "" + i)
        for (let entry of await entries(store)) {
            if (entry[0] === "updated") {
                let updated = (await get("updated")) || new Map()
                for (let [key, rev] of Object.entries(entry[1])) {
                    updated.set(key, rev)
                }
                await set("updated", entry[1])
                continue
            }
            await set(<any>[i, entry[0]], entry[1])
        }
        clear(store)
    }

    console.log("Service worker cleaned up.")
    let keys = await caches.keys(),
        deleteMe =
        keys
        .map((x: string) => ((version !== x) && caches.delete(x)))
        .filter(x => x)
    if (deleteMe.length === 0) return
    e.waitUntil(Promise.all(deleteMe))

})

