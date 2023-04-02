const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const puppeteer = require('puppeteer-core')
const pie = require("puppeteer-in-electron")
const fs = require('fs')
const VIDEO_DIRECTIVE = {
    DOWNLOAD_VIDEO_BY_PC_URL: "video:downloadVideoByPcUrl"
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
    mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    const pBrowser = await pie.connect(app, puppeteer)
    bindVideoDirectives(pBrowser, ipcMain)
    createWindow()
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

function bindVideoDirectives(pBrowser, ipcMain) {
    ipcMain.handle(VIDEO_DIRECTIVE.DOWNLOAD_VIDEO_BY_PC_URL, async (event, urlStr) => {
        const backendWin = new BrowserWindow({
            show: true,
        })
        const anotherWin = new BrowserWindow({
            show:true
        })
        anotherWin.webContents.openDevTools()
        anotherWin.webContents.setAudioMuted(true)
        backendWin.webContents.openDevTools()
        backendWin.webContents.setAudioMuted(true)
        await backendWin.loadURL(urlStr)
        const initPage = await pie.getPage(pBrowser, backendWin)
        await initPage.setRequestInterception(true)
        initPage.on('request', (req) => {
            req.continue()
        })
        const downloader = createVideoDownloader()
        initPage.on('response', (rsp) => {
            const headers = rsp.headers()
            if (headers['content-type'] === 'video/mp4') {
                downloader.storeResponse(rsp).then(() => {
                    if (downloader.isDownloadCompleted(rsp.url())) {
                        downloader.syncFile(rsp.url())
                    }
                })
            }
        })
    })
}

function createVideoDownloader() {
    const rspMap = new Map()

    function createRspRecord(fileName, beginOffset, endOffset, totalBytesCount, rspBuffer) {
        return {
            fileName, beginOffset, endOffset, totalBytesCount, rspBuffer
        }
    }

    function parseContentRange(contentRangeInfo) {
        const [unit, rest] = contentRangeInfo.split(' ')
        if (unit !== 'bytes') {
            return {
                startOffset: -1,
                endOffset: -1
            }
        }
        const [range, total] = rest.split('/')
        const [start, end] = range.split('-')
        return {
            startOffset: Number(start),
            endOffset: Number(end),
            total: Number(total)
        }
    }

    function storeBuffer(rspUrlStr, startOffset, bufferSize, buffer) {
        const {rspBuffer, beginOffset, endOffset, fileName} = rspMap.get(rspUrlStr)
        console.log(`${fileName} store ${beginOffset}-${endOffset}`)
        for (let i = startOffset; i < bufferSize; i++) {
            rspBuffer[i] = buffer[i - startOffset]
        }
        console.log(`${fileName} store ${startOffset}-${startOffset+bufferSize - 1}`)
        rspMap.set(rspUrlStr, {
            ...rspMap.get(rspUrlStr),
            rspBuffer,
            beginOffset:(beginOffset > startOffset ? startOffset : beginOffset),
            endOffset: (endOffset < (startOffset + bufferSize - 1) ? startOffset + bufferSize - 1:endOffset )
    })
    }

    return {
        storeResponse: async (rsp) => {
            const rspUrlStr = rsp.url()
            const url = new URL(rspUrlStr)
            const headers = rsp.headers()
            const contentRangeInfo = headers['content-range']
            if (!contentRangeInfo) {
                console.log(`${rspUrlStr} has no content range info`)
                console.log(headers)
                return
            }
            const {startOffset, endOffset, total} = parseContentRange(contentRangeInfo)
            if (endOffset < startOffset) {
                return
            }
            if (!rspMap.has(rspUrlStr)) {
                // 固定文件名
                const fileName = url.pathname.split('/')[1]
                rspMap.set(rspUrlStr,  createRspRecord(fileName, startOffset, endOffset, total, new ArrayBuffer()))
            }
            const buffer = await rsp.buffer()
            storeBuffer(rspUrlStr, startOffset, (endOffset - startOffset) + 1, buffer)
        },
        isDownloadCompleted(rspUrlStr) {
            if (!rspMap.has(rspUrlStr)) {
                return false
            }
            const {beginOffset, endOffset, totalBytesCount, fileName} = rspMap.get(rspUrlStr)
            console.log(`${fileName}:${beginOffset} - ${endOffset}/${totalBytesCount}`)
            return beginOffset === 0 && endOffset === totalBytesCount - 1
        },
        syncFile(url) {
            const {rspBuffer, fileName} = rspMap.get(url)
            fs.writeFileSync(fileName, rspBuffer,)
            console.log(`${url} download completed`)
        }
    }
}
