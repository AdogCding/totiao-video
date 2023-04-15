const {app, BrowserWindow, ipcMain} = require('electron');
const puppeteer = require('puppeteer-core')
const pie = require("puppeteer-in-electron")
const fs = require('fs')
const path = require('path')
const {dialog} = require('electron')
const wget = require('node-wget');
const log = require('electron-log');
console.log = log.log
console.error = log.error


const ffmpeg =  require('fluent-ffmpeg')
const appConfig = {
    videoLocation:app.getPath('userData'),
    ffprobeLocation:'',
    ffmpegLocation:'',
}
ffmpeg.setFfmpegPath(appConfig.ffmpegLocation)
ffmpeg.setFfprobePath(appConfig.ffprobeLocation)

import VIDEO_DIRECTIVE from '../video/videoDirective'


import VIDEO_DOWNLOAD_ERROR from '../video/videoStdError'



async function probVideoFormat(video) {
    const resolveStreams = (streams) => {
        if (streams.length > 1) {
            return 'mix'
        }
        return streams[0]?.["codec_type"]
    }
    return new Promise((resolve, reject) => {
        ffmpeg(video).ffprobe(0, function(err, data){
            if (err) {
                reject(err)
                return
            }
            resolve(resolveStreams(data["streams"]))
        })
    })

}


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
            ffmpeg.setFfmpegPath(appConfig.ffmpegLocation)
        } else if (target === 'ffprobe') {
            appConfig.ffprobeLocation = filePaths[0]
            ffmpeg.setFfprobePath(appConfig.ffprobeLocation)
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
            show: false
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
            return [mediaFileList[0]]
        } else {
            await downloadByUrlStr(urlStrList[0], mediaFileList[0])
            await downloadByUrlStr(urlStrList[1], mediaFileList[1])
            return mediaFileList
        }
    })
    ipcMain.handle(VIDEO_DIRECTIVE.CHANGE_VIDEO_DOWNLOAD_LOCATION, async (_, newLocation) => {
        return checkVideoDownloadLocation(newLocation);
    })
    ipcMain.handle(VIDEO_DIRECTIVE.READ_APP_CONFIG, async () => {
        return {...appConfig}
    })
    ipcMain.handle(VIDEO_DIRECTIVE.TRANSFER_TO_MP3, (_, fileName) => {
        const filePath = path.parse(fileName)
        const output = `${path.join(filePath.dir, filePath.name)}.mp3`
        return transformMp4ToMp3(fileName, output)
    })
    ipcMain.handle(VIDEO_DIRECTIVE.DELETE_FILE, (_, fileName) => {
        return deleteFiles(fileName)
    })
    ipcMain.handle(VIDEO_DIRECTIVE.MERGE_TO_ONE, (_, audio, video) => {
        const filePath = path.parse(audio)
        const output = `${path.join(filePath.dir, filePath.name)}.mix.mp4`
        return mergeAudioAndVideo(audio, video, output)
    })
}

function deleteFiles(fileName) {
    fs.unlinkSync(fileName)
}

/**
 * There is an important presumptions,
 * only one audio stream is available.
 * use fluent-ffmpeg translate a command line to function call
 * e.g. ffmpeg -i inputFileName -map 0:a outputFileName
 * -i specified input file
 * -map 0:a manually select all audio streams from first input media file
 * @param inputFileName
 * @param outputFileName
 * @param inputFileName
 * @param outputFileName
 */
function transformMp4ToMp3(inputFileName, outputFileName) {
    ffmpeg(inputFileName).addOption("-map 0:a").output(outputFileName).run()
}

function mergeAudioAndVideo(audio, video, output) {
    ffmpeg(audio).addInput(video).addOption("-c copy").output(output).run()
}

