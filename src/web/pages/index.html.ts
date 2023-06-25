import html from "../server/html.js"
import layout from "./_layout.html.js"

let index = {
    route: /\/web\/$/,
    get: (req: Request) => {
        return layout(req, { main: html`<p>Welcome to drive tracking!</p>` })
    }
}

export default index

