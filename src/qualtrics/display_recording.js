/* global Qualtrics */

Qualtrics.SurveyEngine.addOnload(() => {
    window.postMessage(
        // eslint-disable-next-line no-template-curly-in-string
        { type: 'recordingRequest', question: parseInt('${lm://Field/1}', 10) },
        '*'
    );
});

Qualtrics.SurveyEngine.addOnReady(() => {
    /* Place your JavaScript here to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(() => {
    /* Place your JavaScript here to run when the page is unloaded */
});
