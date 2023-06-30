import { UseStore } from "idb-keyval"
import { DriveDate, get, getUserStore, set } from "./db.js"
import { reject } from "./utils.js"
import { createDateString, createInteger, createTimeOfDay, createTimeString, maybe, validateObject } from "./validation.js"
import { getCurrentDate } from "../pages/utils.js"

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
}

export default async function getDriveTime() {
    let store = await getUserStore()
    return new DriveTime(store)
}

