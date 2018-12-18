import { getDebugStatus, setDebugStatus } from '../common/debug';
import { initErrorHandling } from '../common/errors';

function displayDebugStatus(status: boolean) {
    const text = status ? 'on' : 'off';
    document.getElementById('debug-status')!.innerText = text;
}

initErrorHandling();

window.onload = async () => {
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
};
