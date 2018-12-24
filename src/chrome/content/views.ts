import { VerificationState, Interaction, Device } from '../../common/types';

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
export function displayVerificationResults(
    value: VerificationState,
    device: Device
): void {
    const account = device.accountName;
    const url = device.loginURL;

    const nextButton = document.getElementById(
        'NextButton'
    )! as HTMLInputElement;

    const retry =
        '<button style = "border-radius: 18px; border-style: solid; border-width: 2px; font-size: 18px; padding: 13px; \
         background-color: #FAFAFA;" onClick="window.postMessage({ type: \'verify\' }, \'*\');">Retry</button>';

    if (value === VerificationState.loggedIn) {
        nextButton.disabled = false;
        nextButton.click();
    } else if (value === VerificationState.loggedOut) {
        const msg = `<b>Status:</b><br><br> \
             It looks like you are logged out of your ${account} account. \
             Being logged in is required for our study, so we can customize our questions to your specific device. \
             Please <a href="${url}" target="_blank">click here to open the login page</a>, log in, then come back and click on the retry button below.<br><br>`;
        displayVerificationMessage(msg + retry);
    } else if (value === VerificationState.upgradeRequired) {
        const msg = `<b>Status:</b><br><br> \
             It looks like you need to re-enter the password for your ${account} account. \
             Please <a href="${url}" target="_blank">click here to open the login page</a>, log in, then come back and click on the retry button below.<br><br>`;
        displayVerificationMessage(msg + retry);
    } else if (value === VerificationState.ineligible) {
        const msg =
            "<b>Status:</b><br><br> \
            It looks like you don't have enough recordings. Sorry but you are ineligible for this survey";
        displayVerificationMessage(msg);
    } else {
        const msg =
            '<b>Status:</b><br><br> \
             There may have been an error in fetching your device recordings. Please try again. <br><br>';
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
