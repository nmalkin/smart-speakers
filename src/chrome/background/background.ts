import { updateDevEnvironmentStatus } from '../common/debug';
import { initErrorHandling } from '../common/errors';

function openStartPage() {
    chrome.tabs.create({
        url: 'assets/index.html'
    });
}

function onInstall(details: { reason: string }) {
    // Open the start page on first run
    if (details.reason === 'install') {
        openStartPage();
    }

    // Remember whether we're running in a dev environment
    updateDevEnvironmentStatus();
}

initErrorHandling();
chrome.browserAction.onClicked.addListener(openStartPage);
chrome.runtime.onInstalled.addListener(onInstall);

export { openStartPage as buttonClicked };
