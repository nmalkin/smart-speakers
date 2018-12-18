import { VerificationState } from '../../common/types';
/**
 * Update the survey webpage based on the user's VerificationState
 *
 * Checks whether the user has been verified, and prompts a retry if not
 *
 * @param value the user's verification status
 */
export function displayVerificationResults(value: VerificationState): void {
    const placeholder = document.getElementById('QID17')!;
    const nextButton = document.getElementById(
        'NextButton'
    )! as HTMLInputElement;
    placeholder.style.display = 'none';
    if (value === 'loggedIn') {
        nextButton.disabled = false;
        nextButton.click();
    } else if (value === 'loggedOut') {
        placeholder.style.display = 'block';
        alert(
            'Please ensure that you are logged in to your Amazon/Google account. This is required for our study, so we can customize our questions to your specific device. Please relog and click on the retry button below.'
        );
        const tag =
            "<button onClick=\"window.postMessage('verify', '*')\">Retry</button>";
        placeholder.getElementsByClassName('QuestionText')[0].innerHTML = tag;
    } else if (value === 'ineligible') {
        /* we can (should?) rephrase this when we get a chance. Also this just leaves them stuck which is weird UX. */
        alert(
            "It looks like you don't have enough recordings. Sorry but you are ineligible for this survery"
        );
    } else {
        placeholder.style.display = 'block';
        alert(
            'There may have been an error in fetching your device recordings. Please try again'
        );
        const tag =
            "<button onClick=\"window.postMessage('verify', '*')\">Retry</button>";
        placeholder.getElementsByClassName('QuestionText')[0].innerHTML = tag;
    }
}
