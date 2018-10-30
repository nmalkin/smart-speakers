function loadAlexa() {
    console.log('alexa!!');
    chrome.tabs.update({
        url: 'audio.html?device=alexa'
    });
}

function loadGoogle() {
    window.location.href = 'audio.html';
    chrome.tabs.update({
        url: 'audio.html?device=alexa'
    });
}

document.getElementById('alexa').addEventListener('click', loadAlexa);
document.getElementById('google').addEventListener('click', loadGoogle);
