import { DriveDate, get, getUserIndex, set, entries } from "./db.js"
import { reject } from "./utils.js"
import { createDateString, createInteger, createTimeOfDay, createTimeString, maybe, validateObject } from "./validation.js"
import { getCurrentDate, totalTimeArray } from "../pages/utils.js"

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

type Unwrap<T> =
	T extends Promise<infer U> ? U :
	T extends (...args: any) => Promise<infer U> ? U :
	T extends (...args: any) => infer U ? U :
	T
type ResultType<T> = { [K in keyof T]: Unwrap<T[K]> }

class DriveTime {

    userId: number

    constructor(userId: number) {
        this.userId = userId
    }

    async get(date_: { date?: string }) {
        let { date } = await validateObject(date_, maybeDateValidator)
        if (!date) {
            date = getCurrentDate()
        }
        return  (await get<DriveDate>([this.userId, date])) ?? {
            date,
            drives: [],
            _rev: 0,
        }
    }

    async saveDrive(data: ResultType<typeof driveValidator>) {
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
        await set(<any>[this.userId, date], driveDate)
    }

    async toggleTimeOfDay(data: ResultType<typeof driveValidator>) {
        let drive = await validateObject(data, driveValidator)
        if (drive.time === "day") {
            drive.time = "night"
        } else {
            drive.time = "day"
        }
        await this.saveDrive(drive)
    }

    async totalTime() {
        let myEntries = await entries()
        let times = []
        for (let entry of myEntries) {
            let key_ = entry[0]
            if (!Array.isArray(key_)) continue
            let key = key_[1]
            if (!(typeof key === "string") || !isDate.test(key)) continue
            times.push(...entry[1].drives)
        }

        return totalTimeArray(times)
    }

    async syncCount() {
        let updated = (await get("updated"))?.size ?? 0
        return updated
    }

    async getDriveDates() {
        let myEntries = await entries()
        let driveDates = []
        for (let entry of myEntries) {
            let key_ = entry[0]
            if (!Array.isArray(key_)) continue
            if (key_[0] !== this.userId) continue
            let key = key_[1]
            if (!(typeof key === "string") || !isDate.test(key)) continue
            driveDates.push(entry[1])
        }
        return driveDates
    }
}

export default async function getDriveTime() {
    let index = await getUserIndex()
    return new DriveTime(index)
}

