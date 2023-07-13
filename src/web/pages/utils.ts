import { Drive, TimeOfDay } from "../server/db.js"

function padNumber(num: number) {
    return (""+num).padStart(2, "0")
}

export function getCurrentDate() {
    let date = new Date()
    return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

export function getCurrentTime() {
    let date = new Date()
    return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
}

export function pluralize(count: number) {
    return count === 1 ? '' : 's'
}

export function totalTime(start: string | undefined, end: string | undefined) {
    if (!start || !end) return { hours: 0, minutes: 0 }
    let startParts = start.split(":")
    let endParts = end.split(":")
    let startHours = parseInt(startParts[0])
    let endHours = parseInt(endParts[0])
    let startMinutes = parseInt(startParts[1])
    let endMinutes = parseInt(endParts[1])
    let hours = endHours - startHours
    let minutes = endMinutes - startMinutes
    if (minutes < 0) {
        hours -= 1
        minutes += 60
    }
    return {
        hours,
        minutes,
    }
}

export function totalTimeArray(times: Drive[]) :
    { day: {hours: number, minutes: number}, night: {hours: number, minutes: number} } {
    let day = { hours: 0, minutes: 0 }
    let night = { hours: 0, minutes: 0 }
    for (let time of times) {
        let total = totalTime(time.start, time.end)
        if (time.time === "day") {
            day.hours += total.hours
            day.minutes += total.minutes
        } else {
            night.hours += total.hours
            night.minutes += total.minutes
        }
    }
    normalizeTime(day)
    normalizeTime(night)
    return { day, night }
}

export function normalizeTime(time: {hours: number, minutes: number}) {
    if (time.minutes >= 60) {
        time.hours += 1
        time.minutes -= 60
    }
    return time
}

export function toLocaleTimeString(time: string | undefined) {
    if (!time) return ""
    let parts = time.split(":")
    let hours = parseInt(parts[0])
    let minutes = parseInt(parts[1])
    let date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)
    let local = date.toLocaleTimeString()
    return `${local.slice(0, 5)}${local.slice(-3)}`
}


