const { ipcRenderer } = require("electron")

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById('loginButton').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        ipcRenderer.send("login", {email, password})
    })

    ipcRenderer.on("login", (e, msg) => {
        dump(msg);
    })
})