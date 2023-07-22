import { set } from "../server/db.js"
import html from "../server/html.js"
import { updated } from "../server/sync.js"
import { searchParams } from "../server/utils.js"
import layout from "./_layout.html.js"

let index = {
    route: /\/web\/$/,
    get: async (req: Request) => {
        let params = searchParams<{ success?: string }>(req)
        if (params.success === "true") {
            await set("loggedIn", true, false)
            updated(true)
        }
        return layout(req, { main: html`<p>Welcome to drive tracking!</p>` })
    }
}

export default index

