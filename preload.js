const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe 'electronAPI' object to the frontend window
contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app')
});
