function buttonClicked() {
    chrome.tabs.create({
        url: 'https://berkeley.qualtrics.com/jfe/form/SV_7NzNJ4QmCe4uE05'
    });
}

chrome.browserAction.onClicked.addListener(buttonClicked);

export { buttonClicked };
