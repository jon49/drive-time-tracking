import html, { when } from "../../server/html.js"
import layout from "../_layout.html.js"
import { searchParams } from "../../server/utils.js"
import { Drive, DriveDate, TimeOfDay } from "../../server/db.js"
import { PostHandlers } from "../../server/route.js"
import createDb from "../../server/drive-time-model.js"
import { getCurrentTime, pluralize, toLocaleTimeString, totalTime } from "../utils.js"

function timeOfDay(time: TimeOfDay | undefined) {
    let text = time === "night" ? "Night &#9789;" : "Day &#9728;"
    return html`<button formaction="?handler=toggleTime">$${text}</button>`
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
        db.saveDrive(data)
    },
    toggleTime: async ({ data }) => {
        let db = await createDb()
        return db.toggleTimeOfDay(data)
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

function setTime(time: string | undefined) {
    if (time) {
        return `: ${toLocaleTimeString(time)}`
    }
    return ""
}

function calculateHours(start: string | undefined, end: string | undefined) {
    if (!start || !end) return null
    let { hours, minutes } = totalTime(start, end)
    return html`<p>Drive time ${hours} ${pluralize(hours, "hour", "hours")} and ${minutes} ${pluralize(minutes, "minute", "minutes")}.</p>`
}

export default index

