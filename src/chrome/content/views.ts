import { VerificationState, Interaction } from '../../common/types';

/**
 * Display given message on the verification page
 */
function displayVerificationMessage(message: string): void {
    const placeholder = document.getElementById('QID14')!;
    placeholder.getElementsByClassName(
        'QuestionText BorderColor'
    )[0].innerHTML = message;
}

/**
 * Show initial message during verification process
 */
export function displayVerificationPlaceholder(): void {
    displayVerificationMessage(
        '<b>Status:</b><br><br>Checking for Recordings...'
    );
}

/**
 * Update the survey webpage based on the user's VerificationState
 *
 * Checks whether the user has been verified, and prompts a retry if not
 *
 * @param value the user's verification status
 */
export function displayVerificationResults(value: VerificationState): void {
    const nextButton = document.getElementById(
        'NextButton'
    )! as HTMLInputElement;
    const retry =
        '<button style = "border-radius: 18px; border-style: solid; border-width: 2px; font-size: 18px; padding: 13px; \
                    background-color: #FAFAFA;" onClick="window.postMessage({ type: \'verify\' }, \'*\');">Retry</button>';
    if (value === 'loggedIn') {
        nextButton.disabled = false;
        nextButton.click();
    } else if (value === 'loggedOut') {
        const msg =
            '<b>Status:</b><br><br> \
                    Please ensure that you are logged in to your Amazon/Google account. \
                    This is required for our study, so we can customize our questions to your specific device. \
                    Please relog and click on the retry button below.<br><br>';
        displayVerificationMessage(msg + retry);
    } else if (value === 'ineligible') {
        const msg =
            "<b>Status:</b><br><br> \
                    It looks like you don't have enough recordings. Sorry but you are ineligible for this survery";
        displayVerificationMessage(msg);
    } else {
        const msg =
            '<b>Status:</b><br><br> \
                    There may have been an error in fetching your device recordings. Please try again';
        displayVerificationMessage(msg + retry);
    }
}

/**
 * Show audio control and transcript at a location in the page associated with the given question number
 */
export function displayInteraction(
    interaction: Interaction,
    questionNumber: number
) {
    const tag =
        '<audio controls><source src="' +
        interaction.url +
        '" type="audio/mp3"></audio> <br> Transcript: ' +
        interaction.transcript;
    const targetElement = questionNumber + '_QID9';
    document
        .getElementById(targetElement)!
        .getElementsByClassName('QuestionText')[0].innerHTML = tag;
}
