import { getDebugStatus, setDebugStatus } from '../common/debug';
import { initErrorHandling } from '../common/errors';

function displayDebugStatus(status: boolean) {
    const text = status ? 'on' : 'off';
    document.getElementById('debug-status')!.innerText = text;
}

/**
 * Set up the on-screen debug mode toggle
 *
 * Sets its initial status and updates local storage with new settings.
 */
async function setupDebugToggle() {
    const debugControl = document.getElementById('debug') as HTMLInputElement;

    const initialStatus = await getDebugStatus();
    displayDebugStatus(initialStatus);
    debugControl.checked = initialStatus;

    debugControl.onchange = event => {
        const el = event.target as HTMLInputElement;
        const newStatus = el.checked;
        displayDebugStatus(newStatus);
        setDebugStatus(newStatus);
    };
}

/**
 * Try accessing the study URLs and show an error if that fails
 */
function testPermissions() {
    let url = 'https://www.amazon.com';
    fetch(url)
        .then(() => {
            url = 'https://myactivity.google.com';
            return fetch(url);
        })
        .catch(() => {
            const message = `In a connectivity test, our extension was unable to reach ${url}. There may be a few reasons for that:

1) You are offline. Please connect to the Internet.
2) You denied the extension "Site access" to this URL. Please allow it for our study. For more information, see https://support.google.com/chrome_webstore/answer/2664769
3) You are running the extension in Incognito Mode. Unfortunately, our extension won't work because incognito mode blocks network requests like this one.`;

            // Show an error message, but only after an invisible timeout.
            // tl;dr: This is a workaround for using an alert instead of rendering an error message.
            // One more case where this error handler is triggered is if the user
            // clicks a link to navigate away from this page so quickly that the
            // requests above don't complete. Then we don't really need to show
            // this message, and it wouldn't even be a problem if this message
            // were rendered as HTML. But this is an alert, and it ends up blocking
            // the JavaScript event loop, preventing navigation to the next page.
            // The timeout allows the navigation to preempt the alert, and the
            // message doesn't get shown.
            setTimeout(() => {
                alert(message);
            }, 1);
        });
}

initErrorHandling();

window.onload = () => {
    setupDebugToggle();
    testPermissions();
};
