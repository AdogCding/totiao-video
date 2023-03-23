const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const puppeteer = require('puppeteer-core')
const pie = require("puppeteer-in-electron")
const fs = require('fs')
const buffer = require("buffer");

const fileLocation = "D:\\Workspace\\temp"
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
const hiddenBackWindow = []
const loadUrlOnBackend = (pBrowser) => {
  return async (evt, url) => {
    if (hiddenBackWindow.length > 0) {
      hiddenBackWindow.forEach(window => window.destroy())
    }
    const backendWindow = new BrowserWindow({
      show:false
    })
    hiddenBackWindow.push(backendWindow)
    const resourcesUrl = new Set()
    backendWindow.webContents.openDevTools()
    backendWindow.webContents.setAudioMuted(true)
    await backendWindow.loadURL(url)
    const page = await pie.getPage(pBrowser, backendWindow)
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      req.continue()
    })
    page.on('response', (rsp) => {
      if (rsp.url().indexOf("video") !== -1) {
        const rspHeader = rsp.headers()
        const contentType = rspHeader['content-type']
        if (contentType !== 'video/mp4') {
          return
        }
        if (resourcesUrl.has(rsp.url())) {
          return
        }
        resourcesUrl.add(rsp.url())
        console.log('video', rsp.url())
      }
    })
  }
} // 初始化puppeteer
const createWindow =  () => {
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
  ipcMain.handle(VIDEO_DIRECTIVE.DOWNLOAD_VIDEO_BY_PC_URL, async (event, url) => {
    console.log(event.sender, 'is sending directives:', url)
    const backendWin = new BrowserWindow({
      show:true,
    })
    backendWin.webContents.openDevTools()
    backendWin.webContents.setAudioMuted(true)
    const resourceUrl = new Set()
    await backendWin.loadURL(url)
    const initPage = await pie.getPage(pBrowser, backendWin)
    initPage.setRequestInterception(true)
    initPage.on('request', (req) => {
      req.continue()
    })
    initPage.on('response', (rsp) => {
      const headers = rsp.headers()
      if (headers['content-type'] === 'video/mp4' && !resourceUrl.has(rsp.url())) {
        resourceUrl.add(rsp.url())
        rsp.buffer().then(buffer => {
          fs.writeFileSync(`${fileLocation}\\text.mp4`, buffer, 'binary')
        })
      }
    })
  })
}

function downloadVideoByInterceptOnInitPage(initPage) {

}

/**
 * 有些网页可以直接下载
 * @param newPageUrl
 */
async function downloadVideoByCreatingNewPage(newPageUrl) {

}