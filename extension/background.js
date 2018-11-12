let alexa;
let home;
let consented;
let urls;
let seen;

const manage_messages = async function manage_messages(
    request,
    sender,
    sendResponse
) {
    console.log(request);
    if (request === 'consented') {
        console.log('success!!');
        consented = true;
    } else if (request === 'alexa') {
        if (consented) {
            console.log('alexa chosen');
            if (home) {
                /* in case someone wants to reselect the device they've chosen */
                urls = [];
                seen = [];
            }
            alexa = true;
            home = false;
            if (urls.length === 0) {
                urls = await getRecordings();
            }
            if (urls.length === 0) {
                /* send participants to a page that asks them to make sure
		    		they are logged in and have selected the correct device */
            }
            console.log(urls);
        } else {
            /* send message that triggers survey back to consent page */
        }
    } else if (request === 'home') {
        if (consented) {
            console.log('home chosen');
            if (alexa) {
                /* in case someone wants to reselect the device they've chosen */
                urls = [];
                seen = [];
            }
            home = true;
            alexa = false;
            if (urls.length === 0) {
                urls = '...'; /* still need to refactor google fetching */
                fetchAudioGoogle();
            }
        } else {
            /* send message that triggers survey back to consent page */
        }
    } else if (request === 'recording') {
        /* do something */
        if (consented) {
            if (home) {
                urls = googleData.map(entry => entry[24][0]);
                transcripts = googleData.map(entry => entry[9][0]);
            }
            console.log('sending_recording');
            let index = Math.floor(Math.random() * urls.length);
            while (seen.includes(urls[index])) {
                index = Math.floor(Math.random() * urls.length);
            }
            url = urls[index];
            if (home) {
                transcript = transcripts[index];
            }
            console.log(url);
            seen.push(url);
            sendResponse(url);
        } else {
            /* send message that triggers survey back to consent page */
        }
    }
};

chrome.runtime.onMessageExternal.addListener(manage_messages);

function buttonClicked() {
    alexa = false;
    home = false;
    consented = false;
    urls = [];
    seen = [];
    chrome.tabs.create({
        url: 'https://berkeley.qualtrics.com/jfe/form/SV_7NzNJ4QmCe4uE05'
    });
}

chrome.browserAction.onClicked.addListener(buttonClicked);
