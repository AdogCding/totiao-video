const {app, BrowserWindow, ipcMain} = require('electron');
const puppeteer = require('puppeteer-core')
const pie = require("puppeteer-in-electron")
const fs = require('fs')
const path = require('path')
const {dialog} = require('electron')
const wget = require('node-wget');

import ffmpegExecutable from 'ffmpeg-static-electron'
import ffprobeExecutable from 'ffprobe-static-electron'
import ffmpeg from 'fluent-ffmpeg'

console.log(ffmpegExecutable, ffprobeExecutable)

const appConfig = {
    videoLocation:app.getPath('userData'),
    ffprobeLocation:ffprobeExecutable.path,
    ffmpegLocation: ffmpegExecutable.path,
}

ffmpeg.setFfmpegPath(appConfig.ffmpegLocation)
ffmpeg.setFfprobePath(appConfig.ffprobeLocation)

async function probVideoFormat(video) {
    return new Promise((resolve, reject) => {
        ffmpeg(video).ffprobe(0, function(err, data){
            if (err) {
                reject(err)
                return
            }
            resolve(data)
        })
    })

}
import VIDEO_DIRECTIVE from '../video/videoDirective'


import VIDEO_DOWNLOAD_ERROR from '../video/videoStdError'
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}


const pieInit = initPuppeteer()

