import { Device } from '../../common/device';
import {
    Interaction,
    ValidationResult,
    VerificationState
} from '../../common/types';
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
        This can take up to 90 seconds, but usually takes much less time. Thank you for your patience!
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
 */
export function displayVerificationResults(
    result: ValidationResult,
    device: Device
): void {
    const account = device.accountName;
    const url = device.loginURL;

    const nextButton = document.getElementById(
        'NextButton'
    )! as HTMLInputElement;

    const retry = `<br><br>
         <button style = "border-radius: 18px; border-style: solid; border-width: 2px; font-size: 18px; padding: 13px; \
         background-color: #FAFAFA;" onClick="window.postMessage({ type: \'verify\' }, \'*\');">Retry</button>`;

    let message: string;
    switch (result.status) {
        case VerificationState.loggedIn:
            if (!result.interactions) {
                throw new Error(
                    'missing interactions though they existed at validation time'
                );
            }
            const interactions = result.interactions;

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

            const errorField = document.querySelector(
                `input#${CSS.escape('QR~QID80')}`
            ) as HTMLInputElement;
            errorField.value = String(result.downloadStatus);

            nextButton.disabled = false;
            nextButton.click();

            return;

        case VerificationState.loggedOut:
            message = `<b>Status:</b><br><br>
             It looks like you are logged out of your ${account} account.
             You need to be logged in so that we can customize our questions to your specific device.
             Please <a href="${url}" target="_blank">click here to open the login page</a>, log in, then come back and click on the retry button below.`;
            break;
        case VerificationState.upgradeRequired:
            message = `<b>Status:</b><br><br>
             It looks like you need to re-enter the password for your ${account} account.
             Please <a href="${url}" target="_blank">click here to open the login page</a>, log in, then come back and click on the retry button below.`;
            break;
        case VerificationState.ineligible:
            message = `<b>Status:</b><br><br>
            Unfortunately, our tests show that you don't meet our study's eligibility criteria.
            Specifically,
            ${result.ineligiblityReason}.
            <br><br>
            If that sounds incorrect, then it's an error
            either on our end
            or on the side of Amazon/Google
            (we check with them for this information).
            Either way, we're sorry for the inconvenience!
            <br><br>
            One possible cause of this error is
            if you have more than one Amazon/Google account,
            then our extension may have been checking with the wrong one.
            Try signing out of every account except the one linked to your device,
            then click the retry button below.
            <br><br>
            If that still doesn't help, you can reach out to us,
            and we'll try to figure out what happened.
            (Please be aware that we strictly limit what information we collect from you,
            so it can be hard for us to know what went wrong.)
            `;
            break;
        default:
            message = `<b>Status:</b><br><br>
             There may have been an error in fetching your device recordings.
             We're sorry for the inconvience!
             Please wait a few seconds, then try again using the button below.
             If the error persists, please contact us.`;
    }

    displayVerificationMessage(message + retry);
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

    document
        .getElementById(`${questionNumber}_QID9`)!
        .getElementsByClassName('QuestionText')[0].innerHTML = tag;

    let field = document.querySelector(
        `input#${CSS.escape(`QR~${questionNumber}_QID77`)}`
    ) as HTMLInputElement;
    field.value = String(
        interaction.timestamp - (interaction.timestamp % (60 * 60 * 1000))
    );

    field = document.querySelector(
        `input#${CSS.escape(`QR~${questionNumber}_QID81`)}`
    ) as HTMLInputElement;
    field.value = String(interaction.recordingAvailable);
}
