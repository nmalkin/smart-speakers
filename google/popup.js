document.getElementById("scrape").onclick = function() {
  /* First request: get xsrf token from My Activity page */
  var token_xhr = new XMLHttpRequest();
  token_xhr.open("GET", "https://myactivity.google.com/item?product=29", true);
  token_xhr.onreadystatechange = function() {
    if (token_xhr.readyState === 4 && token_xhr.status === 200) {
      var token_regex = /window\.HISTORY_xsrf='(\S{44})'/;
      var sig = token_xhr.response.match(token_regex)[1];
      /* Second request: get activity data */
      var data_xhr = new XMLHttpRequest();
      data_xhr.open("POST", "https://myactivity.google.com/item?product=29&jspb=1&jsv=myactivity_20181016-0717_1", true);
      data_xhr.onreadystatechange = function() {
        if (data_xhr.readyState === 4 && data_xhr.status === 200) {
          var data = JSON.parse(data_xhr.response.slice(6))[0];
          /* Array containing URLs for each recording */
          var urls = data.map(entry => entry[24][0]);
          var url_regex = /https:\/\/myactivity\.google\.com\/history\/audio\/play\/(\S{61})/;
          console.log(urls.map(url => url.match(url_regex)[1]));
        }
      };
      data_xhr.send('{"sig":"' + sig + '"}');
    }
  };
  token_xhr.send();
}
