import html, { when } from "../server/html.js"
import { version } from "../server/settings.js"
import createDb from "../server/drive-time-model.js"
import { pluralize } from "./utils.js"
import { daySymbol, nightSymbol } from "../server/utils.js"
import { globalDB } from "../server/global-model.js"

const layout = async (req: Request, o: LayoutTemplateArguments) => {
    const url = new URL(req.url).pathname
    const { main, head, scripts } = o
    let db = await createDb()
    let [syncCount, { day: dayTotal, night: nightTotal }, isLoggedIn] =
        await Promise.all([db.syncCount(), db.totalTime(), globalDB.isLoggedIn()])
    return html`
<!DOCTYPE html>
<html>
 <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drive Tracker</title>
    <link href="/web/css/index.css" rel=stylesheet>
    <link href="/web/css/app.css" rel=stylesheet>
    $${head}
</head>
<body>
    <nav>
        <ul>
            <li><a href="/web/"><strong>Drive Tracker</strong></a></li>
        </ul>
        <ul>
            ${[
                { url: "/web/entries/", text: "Drives" },
                { url: "/web/entries/edit/", text: "New" },
                { url: "/web/user-settings/edit/", text: "User Settings" },
            ].map(x => {
                if (x.url === url) {
                    return html`<li><strong>${x.text}</strong></li>`
                }
                return html`<li><a href="${x.url}">${x.text}</a></li>`
            }) }
            ${isLoggedIn
                ? html`<li><a href="/logout">Logout</a></li>`
            : html`<li><a href="/login">Login</a></li>`}
        </ul>
    </nav>
    <form id=sync-form method=POST action="/web/sync/"></form>
    <p><small>${daySymbol}
    ${dayTotal.hours} hour${pluralize(dayTotal.hours)}
    ${dayTotal.minutes} minute${pluralize(dayTotal.minutes)}
    🚗 ${nightSymbol} ${nightTotal.hours} hour${pluralize(nightTotal.hours)}
    ${nightTotal.minutes} minute${pluralize(nightTotal.minutes)}.</small></p>
    ${main}
    <footer><p>${version}</p></footer>
    ${ when(!!scripts, () => scripts!.map(x => html`<script src="${x}" type=module></script>`)) }
    <script src="/web/js/lib/mpa.min.js"></script>
</body>
</html>`
}

export default layout

export type Layout = typeof layout

export interface LayoutTemplateArguments {
    head?: string
    main?: AsyncGenerator|string
    scripts?: string[]
    bodyAttr?: string
}

