const { ipcRenderer } = require("electron")

const check = document.getElementById('flexSwitchCheckDefault')
const inputSala = document.getElementById('inputSala')

ipcRenderer.on("screenshot:capture", (e, value) => {
    if (value.status) {

        const date = new Date(value.inicioSesion);

        document.getElementById('mensaje1').textContent = "Conectado";
        document.getElementById('card1').textContent = "Sala: " + value.nombreSala;
        document.getElementById('card2').textContent = formateHour(date);
    } else {
        alert(value.msg || "Error al conectarse a la sala");
        document.getElementById('flexSwitchCheckDefault').checked = false;
        //document.getElementById('inputSala').disabled = false;
        //document.getElementById('inputSala').readOnly = true;

    }
})

check.addEventListener("change", (event) => {
    const codigoSala = inputSala.value;

    if (codigoSala.trim().length == 0) {
        alert("Ingresa el codigo de la sala");
        desconecxion();
    } else {
        const isChecked = event.target.checked;
        if(!isChecked){
            desconecxion()
        }
        inputSala.disabled = isChecked;
        ipcRenderer.send("screenshot:capture", { codigoSala, isChecked })
    }
})

function formateHour(date) {
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    const segundos = String(date.getSeconds()).padStart(2, '0');

    // Formatea la hora en un formato legible
    return `Hora de conexión: ${horas}:${minutos}:${segundos}`;
}

function desconecxion() {
    document.getElementById('flexSwitchCheckDefault').checked = false;
    document.getElementById('inputSala').disabled = false;
    document.getElementById('mensaje1').textContent = "Conectate a una sala para iniciar";
    document.getElementById('card1').textContent = "No estas conectado a ninguna sala";
    document.getElementById('card2').textContent = "No estas conectado a ninguna sala";
}