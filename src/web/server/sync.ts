import { getMany, setMany, set, update } from "./db.js"
import { globalDB as db } from "./global-model.js"

let updatedTime : number[] = []
export function updated(immediate = false) {
    if (immediate) {
        return clearAndSync()
    }

    // If there is a timeout, clear it.
    clearTimeout(updatedTime.shift())
    let id = setTimeout(async () => {
        clearAndSync()
    }, /* ten minutes */ 6e5)

    updatedTime.push(id)
}

function clearAndSync() {
    for (let x of updatedTime) {
        clearTimeout(x)
    }
    updatedTime = []
    sync()
}

async function sync() {
    let isLoggedIn = await db.isLoggedIn()
    if (!isLoggedIn) return

    let keys = await db.updated()
    const items = await getMany(keys)
    const data : Data[] = new Array(keys.length)
    for (let index = 0; index < items.length; index++) {
        let key = keys[index]
        let d = items[index]
        data[index] = { key, data: d, id: d._rev ?? 0 }
    }
    const lastSyncedId = (await db.settings()).lastSyncedId

    let postData : PostData = { lastSyncedId, data }
    const res = await fetch("/api/data", {
        method: "POST",
        body: JSON.stringify(postData),
        headers: {
            "Content-Type": "application/json"
        },
        keepalive: true,
        credentials: "same-origin",
        mode: "same-origin"
    })

    let newData : ResponseData
    if (res.status >= 200 && res.status <= 299 && res.headers.get("Content-Type")?.startsWith("application/json")) {
        newData = await res.json()
    } else {
        console.log("Oops! Something happened and could not sync the data!")
        return
    }

    let toSaveNewData = []
    for (let saved of newData.data) {
        let key = parse(saved.key)
        let data = parse(saved.data)
        data._rev = saved.id
        toSaveNewData.push([key, data])
    }
    await setMany(<any>toSaveNewData)

    let updatedData = await getMany(newData.saved.map(x => parse(x.key)))
    let updatedRevisionsTask = []
    for (let index = 0; index < updatedData.length; index++) {
        let d = updatedData[index]
        let { key, id } = newData.saved[index]
        if (d) {
            d._rev = id
            updatedRevisionsTask.push(set(parse(key), updatedData[index], false))
        } else {
            console.error("Could not find the key to update the revision!", key, id)
        }
    }

    await Promise.all([
        ...updatedRevisionsTask,
        update("settings", val => ({ ...val, lastSyncedId: newData.lastSyncedId }), { sync: false }),
        update("updated", val => (val?.clear(), val), { sync: false })])
}

function parse(value: any) {
    return JSON.parse(value)
}

interface Data {
    key: any
    data: any
    id: number 
}

interface PostData {
    lastSyncedId: number
    data: Data[]
}

interface ResponseData {
    data: Data[]
    saved: SavedDto[]
    conflicted: ConflictedDto[]
    lastSyncedId: number
}

interface SavedDto {
    key: string
    id: number
}

interface ConflictedDto {
    key: string
    data?: string
    id: number
    timestamp: string
}

