
import VIDEO_DOWNLOAD_ERROR from '../video/videoStdError'
import VideoStdError from "../video/videoStdError";
import videoStdErrors from "../video/videoStdError";
function isToutiaoUrl(urlStr) {
    try {
        const url = new URL(urlStr)
        return url.hostname === 'www.toutiao.com'
    } catch (ex) {
        return false
    }
}



async function downloadVideoByPcUrl(url) {
    return window.pieApi.downloadVideoByPcUrl(url)
}

async function changeVideoDownloadDirectory(location) {
    return window.pieApi.changeVideoDownloadLocation(location)
}

async function chooseDirectory() {
    return window.pieApi.chooseVideoDownloadFolder()
}

function explainDownloadError(error) {
    const {message} = error
    const [matchedError] = Object.values(videoStdErrors).filter(err => message.indexOf(err.message) !== -1)
    return matchedError ? matchedError.explain : "未知错误，请联系开发者"
}

async function readAppConfig() {
    return window.pieApi.readAppConfig()
}

async function probeVideoFile(fileName) {
    return window.pieApi.probeVideoFile(fileName)
}

async function chooseFile(target) {
    return window.pieApi.chooseFile(target)
}

async function checkAppConfig() {
    return window.pieApi.checkAppConfig()
}

async function deleteFile(file) {
    return window.pieApi.deleteFile(file)
}

async function mergeDownloadFiles(audio, video) {
    return window.pieApi.mergeDownloadFiles(audio, video)
}

async function transferVideoToMp3(mediaFile){
     return window.pieApi.transferVideoToMp3(mediaFile)
}

export {chooseDirectory,
    changeVideoDownloadDirectory,
    downloadVideoByPcUrl,
    isToutiaoUrl,
    explainDownloadError,
    readAppConfig,
    probeVideoFile,
    chooseFile,
    checkAppConfig,
    mergeDownloadFiles,
    transferVideoToMp3,
    deleteFile
}
