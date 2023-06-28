import html from "../../server/html.js"
import layout from "../_layout.html.js"
import { searchParams } from "../../server/utils.js"
import { Drive, DriveDate, TimeOfDay } from "../../server/db.js"
import { PostHandlers } from "../../server/route.js"
import createDb from "../../server/drive-time-model.js"

function timeOfDay(time: TimeOfDay | undefined) {
    return (!time || time === "day")
        ? html`<button formaction="?handler=setNight">Day &#9728;</button>`
    : html`<button formaction="?handler=setDay">Night &#9789;</button>`
}

function editEntry(index: number, drive: Drive, date: string) {
    // For calculating the time here I can use the soccer web component that
    // shows time in real time.
    return html`
<article>
<form method="POST" action="?handler=update" onchange="this.submit()">
    ${ drive.start && drive.end ? calculateHours(drive.start, drive.end) : html`<p>Hours: 0</p>` }
    <input type="hidden" name="date" value="${date}">
    <input type="hidden" name="index" value="${drive.start ? index : -1}">
    <input type="hidden" name="time" value="${drive.time}">
    <div class=grid>
        <div>${
            !drive.start
                ? html`<button formaction="?handler=start">Start</button>`
            : html`
            <input id=start_${index} class=edit type=time name=start value="$${drive.start}" mpa-skip-focus>
            <label for=start_${index}>Start time$${setTime(drive.start)} <span class=edit-pencil>&#9998;</span></label>`}
        </div>
        ${ () => {
            if (drive.start && drive.end) {
                return html`
                <div>
                    <input id=end_${index} class=edit type=time name=end value="$${drive.end}" mpa-skip-focus>
                    <label for=end_${index}>Stop time$${setTime(drive.end)} <span class=edit-pencil>&#9998;</span></label>
                </div>`
            } else if (drive.start && !drive.end) {
                return html`<button formaction="?handler=stop">Stop</button>`
            }
            return ""
        }}
    </div>
    <br>
    ${ drive.start ? html`${ timeOfDay(drive.time) }` : "" }
</form>
</article>`
}

function render(driveDate: DriveDate) {
    let date = driveDate.date
    let drives = driveDate.drives
    if (drives.length === 0) {
        driveDate.drives.push({})
    }
    if (drives[driveDate.drives.length - 1].end) {
        driveDate.drives.push({})
    }

    return html`
<h2>${driveDate.date}</h2>
${drives.map((drive, idx) => editEntry(idx, drive, date)).reverse()}`
}

const post : PostHandlers = {
    update: async ({ data }) => {
        let db = await createDb()
        db.saveDrive(data)
    },
    setNight: async ({ data }) => {
        let db = await createDb()
        data.time = "night"
        return db.saveDrive(data)
    },
    setDay: async ({ data }) => {
        let db = await createDb()
        data.time = "day"
        return db.saveDrive(data)
    },
    start: async ({ data }) => {
        let db = await createDb()
        data.start = getCurrentTime()
        return db.saveDrive(data)
    },
    stop: async ({ data }) => {
        let db = await createDb()
        data.end = getCurrentTime()
        return db.saveDrive(data)
    },
}

let index = {
    route: /\/web\/entries\/edit\/$/,
    get: async (req: Request) => {
        let db = await createDb()
        let driveDate = await db.get(searchParams<{date?: string}>(req))
        return layout(req, db.store, {
            main: render(driveDate)
        })
    },
    post,
}

function padNumber(num: number) {
    return (""+num).padStart(2, "0")
}

function getCurrentTime() {
    let date = new Date()
    return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
}

function pluralize(count: number, singular: string, plural: string) {
    return count === 1 ? singular : plural
}

function calculateHours(start: string, end: string) {
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
    return html`<p>Drive time ${hours} ${pluralize(hours, "hour", "hours")} and ${minutes} ${pluralize(minutes, "minute", "minutes")}.</p>`
}

function toLocaleTimeString(time: string) {
    let parts = time.split(":")
    let hours = parseInt(parts[0])
    let minutes = parseInt(parts[1])
    let date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)
    let local = date.toLocaleTimeString()
    return `${local.slice(0, 5)}${local.slice(-3)}`
}

function setTime(time: string | undefined) {
    if (time) {
        return `: ${toLocaleTimeString(time)}`
    }
    return ""
}

export default index

