// Dynamically adjust frame size.
// The new frame size is sent by the enclosed frame.
window.addEventListener(
    'message',
    (event: MessageEvent) => {
        if (event.source === window.frames[0]) {
            if (event.data.hasOwnProperty('height')) {
                document.getElementById('survey')!.style.height =
                    event.data.height + 'px';
            }
        }
    },
    false
);

// Warn people who are about to leave the survey
window.addEventListener('beforeunload', event => {
    event.returnValue =
        'Warning: if you leave or refresh this page, all survey progress will be lost, and you will have to start over.';
});
