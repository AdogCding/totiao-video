

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