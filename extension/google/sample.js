chrome.storage.local.get('audio', function(result) {
    var data = result['audio'];
    var index = Math.floor(Math.random() * data.length);
    document.getElementById('audio').src = data[index][24][0];
    document.getElementById('transcript').innerHTML = data[index][9][0];
});
