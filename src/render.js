

function isToutiaoUrl(urlStr) {
    try {
        const url = new URL(urlStr)
        return url.hostname === 'www.toutiao.com'
    } catch (ex) {
        return false
    }
}


function downloadVideoByPcUrl(url) {
    window.pieApi.downloadVideoByPcUrl(url)
}