

function isToutiaoUrl(urlStr) {
    try {
        const url = new URL(urlStr)
        return url.hostname === 'www.toutiao.com'
    } catch (ex) {
        return false
    }
}

class MaskUtils {
    static MASK_STYLE_DEFAULT_CLASS_NAME = "overlay-default"
    static MASK_STYLE_CLASS_NAME = "overlay"
    static maskOn() {
        const maskDiv = document.getElementById('mask')
        maskDiv.classList.remove(this.MASK_STYLE_DEFAULT_CLASS_NAME)
        maskDiv.classList.toggle(this.MASK_STYLE_CLASS_NAME)
    }
    static maskOff() {
        const maskDiv = document.getElementById('mask')
        maskDiv.classList.add(this.MASK_STYLE_DEFAULT_CLASS_NAME)
        maskDiv.classList.toggle(this.MASK_STYLE_CLASS_NAME)
    }
}

class ButtonUtils {
    static disableButtons(buttons) {
        for (const btn of buttons) {
            btn.disabled = true
        }
    }
    static activeButtons(buttons) {
        for (const btn of buttons) {
            btn.disabled = false
        }
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

