/* global Qualtrics */

/**
 * This code submits the user's selected speaker to the extension.
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

Qualtrics.SurveyEngine.addOnPageSubmit(type => {
    if (type === 'next') {
        const alexa = this.getChoiceValue('1');
        const google = this.getChoiceValue('2');
        if (alexa) {
            window.postMessage({ type: 'device', device: 'alexa' }, '*');
        } else if (google) {
            window.postMessage({ type: 'device', device: 'google' }, '*');
        }
    }
});
