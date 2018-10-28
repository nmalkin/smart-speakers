chrome.browserAction.onClicked.addListener(buttonClicked);

function buttonClicked() {
  chrome.tabs.create({
    "url": "/choose.html"
  });
}
