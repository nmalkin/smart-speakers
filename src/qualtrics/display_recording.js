Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/
	window.addEventListener("message", function(event) {
		if (event.source != window) {
			return;
		} else if (event.data.type && (event.data.type === "audio")) {
			const url = event.data.url;
			const transcript = event.data.transcript;
			const tag = '<audio controls><source src="' + url + '" type="audio/mp3"></audio> <br> Transcript: ' + transcript;
  			document.getElementById("${lm://Field/1}_QID9").getElementsByClassName("QuestionText")[0].innerHTML = tag;
		}
	}, false);
	window.postMessage("recording", "*");
});

Qualtrics.SurveyEngine.addOnReady(function()
{
	/*Place your JavaScript here to run when the page is fully displayed*/
	
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});