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
