
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
export {chooseDirectory, changeVideoDownloadDirectory, downloadVideoByPcUrl, isToutiaoUrl, explainDownloadError, readAppConfig, probeVideoFile}
