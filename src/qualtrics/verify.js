/* global Qualtrics, $ */

/**
 * This code triggers the extension's validation of the user's login status and recordings.
 */

Qualtrics.SurveyEngine.addOnload(() => {
    /* Place your JavaScript here to run when the page loads */
    this.disableNextButton();
    this.hideNextButton();
    $('QID17').hide();
});

Qualtrics.SurveyEngine.addOnReady(() => {
    /* Place your JavaScript here to run when the page is fully displayed */
    window.postMessage('verify', '*');
});

Qualtrics.SurveyEngine.addOnUnload(() => {
    /* Place your JavaScript here to run when the page is unloaded */
});
