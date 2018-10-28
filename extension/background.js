chrome.browserAction.onClicked.addListener(buttonClicked)

function buttonClicked() {
	var setActiveTab = true;
          chrome.tabs.create({
            "url": "/choose.html",
            active: setActiveTab
          });
}