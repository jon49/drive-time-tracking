import { addRoutes } from "../server/route.js"
import index from "../pages/index.html.js"
import editEntry from "../pages/entries/edit.html.js"
import entries from "../pages/entries.html.js"

addRoutes([
    index,
    editEntry,
    entries,
])

