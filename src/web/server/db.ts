import { get as get1, getMany, setMany, set as set1, update as update1, entries as entries1 } from "idb-keyval"
import { reject } from "./utils.js"

export async function getUserIndex() {
    let settings = <LocalSettings | undefined>(await get1("local-settings"))
    if (!settings) {
        // get global settings
        let global = <GlobalSettings | undefined>(await get1("global-settings"))
            ?? {
            users: [
                { name: "anonymous" }
            ],
            _rev: 0
        }
        set("local-settings", settings = { user: global.users[0].name, id: 0 }, false)
    }
    return settings?.id ?? 0
}

const get: DBGet = get1

type Updated = Set<string | number>

const _updated =
    async (key: IDBValidKey) => {
        await update1("updated", (val?: Updated) => {
            if (Array.isArray(key)) {
                key = JSON.stringify(key)
            }

            // If key is not string or number then make it a string.
            if (typeof key !== "string" && typeof key !== "number") {
                key = key.toString()
            }

            if (val instanceof Map) {
                val = new Set(val.keys())
            }

            return (val || new Set).add(key)
        })
    }

function set<K extends keyof DBAccessors>(key: K, value: DBAccessors[K], sync?: boolean): Promise<void>
function set(key: string, value: any, sync?: boolean): Promise<void>
async function set(key: IDBValidKey, value: any, sync = true) {
    await set1(key, value)
    if (sync) {
        await _updated(key)
    }
}

function update<K extends keyof DBAccessors>(key: K, f: (val: DBAccessors[K]) => DBAccessors[K], sync?: { sync: boolean }): Promise<void>
function update<T>(key: string, f: (val: T) => T, sync?: { sync: boolean }): Promise<void>
async function update(key: string, f: (v: any) => any, options = { sync: true }) {
    await update1(key, f)
    if (options.sync) {
        let o: any = await get(key)
        if (o && "_rev" in o) {
            await _updated(key)
        } else {
            reject(`Revision number not found for "${key}".`)
        }
    }
}

const entries = entries1
export { update, set, get, getMany, setMany, entries }

interface DBAccessors {
    "user-settings": UserSettings
    "settings": Settings
    "updated": Updated
}

interface DBGet {
    (key: "user-settings"): Promise<UserSettings | undefined>
    (key: "updated"): Promise<Updated | undefined>
    (key: "settings"): Promise<Settings | undefined>
    <T>(key: string): Promise<T | undefined>
    <T>(key: IDBValidKey): Promise<T | undefined>
}

export interface Revision {
    _rev: number
}

export type TimeOfDay = "day" | "night"

export interface Drive {
    start?: string
    end?: string
    time?: TimeOfDay
}

export interface DriveDate extends Revision {
    date: string
    drives: Drive[]
}

export interface Settings extends Revision {
    earliestDate?: string
    lastSyncedId?: number
    totalDayTimeHours?: number
    totalNightTimeHours?: number
}

export interface UserSettings {
    goalDayHours?: number
    goalNightHours?: number
    name: string
}

export interface GlobalSettings extends Revision {
    users: UserSettings[]
}

export interface LocalSettings {
    user: string
    id: number
}

