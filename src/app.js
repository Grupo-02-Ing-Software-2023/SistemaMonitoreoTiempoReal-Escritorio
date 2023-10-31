const { ipcRenderer } = require("electron")

window.addEventListener("DOMContentLoaded", () => {

    document.getElementById('btnScreenshot').addEventListener("click", () => {
        ipcRenderer.send("screenshot:capture", {})
    })

    ipcRenderer.on("screenshot:capture", (e, imageData) => {
        document.getElementById("placeholder").src = imageData
    })
})