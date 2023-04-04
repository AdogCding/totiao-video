// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer, ipcMain} = require('electron')

contextBridge.exposeInMainWorld('pieApi', {
    downloadVideoByPcUrl: (url) => ipcRenderer.invoke('video:downloadVideoByPcUrl', url),
    changeVideoDownloadLocation: (location) => ipcRenderer.invoke('file:changeVideoDownloadLocation',location),
    chooseVideoDownloadFolder: () => ipcRenderer.invoke('file:chooseVideoDownloadFolder')
})