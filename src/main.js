const { app, BrowserWindow, desktopCapturer, ipcMain, screen } = require("electron");
const axios = require('axios');
let fs = require('fs');
let path = require("path")
let window = null

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
  window.webContents.openDevTools()
}

function WriteFile(image) {
  fs.writeFile(__dirname + '/test.txt', image, function (err) {
    if (!err) {
      console.log("The file was saved!");
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


ipcMain.on("login", async (e, { email, password }) => {
  try {
    const response = await axios.post('https://igf-backend-production.up.railway.app/api/auth/login', { email, password });
    const data = response.data;

    console.log(data)

    if (response.status === 200) {
      if (data.usuario && data.token) {
        createWindowIndex()
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


const createWindowIndex = () => {
  window.loadFile(path.join("src/ui/index.html"))

  const timerId = setInterval(function () {
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
        window.webContents.send("screenshot:capture", image)
        WriteFile(image)
      })
      .catch(err => {
        console.log(err)
      })
  }, 5000);

  window.on('closed', function () {
    clearInterval(timerId);
    window = null;
  });
}

/*

ipcMain.on("screenshot:capture", (e, value) => {
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
      window.webContents.send("screenshot:capture", image)
      WriteFile(image)
    })
    .catch(err => {
      console.log(err)
    })
})

*/

