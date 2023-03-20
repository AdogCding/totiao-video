let button = document.getElementById('toutiao-url-sure-button')
let input = document.getElementById('toutiao-url-input')

button.addEventListener('click', () => {
    let url = input.value
    window.pieApi.loadBackgroundWindow(url)
})
