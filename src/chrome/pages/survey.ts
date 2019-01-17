import { getDebugStatus } from '../common/debug';

const SURVEY_URL =
    'https://berkeley.qualtrics.com/jfe/form/SV_7NzNJ4QmCe4uE05?test=';

// Reflect debug status in survey URL
window.onload = async () => {
    const debug: boolean = await getDebugStatus();
    const debugStr: string = String(debug);
    const url = SURVEY_URL + debugStr;
    const frame = document.getElementById('survey') as HTMLIFrameElement;
    frame.src = url;
};

// Dynamically adjust frame size.
// The new frame size is sent by the enclosed frame.
window.addEventListener(
    'message',
    (event: MessageEvent) => {
        if (event.source === window.frames[0]) {
            if (event.data.hasOwnProperty('height')) {
                document.getElementById('survey')!.style.height =
                    event.data.height + 'px';
            } else if (event.data.hasOwnProperty('type')) {
                switch (event.data.type) {
                    case 'finished':
                        // If survey reports being completed, don't warn on leaving
                        notifyOnLeave = false;
                        break;
                }
            }
        }
    },
    false
);

// Warn people who are about to leave the survey
let notifyOnLeave = true;
window.addEventListener('beforeunload', event => {
    if (notifyOnLeave) {
        event.returnValue =
            'Warning: if you leave or refresh this page, all survey progress will be lost, and you will have to start over.';
    }
});
