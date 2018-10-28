document.getElementById("scrape").onclick = function() {
  /* First request: get xsrf token from My Activity page */
  var token_xhr = new XMLHttpRequest();
  token_xhr.open("GET", "https://myactivity.google.com/item?product=29", true);
  token_xhr.onreadystatechange = function() {
    if (token_xhr.readyState === 4 && token_xhr.status === 200) {
      var signedout_regex = /FootprintsMyactivitySignedoutUi/;
      if (token_xhr.response.search(signedout_regex) > -1) {
        chrome.tabs.create({
          "url": "./login-prompt.html"
        });
        return;
      }
      var token_regex = /window\.HISTORY_xsrf='(\S{44})'/;
      var sig = token_xhr.response.match(token_regex)[1];
      /* Second request: get activity data */
      var data_xhr = new XMLHttpRequest();
      data_xhr.open("POST", "https://myactivity.google.com/item?product=29&jspb=1&jsv=myactivity_20181016-0717_1", true);
      data_xhr.onreadystatechange = function() {
        if (data_xhr.readyState === 4 && data_xhr.status === 200) {
          var data = JSON.parse(data_xhr.response.slice(6))[0];
          chrome.storage.local.set({"audio": data}, function() {
            console.log("Successfully stored audio data");
          });
          /* Array containing URLs for each recording */
          var urls = data.map(entry => entry[24][0]);
          var url_regex = /https:\/\/myactivity\.google\.com\/history\/audio\/play\/(\S{61})/;
          console.log("Audio IDs", urls.map(url => url.match(url_regex)[1]));
          /* Whether the opened tab should become the active tab. Set to false to debug / view logs with "Inspect popup" */
          var setActiveTab = true;
          chrome.tabs.create({
            "url": "./sample.html",
            active: setActiveTab
          });
        }
      };
      data_xhr.send('{"sig":"' + sig + '"}');
    }
  };
  token_xhr.send();
}
