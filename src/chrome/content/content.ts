import {
    fetchCsrfToken,
    fetchJsonData,
    tryParseJson,
    extractData
} from '../../common/google/google';
import { getCSRF, getAudio } from '../../common/alexa/amazon';
import { getDebugStatus } from '../common/debug';

/**
 * The user's login state for the targeted assistant service
 */
enum VerificationState {
    loggedIn = 'loggedIn',
    loggedOut = 'loggedOut',
    ineligible = 'ineligible',
    error = 'error'
}

enum Device {
    alexa = 'alexa',
    google = 'google'
}

let device: Device;
let verified: VerificationState;
let urls: string[] = [];
let transcripts: string[] = [];
const seen: number[] = [];

/**
 * Check user's verification status
 *
 * Checks whether the user has been verified, and prompts a retry if not
 *
 * @param value the user's verification status
 */
function checkVerification(value: VerificationState): void {
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

/**
 * Process request for a recording
 *
 * Selects a recording and adds it to the survey page
 *
 * @param targetElement the id of the DOM element of the question under which the recording should be inserted
 */
async function processRecordingRequest(targetElement: string): Promise<void> {
    // Select recording to show
    let index: number;
    const questionNumber = parseInt(targetElement, 10);
    if (questionNumber <= seen.length) {
        // User is on an old question
        index = seen[questionNumber - 1];
    } else {
        // Select new recording
        index = Math.floor(Math.random() * urls.length);
        // FIXME: this will go into an infinite loop if the number of available recordings is less than the number of questions
        // Debug mode, in particular, will trigger this.
        while (seen.includes(index)) {
            index = Math.floor(Math.random() * urls.length);
        }
        seen.push(index);
    }
    let url = urls[index];
    let transcript = transcripts[index];

    // Substitute dummy recording if we're in debug mode
    if (
        url === undefined &&
        transcript === undefined &&
        (await getDebugStatus())
    ) {
        url = 'https://people.eecs.berkeley.edu/~nmalkin/sample.mp3';
        transcript = 'This is a test transcript.';
    }

    // Display recording on page
    const tag =
        '<audio controls><source src="' +
        url +
        '" type="audio/mp3"></audio> <br> Transcript: ' +
        transcript;
    document
        .getElementById(targetElement + '_QID9')!
        .getElementsByClassName('QuestionText')[0].innerHTML = tag;
}

/**
 * Validate Echo user status and eligibility
 *
 * Determines whether a user can proceed with the survey
 */
async function validateAmazon(): Promise<void> {
    device = Device.alexa;
    const csrfTok = await getCSRF();
    if (csrfTok === null) {
        verified = VerificationState.loggedOut;
        return;
    }
    const dict = await getAudio(csrfTok);
    if (dict === null) {
        verified = VerificationState.error;
        return;
    }
    urls = Object.keys(dict);
    transcripts = Object.values(dict);
    if (urls.length > 10) {
        verified = VerificationState.loggedIn;
        return;
    } else {
        verified = VerificationState.ineligible;
        return;
    }
}

/**
 * Validate Home user status and eligibility
 *
 * Determines whether a user can proceed with the survey
 */
async function validateGoogle(): Promise<void> {
    device = Device.google;
    const csrfTok = await fetchCsrfToken();
    if (!csrfTok || csrfTok === '') {
        verified = VerificationState.loggedOut;
        return;
    }
    const response = await fetchJsonData(csrfTok);
    const data = tryParseJson(response);
    if (data === null || data.length === 0) {
        verified = VerificationState.error;
        return;
    }
    ({ urls, transcripts } = extractData(data[0]));
    if (urls.length > 0) {
        verified = VerificationState.loggedIn;
        return;
    } else {
        verified = VerificationState.ineligible;
        return;
    }
}

async function fetchDeviceData(): Promise<void> {
    if (device === Device.alexa) {
        await validateAmazon();
    } else if (device === Device.google) {
        await validateGoogle();
    } else {
        console.error(`Unrecognized device: ${device}`);
    }
}

/**
 * Process 'verify' message
 */
async function processVerify() {
    await fetchDeviceData();

    // If debug is on, always report status as logged in
    const debug = await getDebugStatus();
    const verificationStatus = debug ? VerificationState.loggedIn : verified;

    checkVerification(verificationStatus);
}

/**
 * Process 'device' message
 */
function processDevice(newDevice: string) {
    if (newDevice === 'alexa') {
        device = Device.alexa;
    } else if (newDevice === 'google') {
        device = Device.google;
    }
}

/**
 * Process messages received from the survey page
 */
async function messageListener(event: MessageEvent): Promise<void> {
    if (event.source !== window) {
        return;
    }

    // TODO: update this call to use event.data.type like the others
    if (event.data === 'verify') {
        processVerify();
        return;
    }

    if (!event.data.hasOwnProperty('type')) {
        return;
    }

    switch (event.data.type) {
        case 'device':
            if (!('device' in event.data)) {
                console.error('Message from webpage missing device');
                return;
            }

            processDevice(event.data.device);
            break;

        case 'recordingRequest': {
            // A recording request is expected to contain the id of the element where the result should be inserted.
            if (!('element' in event.data)) {
                console.error('Message from webpage missing target element ID');
                return;
            }

            processRecordingRequest(event.data.element);
            break;
        }
    }
}

window.addEventListener('message', messageListener, false);
