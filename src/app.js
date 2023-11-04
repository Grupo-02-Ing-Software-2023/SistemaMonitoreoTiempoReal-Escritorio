const { ipcRenderer } = require("electron")

window.addEventListener("DOMContentLoaded", () => {

    /*
    document.getElementById('btnScreenshot').addEventListener("click", () => {
        ipcRenderer.send("screenshot:capture", {})
    })*/

    ipcRenderer.on("screenshot:capture", (e, imageData) => {
        document.getElementById("placeholder").src = imageData
    })
})

document.getElementById('flexSwitchCheckDefault').addEventListener("change", (event) => {
    const isChecked = event.target.checked
    ipcRenderer.send("screenshot:capture", { isChecked })


    /*
    if (event.target.checked) {
        ipcRenderer.send("screenshot:capture", {})
    } else {
        alert('El checkbox ha sido desactivado');
    }
    */
})