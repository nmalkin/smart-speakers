let consented;
let alexa;
let home;
let seen;
let urls;
let transcripts;
let loggedOut;

const manageMessages = async function manageMessages(
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
                const dict = await getRecordings();
                urls = Object.keys(dict);
                transcripts = Object.values(dict);
            }
            if (urls.length > 0) {
                /* send participants to a page that asks them to make sure
		    		they are logged in and have selected the correct device */
                loggedOut = false;
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
                const googleData = await fetchAudioGoogle();
                if (googleData) {
                    urls = googleData.map(entry => entry[24][0]);
                    transcripts = googleData.map(entry => entry[9][0]);
                }
            }
            if (urls.length > 0) {
                /* send participants to a page that asks them to make sure
		    		they are logged in and have selected the correct device */
                loggedOut = false;
            }
        } else {
            /* send message that triggers survey back to consent page */
        }
    } else if (request === 'recording') {
        /* do something */
        if (consented) {
            console.log('sending_recording');
            let index = Math.floor(Math.random() * urls.length);
            while (seen.includes(index)) {
                index = Math.floor(Math.random() * urls.length);
            }
            const url = urls[index];
            const transcript = transcripts[index];
            console.log(url);
            console.log(transcript);
            seen.push(index);
            sendResponse([url, transcript]);
        } else {
            /* send message that triggers survey back to consent page */
        }
    } else if (request === 'login') {
        if (loggedOut) {
            if (alexa) {
                sendResponse('loggedOutA');
            } else if (home) {
                sendResponse('loggedOutH');
            }
        } else {
            sendResponse('loggedIn');
        }
    }
};

chrome.runtime.onMessageExternal.addListener(manageMessages);

function buttonClicked() {
    alexa = false;
    home = false;
    consented = false;
    loggedOut = true;
    urls = [];
    seen = [];
    chrome.tabs.create({
        url: 'https://berkeley.qualtrics.com/jfe/form/SV_7NzNJ4QmCe4uE05'
    });
}

chrome.browserAction.onClicked.addListener(buttonClicked);
