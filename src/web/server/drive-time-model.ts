import { UseStore } from "idb-keyval"
import { DriveDate, get, getUserStore, set } from "./db.js"
import { reject } from "./utils.js"
import { createDateString, createInteger, createTimeOfDay, createTimeString, maybe, validateObject } from "./validation.js"

const driveValidator = {
    date: createDateString('date'),
    end: maybe(createTimeString('end')),
    start: createTimeString('start'),
    time: maybe(createTimeOfDay('time')),
    index: createInteger('index'),
}

const dateValidator = {
    date: maybe(createDateString('date'))
}

class DriveTime {

    store: UseStore

    constructor(store: UseStore) {
        this.store = store
    }

    async get(date_: any) {
        let { date } = await validateObject(date_, dateValidator)
        if (!date) {
            date = new Date().toISOString().slice(0, 10)
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
        let driveDate = await this.get(date)
        let current = driveDate.drives[index]
        let drive = { start, end, time: time || "day" }
        if (!current) {
            driveDate.drives.push(drive)
        } else {
            Object.assign(current, drive)
        }
        await set(date, driveDate, this.store)
    }
}

export default async function getDriveTime() {
    let store = await getUserStore()
    return new DriveTime(store)
}

