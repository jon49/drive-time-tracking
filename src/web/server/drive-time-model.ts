import { UseStore } from "idb-keyval"
import { DriveDate, get, getUserStore, set, entries } from "./db.js"
import { reject } from "./utils.js"
import { createDateString, createInteger, createTimeOfDay, createTimeString, maybe, validateObject } from "./validation.js"
import { getCurrentDate, totalTime } from "../pages/utils.js"

const driveValidator = {
    date: createDateString('date'),
    end: maybe(createTimeString('end')),
    start: createTimeString('start'),
    time: maybe(createTimeOfDay('time')),
    index: createInteger('index'),
}

const maybeDateValidator = {
    date: maybe(createDateString('date')),
}

const isDate = /^\d{4}-\d{2}-\d{2}$/

class DriveTime {

    store: UseStore

    constructor(store: UseStore) {
        this.store = store
    }

    async get(date_: { date?: string }) {
        let { date } = await validateObject(date_, maybeDateValidator)
        if (!date) {
            date = getCurrentDate()
        }
        return  (await get<DriveDate>(date, this.store)) ?? {
            date,
            drives: [],
            _rev: 0,
        }
    }

    async saveDrive(data: any) {
        let { date, start, end, time, index } = await validateObject(data, driveValidator)
        if (start && end && start > end) {
            return reject("Start time must be before end time")
        }
        let driveDate = await this.get({ date })
        let current = driveDate.drives[index]
        let drive = { start, end, time: time || "day" }
        if (!current) {
            driveDate.drives.push(drive)
        } else {
            Object.assign(current, drive)
        }
        await set(date, driveDate, this.store)
    }

    async toggleTimeOfDay(data: any) {
        let { date } = await validateObject(data, driveValidator)
        let driveDate = await this.get({ date })
        let drive = driveDate.drives[data.index]
        if (!drive) {
            return reject("No drive found")
        }
        if (drive.time === "day") {
            drive.time = "night"
        } else {
            drive.time = "day"
        }
        await set(date, driveDate, this.store)
    }

    async totalTime() {
        let myEntries = await entries(this.store)
        let dayTotal = {
            minutes: 0,
            hours: 0,
        }
        let nightTotal = {
            minutes: 0,
            hours: 0,
        }
        for (let entry of myEntries) {
            let key = entry[0]
            if (!(typeof key === "string") || !isDate.test(key)) continue
            for (let drive of entry[1].drives) {
                if (drive.start && drive.end) {
                    let time = totalTime(drive.start, drive.end)
                    if (!time) continue
                    if (drive.time === "day") {
                        dayTotal.minutes += time.minutes
                        dayTotal.hours += time.hours
                    } else {
                        nightTotal.minutes += time.minutes
                        nightTotal.hours += time.hours
                    }
                }
            }
        }
        return { dayTotal: {
            minutes: dayTotal.minutes,
            hours: dayTotal.hours,
        }, nightTotal: {
            minutes: nightTotal.minutes,
            hours: nightTotal.hours,
        }}
    }

    async syncCount() {
        let updated = (await get("updated", this.store))?.size ?? 0
        return updated
    }
}

export default async function getDriveTime() {
    let store = await getUserStore()
    return new DriveTime(store)
}

