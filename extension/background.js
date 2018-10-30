function buttonClicked() {
    chrome.tabs.create({
        url: '/choose.html'
    });
}

chrome.browserAction.onClicked.addListener(buttonClicked);
