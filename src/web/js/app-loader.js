"use strict";
(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
        .register(`/web/sw.js`)
        .then(_ => {
            console.log("Service worker registered.")
            setTimeout(() => {
                if (document.location.pathname.endsWith(".html")) {
                    document.location.href = "/web/"
                }
                document.location.reload()
            }, 100)
        })
    } else {
        alert("Service worker is not supported. Please use a modern browser.")
    }
})()
