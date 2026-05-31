const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let mainWindow; // <-- FIX: declare globally

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'build/ico.ico'),
    frame: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
            webviewTag: true

    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools({ mode: 'detach' })

}

app.whenReady().then(() => {
  createWindow();

  // Close app
  ipcMain.on('close', () => {
    app.quit();
  });

  // Minimize app
  ipcMain.on('minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
