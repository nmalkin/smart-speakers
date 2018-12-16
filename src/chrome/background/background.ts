function buttonClicked() {
    chrome.tabs.create({
        url: 'assets/index.html'
    });
}

chrome.browserAction.onClicked.addListener(buttonClicked);

export { buttonClicked };
