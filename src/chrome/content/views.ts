import { VerificationState, Interaction, Device } from '../../common/types';
import { summarize } from '../../common/util';

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
        `<b>Status:</b><br>
        Verifying study eligibility. <br>
        (This may take up to a couple of minutes. Thank you for your patience!)
        <br><br>
        <!-- spinner, courtesy of https://loading.io/css/ -->
        <style>
        .lds-dual-ring {
            display: inline-block;
            width: 64px;
            height: 64px;
          }
          .lds-dual-ring:after {
            content: " ";
            display: block;
            width: 46px;
            height: 46px;
            margin: 1px;
            border-radius: 50%;
            border: 5px solid #c4820e;
            border-color: #c4820e transparent #c4820e transparent;
            animation: lds-dual-ring 1.2s linear infinite;
          }
          @keyframes lds-dual-ring {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        </style>
        <div style="width: 100%; text-align: center;">
            <div class="lds-dual-ring"></div>
        </div>
        `
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
    device: Device,
    interactions: Interaction[]
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
        const timestampField = document.querySelector(
            `input#${CSS.escape('QR~QID58')}`
        ) as HTMLInputElement;
        timestampField.value = String(
            interactions.map(interaction => interaction.timestamp).sort()[0]
        );

        const countField = document.querySelector(
            `input#${CSS.escape('QR~QID60')}`
        ) as HTMLInputElement;
        countField.value = String(interactions.length);

        const sumField = document.querySelector(
            `input#${CSS.escape('QR~QID61')}`
        ) as HTMLInputElement;
        sumField.value = JSON.stringify(summarize(interactions));

        nextButton.disabled = false;
        nextButton.click();
    } else if (value === VerificationState.loggedOut) {
        const msg = `<b>Status:</b><br><br> \
             It looks like you are logged out of your ${account} account.
             You need to be logged in so that we can customize our questions to your specific device.
             Please <a href="${url}" target="_blank">click here to open the login page</a>, log in, then come back and click on the retry button below.<br><br>`;
        displayVerificationMessage(msg + retry);
    } else if (value === VerificationState.upgradeRequired) {
        const msg = `<b>Status:</b><br><br>
             It looks like you need to re-enter the password for your ${account} account.
             Please <a href="${url}" target="_blank">click here to open the login page</a>, log in, then come back and click on the retry button below.<br><br>`;
        displayVerificationMessage(msg + retry);
    } else if (value === VerificationState.ineligible) {
        const msg = `<b>Status:</b><br><br>
            Unfortunately, our tests show that you don't meet our study's eligibility criteria.
            Specifically, you've had your smart speaker for less than a month
            or you've used it fewer than 30 times.
            If that sounds incorrect, then it's an error
            either on our end
            or on the side of Amazon/Google
            (we check with them for this information).
            Either way, we're sorry for the inconvenience!
            If you'd like, you can reach out to us,
            and we'll try to figure out what happened.`;
        displayVerificationMessage(msg);
    } else {
        const msg = `<b>Status:</b><br><br>
             There may have been an error in fetching your device recordings. Please try again.
             If the error persists, please contact us.
             <br><br>`;
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
    let tag: string;
    if (interaction.recordingAvailable) {
        tag =
            '<audio controls><source src="' +
            interaction.url +
            '" type="audio/mp3"></audio> <br> Transcript: ' +
            interaction.transcript;
    } else {
        tag = `Transcript: ${interaction.transcript}<br>(Audio not available)`;
    }

    const targetElement = questionNumber + '_QID9';
    document
        .getElementById(targetElement)!
        .getElementsByClassName('QuestionText')[0].innerHTML = tag;
}
