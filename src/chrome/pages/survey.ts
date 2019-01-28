import { getDebugStatus } from '../common/debug';
import { set } from '../common/storage';

const SURVEY_URL =
    'https://berkeley.qualtrics.com/jfe/form/SV_7NzNJ4QmCe4uE05?test=';

let notifyOnLeave = true;

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
                    case 'finished': // Survey reports being completed
                        // Don't warn on leaving
                        notifyOnLeave = false;

                        // Remember, in the extension, that the survey has been finished
                        set({ finished: true });

                        break;
                }
            }
        }
    },
    false
);

// Warn people who are about to leave the survey
window.addEventListener('beforeunload', event => {
    if (notifyOnLeave) {
        event.returnValue =
            'Warning: if you leave or refresh this page, all survey progress will be lost, and you will have to start over.';
    }
});
