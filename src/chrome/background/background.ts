import { Device, unserializeDevice } from '../../common/device';
import { checkEligibility } from '../../common/eligibility';
import { ValidationResult, VerificationState } from '../../common/types';
import { updateDevEnvironmentStatus } from '../common/debug';
import { initErrorHandling, reportError, reportIssue } from '../common/errors';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    /** Process validation requests */
    if (request.type && request.type === 'validate') {
        const device: Device = unserializeDevice(request.device);

        device
            .validate()
            .then((result: ValidationResult) => {
                checkEligibility(result);
                sendResponse(result);

                if (result.errors && result.errors.length > 0) {
                    console.error(
                        'Errors happened earlier, while processing interactions.'
                    );
                    result.errors.forEach(error => {
                        reportError(error);
                    });
                }
            })
            .catch(error => {
                reportError(error);
                sendResponse({ status: VerificationState.error });
            });
    } else {
        reportIssue(
            `received unexpected message from content-script: ${request}`
        );
        sendResponse({ status: VerificationState.error });
    }

    // Returning true flags that we want to use sendResponse asynchronosuly
    // see https://developer.chrome.com/extensions/runtime#event-onMessage
    return true;
});

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
