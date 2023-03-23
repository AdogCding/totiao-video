

function isPcUrl(urlStr) {
    try {
        const url = new URL(urlStr)
        return (url.hostname === 'toutiao.com' || url.hostname === 'www.toutiao.com')
            && !url.searchParams.get('share_token');
    } catch (ex) {
        return false
    }
}


function isSharedUrl(urlStr) {
    try {
        const url = new URL(urlStr)
        return url.hostname === 'm.toutiao.com' || url.searchParams.get('share_token')
    } catch (ex) {
        return false
    }

}

function downloadVideoByPcUrl(url) {
    window.pieApi.downloadVideoByPcUrl(url)
}

function downloadVideoByShareUrl(url) {
    console.log('empty')
}