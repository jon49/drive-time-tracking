import { Route } from "../server/route.js";
import createDb from "../server/drive-time-model.js"
import layout from "./_layout.html.js";
import html from "html-template-tag-stream";
import { DriveDate } from "../server/db.js";
import { daySymbol, nightSymbol } from "../server/utils.js";
import { normalizeTime, toLocaleTimeString, totalTime, totalTimeArray } from "./utils.js";

function tbodyView(driveDates: DriveDate[]) {
        return driveDates.map(driveDate => {
        let drives = driveDate.drives
        drives.sort((a, b) => {
            if (!a.start) return -1
            if (!b.start) return 1
            return a.start < b.start ? -1 : 1
        })
        return drives.map((drive, index) =>
         html`
        <tr>
            ${ () => {
                if (index > 0) return null
                // Get total time for the day
                let { day, night } = totalTimeArray(driveDate.drives)
                let total = normalizeTime({
                    hours: day.hours + night.hours,
                    minutes: day.minutes + night.minutes })
                return html`<td rowspan="${driveDate.drives.length}">${driveDate.date} (${total.hours}h ${total.minutes}m)</td>` 
            }}
            <td>${toLocaleTimeString(drive.start)}</td>
            <td>${toLocaleTimeString(drive.end)}</td>
            <td>${() => {
                let total = totalTime(drive.start, drive.end)
                return html`${total.hours}h ${total.minutes}m`
            } }</td>
            <td>${drive.time === "day" ? daySymbol : nightSymbol}</td>
        </tr>
    `)})
}

function render(driveDates: DriveDate[]) {
    return html`
<h1>Drives</h1>
<table>
    <thead>
        <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Total</th>
            <th>${daySymbol}/${nightSymbol}</th>
        </tr>
    </thead>
    <tbody>${tbodyView(driveDates)}</tbody>
</table>`
}

let route : Route = {
    route: /\/web\/entries\/$/,
    get: async (req: Request) => {
        let db = await createDb()
        let driveDates = await db.getDriveDates()
        driveDates.sort((a, b) => {
            return a.date < b.date ? 1 : -1
        })
        return layout(req, { main: render(driveDates) })
    }
}

export default route