pieInit.then(() => {
    console.log('init puppeteer finished')
}).catch(err => {
    console.error("app quit with", err)
    app.quit()
})
// 初始化puppeteer
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minHeight:600,
        minWidth:800,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });
    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(() => {
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    // Open the DevTools.
    return mainWindow
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    const pBrowser = await pie.connect(app, puppeteer)
    const mainWin = createWindow()
    bindVideoDirectives(pBrowser, ipcMain, mainWin)
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
function initPuppeteer() {
    return pie.initialize(app);
}


async function canVideoDownloadDirectlyFromPage(initPage) {
    const srcUrlStr = await initPage.$eval("video", el => el.getAttribute('src'))
    return [!srcUrlStr.startsWith('blob'), srcUrlStr];
}

async function getVideoUrlSet(initPage, urlSize) {
    await initPage.setRequestInterception(true)
    initPage.on('request', (req) => {
        req.continue()
    })
    return new Promise((resolve) => {
        const urlSet = new Set()
        initPage.on('response', (rsp) => {
            const headers = rsp.headers()
            if (headers['content-type'] === 'video/mp4') {
                urlSet.add(rsp.url())
                if (urlSet.size >= urlSize) {
                    resolve(urlSet)
                }
            }
        })
    })
}

/**
 * ffmpeg可执行文件地址
 */
function chooseFfmpegLocation({ffmpegLocation, ffprobeLocation}) {
    if (!ffprobeLocation) {
        throw Error()
    }
    if (!ffprobeLocation) {
        throw Error()
    }
    appConfig.ffmpegLocation = ffmpegLocation
    appConfig.ffprobeLocation = ffprobeLocation
}


async function downloadByUrlStr(urlStr, fileName) {
    return new Promise((resolve, reject) => {
        wget({url: urlStr, dest: fileName}, (error) => {
            if (error) {
                reject(error)
            }
            resolve('success')
        })
    })
}

function checkAppConfig() {
    try {
        const videoLocationCheckRes = checkVideoDownloadLocation(appConfig.videoLocation)
        if (!videoLocationCheckRes) {
            return [false, 'videoLocation']
        }

    } catch (err) {
        return [false, 'videoLocation']
    }
    if (!appConfig.ffprobeLocation) {
        return [false, 'ffprobeLocation']
    }
    if (!appConfig.ffmpegLocation) {
        return [false, 'ffmpegLocation']
    }
    return [true]
}

function checkVideoDownloadLocation(directory) {
    if (!directory) {
        throw Error(VIDEO_DOWNLOAD_ERROR.VIDEO_DOWNLOAD_LOCATION_NOT_SET.message)
    }
    if (!fs.existsSync(directory)) {
        throw Error(VIDEO_DOWNLOAD_ERROR.DIRECTORY_NOT_EXISTS.message)
    }
    try {
        fs.accessSync(appConfig.videoLocation, fs.constants.W_OK | fs.constants.R_OK)
    } catch (err) {
        throw new Error(VIDEO_DOWNLOAD_ERROR.DIRECTORY_NOT_ACCESSIBLE.message)
    }
    return true
}

function createFileNameFromTitle(title) {
    checkVideoDownloadLocation(appConfig.videoLocation)
    const fileName = `${appConfig.videoLocation}\\${title}.mp4`
    if (fs.existsSync(fileName)) {
        throw new Error(VIDEO_DOWNLOAD_ERROR.FILE_EXISTS.message)
    }
    return fileName
}

function bindVideoDirectives(pBrowser, ipcMain, mainWin) {
    ipcMain.handle(VIDEO_DIRECTIVE.CHECK_APP_CONFIG, async () => {
        return checkAppConfig()
    })
    ipcMain.handle(VIDEO_DIRECTIVE.CHOOSE_EXECUTABLE, async (_, target) => {
        const {cancel, filePaths} = await dialog.showOpenDialog(mainWin,{
            properties:['openFile'],
            filters:[
                {
                    name:'Executable',
                    extensions:['exe']
                },
                {
                    name:'All Files',
                    extensions:['*']
                }
            ]
        })
        if (cancel) {
            return ''
        }
        if (target === 'ffmpeg') {
            appConfig.ffmpegLocation = filePaths[0]
        } else if (target === 'ffprobe') {
            appConfig.ffprobeLocation = filePaths[0]
        } else {
            throw Error()
        }
        return filePaths[0]
    })
    ipcMain.handle(VIDEO_DIRECTIVE.CHOOSE_VIDEO_DOWNLOAD, async () => {
        const {canceled, filePaths} = await dialog.showOpenDialog(mainWin, {
            properties: ['openDirectory'],
        })
        if (canceled) {
            return ''
        }
        appConfig.videoLocation = filePaths[0]
        return filePaths[0]
    })
    ipcMain.handle(VIDEO_DIRECTIVE.PROBE_FILE_FORMAT, async (_, fileName) => {
        return probVideoFormat(fileName)
    })
    ipcMain.handle(VIDEO_DIRECTIVE.DOWNLOAD_VIDEO_BY_PC_URL, async (_, urlStr) => {
        const backendWin = new BrowserWindow({
            show: true
        })
        backendWin.webContents.setAudioMuted(true)
        let urlStrList = []
        let mediaFileList = []
        try {
            await backendWin.loadURL(urlStr)
            const initPage = await pie.getPage(pBrowser, backendWin)
            const title = await initPage.title()
            mediaFileList = [createFileNameFromTitle(title), createFileNameFromTitle(`${title}-1`)]
            const [canBeDownloadDirectly, videoSrcUrlStr] = await canVideoDownloadDirectlyFromPage(initPage)
            if (canBeDownloadDirectly) {
                urlStrList = [videoSrcUrlStr.startsWith("https") ? videoSrcUrlStr : `https:${videoSrcUrlStr}`]
            } else {
                const urlSet = await getVideoUrlSet(initPage, 2)
                urlStrList = Array.from(urlSet)
            }
        } finally {
            backendWin.destroy()
        }
        if (urlStrList.length === 0 || mediaFileList.length === 0) {
            throw Error()
        }
        if (urlStrList.length === 1) {
            await downloadByUrlStr(urlStrList[0], mediaFileList[0])
        } else {
            await downloadByUrlStr(urlStrList[0], mediaFileList[0])
            await downloadByUrlStr(urlStrList[1], mediaFileList[1])
        }
        return mediaFileList
    })
    ipcMain.handle(VIDEO_DIRECTIVE.CHANGE_VIDEO_DOWNLOAD_LOCATION, async (_, newLocation) => {
        return checkVideoDownloadLocation(newLocation);
    })
    ipcMain.handle(VIDEO_DIRECTIVE.READ_APP_CONFIG, async () => {
        return {...appConfig}
    })
}