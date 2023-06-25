import html from "../server/html.js"
import * as db from "../server/db.js"
import { version } from "../server/settings.js"

const getSyncCount = async () => (await db.get("updated"))?.size ?? 0

const layout = (req: Request, o: LayoutTemplateArguments) => {
    const url = req.url
    const { main, head, scripts } = o
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
    <div id=messages></div>
    <a href="/login?handler=logout" style="position: absolute; top: 10px; right: 10px;">Logout</a>
    <header>
        <div class=sync>
            <h1 class=inline>Drive Tracker</h1>
            <form class=inline method=POST action="/web/sync/">
                <input type=hidden name=url value="${url}">
                <button disabled title="Sync hasn't been implemented yet.">Sync&nbsp;-&nbsp;${getSyncCount}</button>
            </form>
        </div>
        <nav>
            <a href="/web/entries">Entries</a>
            | <a href="/web/entries/edit">Add/Edit</a>
            | <a href="/web/user-settings/edit">User Settings</a>
        </nav>
    </header>
    <main>${main}</main>
    <footer><p>${version}</p></footer>
    ${ scripts
         ? scripts.map(x => html`<script src="${x}" type=module></script>`)
       : null }
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

