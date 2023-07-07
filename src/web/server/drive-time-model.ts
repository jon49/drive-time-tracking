import { DriveDate, get, getUserIndex, set, entries } from "./db.js"
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
        let dayTotal = {
            minutes: 0,
            hours: 0,
        }
        let nightTotal = {
            minutes: 0,
            hours: 0,
        }
        for (let entry of myEntries) {
            let key_ = entry[0]
            if (!Array.isArray(key_)) continue
            let key = key_[1]
            if (!(typeof key === "string") || !isDate.test(key)) continue
            for (let drive of entry[1].drives) {
                if (drive.start && drive.end) {
                    let time = totalTime(drive.start, drive.end)
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

