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

export function pluralize(count: number, singular: string, plural: string) {
    return count === 1 ? singular : plural
}

export function totalTime(start: string, end: string) {
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

export function toLocaleTimeString(time: string) {
    let parts = time.split(":")
    let hours = parseInt(parts[0])
    let minutes = parseInt(parts[1])
    let date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)
    let local = date.toLocaleTimeString()
    return `${local.slice(0, 5)}${local.slice(-3)}`
}


