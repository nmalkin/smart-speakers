import { buttonClicked } from '../../chrome/background/background';

browser.browserAction.onClicked.addListener(buttonClicked);
