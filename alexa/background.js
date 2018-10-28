chrome.browserAction.onClicked.addListener(buttonClicked)

function buttonClicked() {
	var setActiveTab = true;
          chrome.tabs.create({
            "url": "/audio.html",
            active: setActiveTab
          });
}