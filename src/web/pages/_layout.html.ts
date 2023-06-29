import html from "../server/html.js"
import { version } from "../server/settings.js"
import { UseStore, get } from "idb-keyval"

const getSyncCount = async (store: UseStore) => (await get("updated", store))?.size ?? 0

const layout = async (req: Request, store: UseStore | null, o: LayoutTemplateArguments) => {
    const url = new URL(req.url).pathname
    const { main, head, scripts } = o
    const syncCount = store ? (await getSyncCount(store)) : ""
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
    <nav>
        <ul>
            <li><strong>Drive Tracker</strong></li>
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
            <li><button role=button form=sync-form disabled title="Sync hasn't been implemented yet.">Sync&nbsp;-&nbsp;${syncCount}</button></li>
            <li><a role="button" disabled href="/login?handler=logout">Logout</a></li>
        </ul>
    </nav>
    <form id=sync-form method=POST action="/web/sync/"></form>
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

