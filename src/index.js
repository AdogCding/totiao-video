const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const puppeteer = require('puppeteer-core')
const pie = require("puppeteer-in-electron")
const fs = require('fs')
const {dialog} = require('electron')
const wget = require('node-wget');
const VIDEO_DIRECTIVE = {
    DOWNLOAD_VIDEO_BY_PC_URL: "video:downloadVideoByPcUrl",
    CHANGE_VIDEO_DOWNLOAD_LOCATION: "file:changeVideoDownloadLocation",
    CHOOSE_VIDEO_DOWNLOAD:'file:chooseVideoDownloadFolder'
}
const appConfig = {
}
const VIDEO_DOWNLOAD_ERROR = {
    CONFIG_ERROR:'config_error',
    FILE_EXISTS:'file_exists',
    DIRECTORY_NOT_ACCESSIBLE:'directory_not_accessible',
    DOWNLOAD_ERROR:'download_error'
}
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}


const pieInit = initPuppeteer()

pieInit.then(() => {

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
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html')).then(() => {
    });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
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
    const srcUrl = new URL(srcUrlStr)
    return srcUrl.protocol !== 'blob:';

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

function checkVideoDownloadLocation(directory) {
    if (!directory) {
        throw Error('directory is not accessible')
    }
    if (!fs.existsSync(directory)) {
        throw Error('directory is not accessible')
    }
    fs.accessSync(directory, fs.constants.W_OK | fs.constants.R_OK)
    return true
}

function createFileNameFromTitle(title) {
    if (!appConfig.videoLocation) {
        return [false, VIDEO_DOWNLOAD_ERROR.CONFIG_ERROR]
    }
    if (!fs.existsSync(appConfig.videoLocation)) {
        return [false, VIDEO_DOWNLOAD_ERROR.DIRECTORY_NOT_ACCESSIBLE]
    }
    try {
        fs.accessSync(appConfig.videoLocation, fs.constants.W_OK | fs.constants.R_OK)
    } catch (err) {
        return [false, VIDEO_DOWNLOAD_ERROR.DIRECTORY_NOT_ACCESSIBLE]
    }
    const fileName = `${appConfig.videoLocation}\\${title}.mp4`
    if (fs.existsSync(fileName)) {
        return [false, VIDEO_DOWNLOAD_ERROR.FILE_EXISTS]
    }
    return [true, fileName]
}

function bindVideoDirectives(pBrowser, ipcMain, mainWin) {
    ipcMain.handle(VIDEO_DIRECTIVE.CHOOSE_VIDEO_DOWNLOAD, async (evt) => {
        const {canceled, filePaths} = await dialog.showOpenDialog(mainWin, {
            properties: ['openDirectory']
        })
        if (canceled) {
            return ''
        }
        return filePaths[0]
    })
    ipcMain.handle(VIDEO_DIRECTIVE.DOWNLOAD_VIDEO_BY_PC_URL, async (event, urlStr) => {
        const backendWin = new BrowserWindow({
            show: false
        })
        backendWin.webContents.openDevTools()
        backendWin.webContents.setAudioMuted(true)
        await backendWin.loadURL(urlStr)
        const initPage = await pie.getPage(pBrowser, backendWin)
        const title = await initPage.title()
        const canBeDownloadDirectly = await canVideoDownloadDirectlyFromPage(initPage)
        const urlSet = await getVideoUrlSet(initPage, canBeDownloadDirectly ? 1 : 2)
        const urlStrList = Array.from(urlSet)
        const [mediaFileRes1, mediaFileRes2] = [createFileNameFromTitle(title), createFileNameFromTitle(`${title}-1`)]
        if (!mediaFileRes1[0]) {
            throw Error(mediaFileRes1[1])
        }
        if (!mediaFileRes2[0]) {
            throw Error(mediaFileRes2[1])
        }
        if (urlSet.size === 1) {
            await downloadByUrlStr(urlStrList[0], mediaFileRes1[1])
        } else {
            await downloadByUrlStr(urlStrList[0], mediaFileRes1[1])
            await downloadByUrlStr(urlStrList[1], mediaFileRes2[1])
        }
        backendWin.destroy()
    })
    ipcMain.handle(VIDEO_DIRECTIVE.CHANGE_VIDEO_DOWNLOAD_LOCATION, async (event, newLocation) => {
        const isDirectoryAccessible = checkVideoDownloadLocation(newLocation)
        if (isDirectoryAccessible) {
            appConfig.videoLocation = newLocation
        }
        return true
    })
}