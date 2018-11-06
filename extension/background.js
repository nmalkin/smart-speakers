function buttonClicked() {
    chrome.tabs.create({
        url: 'index.html'
    });
}

chrome.browserAction.onClicked.addListener(buttonClicked);
