import { get as get1, getMany, setMany, set as set1, update as update1 } from "idb-keyval"

const get : DBGet = get1

const _updated =
    async (key: string) => {
        await update1("updated", (val?: Map<string, number>) => {
            if (val instanceof Set) {
                let temp : Map<string, number> = new Map()
                Array.from(val).forEach(x => temp.set(x, 0))
                val = temp
            }
            return (val || new Map()).set(key, Date.now())
        })
    }

function set<K extends keyof DBAccessors>(key: K, value: DBAccessors[K], sync?: boolean): Promise<void>
function set<T>(key: string, value: T, sync?: boolean): Promise<void>
async function set(key: string, value: any, sync = true) {
    await set1(key, value)
    if (sync) {
        await _updated(key)
    }
}

function update<K extends keyof DBAccessors>(key: K, f: (val: DBAccessors[K]) => DBAccessors[K], sync?: { sync: boolean }): Promise<void>
function update<T>(key: string, f: (val: T) => T, sync?: { sync: boolean }): Promise<void>
async function update(key: string, f: (v: any) => any, sync = { sync: true }) {
    await update1(key, f)
    if (sync.sync) {
        await _updated(key)
    }
}

export { update, set, get, getMany, setMany }

interface DBAccessors {
    "user-settings": UserSettings
    "settings": Settings
    "updated": Updated
}

export type Updated = Map<IDBValidKey, number>

interface DBGet {
    (key: "user-settings"): Promise<UserSettings | undefined>
    (key: "updated"): Promise<Updated | undefined>
    (key: "settings"): Promise<Settings | undefined>
    <T>(key: string): Promise<T | undefined>
}

export type TimeOfDay = "day" | "night"

export interface Drive {
    start?: string
    end?: string
    time?: TimeOfDay
}

export interface DriveDate {
    date: string
    drives: Drive[]
}

export interface Settings {
    earliestDate?: string
    lastSyncedId?: number
    totalDayTimeHours?: number
    totalNightTimeHours?: number
}

export interface UserSettings {
    goalDayHours?: number
    goalNightHours?: number
}

