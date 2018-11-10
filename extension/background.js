let alexa;
let home;

var manage_messages = function manage_messages(request, sender, sendResponse) {
    console.log(request);
    if (request === 'test') {
        console.log('success!!');
        sendResponse('okay');
    } else if (request === 'alexa') {
        /* do something */
        console.log('wow!');
        alexa = true;
        home = false;
    } else if (request === 'home') {
        /* do something */
        home = true;
        alexa = false;
    }
};

chrome.runtime.onMessageExternal.addListener(manage_messages);

function buttonClicked() {
    alexa = false;
    home = false;
    chrome.tabs.create({
        url: 'https://berkeley.qualtrics.com/jfe/form/SV_7NzNJ4QmCe4uE05'
    });
}

chrome.browserAction.onClicked.addListener(buttonClicked);
