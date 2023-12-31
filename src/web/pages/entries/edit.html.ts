import html, { when } from "../../server/html.js"
import layout from "../_layout.html.js"
import { daySymbol, nightSymbol, searchParams, tail } from "../../server/utils.js"
import { Drive, DriveDate, TimeOfDay } from "../../server/db.js"
import { PostHandlers, Route } from "../../server/route.js"
import createDb from "../../server/drive-time-model.js"
import { getCurrentTime, pluralize, toLocaleTimeString, totalTime } from "../utils.js"
import { updated } from "../../server/sync.js"

function timeOfDay(time: TimeOfDay | undefined) {
    let text = time === "night" ? `Night ${nightSymbol}` : `Day ${daySymbol}`
    return html`<button id=toggle-time formaction="?handler=toggleTime">$${text}</button>`
}

function editEntry(index: number, drive: Drive, date: string) {
    // For calculating the time here I can use the soccer web component that
    // shows time in real time.
    return html`
<article>
<form method="POST" action="?handler=update" onchange="this.submit()">
    ${ when(!!(drive.start && drive.end), () => calculateHours(drive.start, drive.end)) }
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
    ${ when(!!drive.start, () => html`${ timeOfDay(drive.time) }`) }
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
<h2>
    <form onchange="this.submit()">
        <input id=date class=edit type=date name=date value="$${date}">
        <label for=date><strong>${driveDate.date}</strong> <span class=edit-pencil>&#9998;</span></label>
    </form>
</h2>
${drives.map((drive, idx) => editEntry(idx, drive, date)).reverse()}`
}

const post : PostHandlers = {
    update: async ({ data }) => {
        let db = await createDb()
        await db.saveDrive(data)
        updated(true)
    },
    toggleTime: async ({ data }) => {
        let db = await createDb()
        await db.toggleTimeOfDay(data)
        updated(data.end)
    },
    start: async ({ data }) => {
        let db = await createDb()
        data.start = getCurrentTime()
        await db.saveDrive(data)
        updated()
    },
    stop: async ({ data }) => {
        let db = await createDb()
        data.end = getCurrentTime()
        await db.saveDrive(data)
        updated(true)
    },
}

let index : Route = {
    route: /\/web\/entries\/edit\/$/,
    get: async (req: Request) => {
        let db = await createDb()
        let driveDate = await db.get(searchParams<{date?: string}>(req))
        let lastDrive = tail(driveDate.drives)
        return layout(req, { main: render(driveDate), enableBeep: !lastDrive?.end })
    },
    post,
}

function setTime(time: string | undefined) {
    if (time) {
        return `: ${toLocaleTimeString(time)}`
    }
    return ""
}

function calculateHours(start: string | undefined, end: string | undefined) {
    if (!start || !end) return null
    let { hours, minutes } = totalTime(start, end)
    return html`<p>Drive time ${hours} hour${pluralize(hours)} and ${minutes} minute${pluralize(minutes)}.</p>`
}

export default index

