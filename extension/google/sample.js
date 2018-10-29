chrome.storage.local.get('audio', result => {
    const data = result.audio;
    const index = Math.floor(Math.random() * data.length);
    document.getElementById('audio').src = data[index][24][0];
    document.getElementById('transcript').innerHTML = data[index][9][0];
});
