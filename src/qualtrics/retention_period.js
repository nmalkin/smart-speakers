/* global Qualtrics */

/**
 * This script is used with the retention_period question
 * to make sure the open-text boxes are displayed in the correct order
 * (e.g., _____ hours)
 */

Qualtrics.SurveyEngine.addOnload(() => {
    /* Place your JavaScript here to run when the page loads */

    const answers = document
        .getElementById('QID43')
        .querySelectorAll('.LabelWrapper');
    for (let i = 0; i < answers.length; i += 1) {
        const answer = answers[i];
        const input = answer.querySelector('input');
        if (input) {
            answer.insertBefore(input, answer.firstElementChild);
            input.placeholder = 'Enter a number of';
        }
    }
});

Qualtrics.SurveyEngine.addOnReady(() => {
    /* Place your JavaScript here to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(() => {
    /* Place your JavaScript here to run when the page is unloaded */
});
