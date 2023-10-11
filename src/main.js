const { app, BrowserWindow, desktopCapturer, ipcMain, screen } = require("electron");
let fs = require('fs');
let path = require("path")
let window = null

app.whenReady().then(() => {
  createWindow()
})

const createWindow = () => {
  window = new BrowserWindow({
    title: "SIMOTRE",
    width: 300,
    height: 400,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "app.js")
    }
  })

  window.loadFile(path.join("src/ui/index.html"))
  window.removeMenu()
  // window.webConten:ts.openDevTools()
}


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

function WriteFile(image) {
  /*
  fs.readFile(__dirname + '/test.txt', function (err, data) {
    if (!err) {
      console.log(data.toString());
    }
  });
  */

  fs.writeFile(__dirname + '/test.txt', image, function (err) {
    if (!err) {
      console.log("The file was saved!");
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/*
module.exports = {
  createWindow,
};
*/