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

initErrorHandling();

window.onload = () => {
    setupDebugToggle();
};
