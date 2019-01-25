/* global Qualtrics */

/**
 * This code notifies the extension to set the user's selected speaker.
 */

Qualtrics.SurveyEngine.addOnload(() => {
    /* Place your JavaScript here to run when the page loads */
});

Qualtrics.SurveyEngine.addOnReady(() => {
    /* Place your JavaScript here to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(() => {
    /* Place your JavaScript here to run when the page is unloaded */
});

// eslint-disable-next-line prefer-arrow-callback
Qualtrics.SurveyEngine.addOnPageSubmit(function submitSpeakerChoice(type) {
    if (type === 'next') {
        window.postMessage({ type: 'device' }, '*');
    }
});
