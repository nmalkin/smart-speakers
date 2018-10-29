document.getElementById('alexa').addEventListener('click', load_alexa);
document.getElementById('google').addEventListener('click', load_google);

function load_alexa() {
    console.log('alexa!!');
    chrome.tabs.update({
        url: 'audio.html?device=alexa'
    });
}

function load_google() {
    window.location.href = 'audio.html';
    chrome.tabs.update({
        url: 'audio.html?device=alexa'
    });
}
