function openStartPage() {
    chrome.tabs.create({
        url: 'assets/index.html'
    });
}

function onInstall(details: { reason: string }) {
    if (details.reason === 'install') {
        openStartPage();
    }
}

chrome.browserAction.onClicked.addListener(openStartPage);
chrome.runtime.onInstalled.addListener(onInstall);

export { openStartPage as buttonClicked };
