// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer, ipcMain} = require('electron')
import videoDirective from "./video/videoDirective";

contextBridge.exposeInMainWorld('pieApi', {
    downloadVideoByPcUrl: (url) => ipcRenderer.invoke(videoDirective.DOWNLOAD_VIDEO_BY_PC_URL, url),
    changeVideoDownloadLocation: (location) => ipcRenderer.invoke(videoDirective.CHANGE_VIDEO_DOWNLOAD_LOCATION,location),
    chooseVideoDownloadFolder: () => ipcRenderer.invoke(videoDirective.CHOOSE_VIDEO_DOWNLOAD),
    readAppConfig: () => ipcRenderer.invoke(videoDirective.READ_APP_CONFIG),
    probeVideoFile: (fileName) => ipcRenderer.invoke(videoDirective.PROBE_FILE_FORMAT, fileName),
})