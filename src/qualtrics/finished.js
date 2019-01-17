/* global Qualtrics */

Qualtrics.SurveyEngine.addOnUnload(() => {
    window.parent.postMessage(
        { type: 'finished'},
        '*'
    );
});
