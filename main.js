const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const path = require('node:path');

let mainWindow; // <-- FIX: declare globally

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'build/ico.ico'),
    frame: false,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
            webviewTag: true

    }
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools({ mode: 'detach' })


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

///ipcMain.on('')
//// thinking of adding another buttons PS: if your reading this msg me on slack and tell me what you think and also tell me what the button should do
  ipcMain.handle('cookies-get', async (event, webContentsId, url) => {
    const targetContents = webContents.fromId(webContentsId);
    if (!targetContents) {
      throw new Error('WebContents not found');
    }
    return targetContents.session.cookies.get({ url });
  });

  ipcMain.handle('cookies-clear', async (event, webContentsId, url) => {
    const targetContents = webContents.fromId(webContentsId);
    if (!targetContents) {
      throw new Error('WebContents not found');
    }
    const origin = new URL(url).origin;
    await targetContents.session.clearStorageData({ storages: ['cookies'], origins: [origin] });
    return { success: true };
  });

  ipcMain.handle('cookies-set', async (event, webContentsId, cookie) => {
    const targetContents = webContents.fromId(webContentsId);
    if (!targetContents) {
      throw new Error('WebContents not found');
    }
    await targetContents.session.cookies.set(cookie);
    return { success: true };
  });

  ipcMain.handle('download-file', async (event, url) => {
    downloadItem = await mainWindow.webContents.downloadURL(url);
    console.log(`Download started for URL: ${url}`);
  });

  ipcMain.handle('decline-download', async (event, url) => {
    // Implementation for handling decline download request
    console.log(`Download declined for URL: ${url}`);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
