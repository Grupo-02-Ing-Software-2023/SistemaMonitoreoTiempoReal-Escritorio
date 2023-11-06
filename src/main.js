const { app, BrowserWindow, desktopCapturer, ipcMain, screen, dialog } = require("electron");
const Store = require('electron-store');
const axios = require('axios');
const FormData = require('form-data');
let fs = require('fs');
let path = require("path");
const { config } = require("dotenv");

require('dotenv').config();
const baseURL = process.env.baseURL || "https://igf-backend-production.up.railway.app/api";

let window = null;
let timerId = null;
const store = new Store();

app.whenReady().then(() => {
    createWindow()
})

const createWindow = () => {
    window = new BrowserWindow({
        title: "SIMOTRE",
        width: 880,
        height: 440,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, "app.js")
        }
    })

    window.loadFile(path.join("src/ui/login.html"))
    window.removeMenu()
    //window.webContents.openDevTools()
}

function WriteFile(image) {
    fs.writeFile(__dirname + '/test.txt', image, function (err) {
        if (!err) {
            console.log("The file was saved!");
        }
    });
}

app.on('window-all-closed', () => {
    store.delete('token');
    store.delete('usuario');
    store.delete('sesion');
    store.delete('sala');
    if (process.platform !== 'darwin') app.quit()
})


ipcMain.on("login", async (e, { email, password }) => {
    try {
        const response = await axios.post(baseURL + '/auth/login', { email, password });
        const data = response.data;

        if (response.status === 200) {
            if (data.usuario && data.token) {

                store.set('usuario', data.usuario);
                store.set('token', data.token);
                window.loadFile(path.join("src/ui/index.html"))
            } else {
                let msg = 'Respuesta de inicio de sesión no válida.'
                window.webContents.send("login", msg)
            }
        } else {
            let msg = data.msg || 'Inicio de sesión fallido. Por favor, inténtalo de nuevo.'
            window.webContents.send("login", msg)
        }

    } catch (error) {
        let msg = 'Inicio de sesión fallido. Por favor, inténtalo de nuevo.'
        window.webContents.send("login", msg)
    }
})

ipcMain.on("screenshot:capture", (e, value) => {
    if (value.isChecked) {
        conectarSala(value.codigoSala);
    } else {
        clearInterval(timerId);
        const hora_fin_sesion = new Date();
        const config = {
            headers: {
                'x-token': store.get('token'),
                'Content-Type': 'application/json',
                'Accept-Charset': 'utf-8'
            }
        };
        axios.put(`${baseURL}/sesiones/${store.get('sesion')._id}`, { hora_fin_sesion }, config)
        .then(response => {
            const data = response.data;
            store.delete('sesion');
            store.delete('sala');
        })
        .catch(error => {
            console.log(error)
        });
    }
})


const conectarSala = async (codigoSala) => {
    const config = {
        headers: {
            'x-token': store.get('token'),
            'Content-Type': 'application/json',
            'Accept-Charset': 'utf-8'
        }
    };

    axios.get(`${baseURL}/salas/${codigoSala}`, config)
        .then(response => {
            const data = response.data;
            store.set('sala', data);

            const hora_inicio_sesion = fecha_sesion = new Date();
            const hora_fin_sesion = "";
            const sala = data._id;

            return axios.post(baseURL + '/sesiones/', {hora_inicio_sesion, hora_fin_sesion, fecha_sesion, sala }, config)
            
        })
        .then(secondResponse => {
            const secondData = secondResponse.data;
            store.set('sesion', secondData.sesion);
            console.log(secondData.sesion)

            window.webContents.send("screenshot:capture", { status: true, inicioSesion: secondData.sesion.hora_inicio_sesion, nombreSala: store.get('sala').nom_sala })
            CrearCaptura();
        })
        .catch(error => {
            window.webContents.send("screenshot:capture", { status: false, msg: error.message })
        });
}

const CrearCaptura = () => {
    timerId = setInterval(function () {
        const mainScreen = screen.getPrimaryDisplay();
        desktopCapturer
            .getSources({
                types: ["screen"],
                thumbnailSize: {
                    width: mainScreen.size.width,
                    height: mainScreen.size.height
                }
            })
            .then((sources) => {
                let image = sources[0].thumbnail.toDataURL()
                EnviarCaptura(image)
            })
            .catch(err => {
                console.log(err)
            })
    }, process.env.TIME || 20000);
}

const EnviarCaptura = (image) => {

    const url_captura = "";
    const fecha_captura = new Date();
    const sesion = store.get('sesion')._id;
    const usuario = store.get('usuario');
    const nom_captura = nombreCaptura(usuario._id);
    const savePath = `${__dirname}/user_images/${nom_captura}.jpg`;
    createImageFileFromBase64(image, savePath);

    const config = {
        headers: {
            'x-token': store.get('token'),
            'Content-Type': 'application/json',
            'Accept-Charset': 'utf-8'
        }
    };

    axios.post(baseURL + '/capturas/', { url_captura, nom_captura, fecha_captura, sesion, usuario }, config)
        .then(response => {
            const data = response.data;
            console.log(data)

            const form = new FormData();
            form.append('archivo', fs.createReadStream(savePath));

            const config2 = {
                headers: {
                    'x-token': store.get('token'),
                    ...form.getHeaders(),
                    'Accept-Charset': 'utf-8'
                }
            };

            return axios.put(baseURL + '/uploadCaptura/' + data.captura._id, form, config2)
        })
        .then(secondResponse => {
            const secondData = secondResponse.data;
            console.log(secondData);

            // Verifica si el archivo existe antes de intentar eliminarlo
            if (fs.existsSync(savePath)) {
                fs.unlink(savePath, (err) => {
                    if (err) {
                        console.error('Error al eliminar el archivo:', err);
                    } else {
                        console.log('Archivo eliminado con exito.');
                    }
                });
            }
        })
        .catch(error => {
            if (error.response) {
                console.log(error.response.data.msg);
            } else {
                console.error(error.message);
            }
        });
}

async function createImageFileFromBase64(base64String, savePath) {

    // Convierte la cadena Base64 en un blob
    const byteCharacters = atob(base64String.split(',')[1]);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: 'image/jpg' });

    // Guarda el archivo en la ruta de destino
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(savePath, buffer);
}

function nombreCaptura(usuario_id) {
    const date = new Date();
    const año = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0'); // Agrega un 0 al principio si es necesario
    const dia = String(date.getDate()).padStart(2, '0');
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    const segundos = String(date.getSeconds()).padStart(2, '0');

    // Formatea la fecha para formar el nombre de la imagen
    const nombreImagen = `${año}-${mes}-${dia}_${horas}-${minutos}-${segundos}_${usuario_id}`;
    return nombreImagen;
}