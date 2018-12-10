import { fetchCsrfToken, fetchJsonData, tryParseJson } from '../../common/google/google';
import { getCSRF, getAudio } from '../../common/alexa/amazon';

let device = '';
let verified = '';
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
function checkVerification(value: string): void {
    const placeholder = document.getElementById('QID17')!;
    const nextButton = document.getElementById('NextButton')! as HTMLInputElement;
    placeholder.style.display = 'none';
    if (value === 'loggedIn') {
        nextButton.disabled = false;
        nextButton.click();
    } else if (value === 'loggedOut') {
        placeholder.style.display = 'block';
        alert('Please ensure that you are logged in to your Amazon/Google account. This is required for our study, so we can customize our questions to your specific device. Please relog and click on the retry button below.');
        const tag = "<button onClick=\"window.postMessage('verify', '*')\">Retry</button>";
        placeholder.getElementsByClassName('QuestionText')[0].innerHTML = tag;
    } else if (value === 'ineligible') {
        /* we can (should?) rephrase this when we get a chance */
        alert('It looks like you don\'t have enough recordings. Sorry but you are ineligible for this survery');
    } else {
        placeholder.style.display = 'block';
        alert('There may have been an error in fetching your device recordings. Please try again');
        const tag = "<button onClick=\"window.postMessage('retry', '*')\">Retry</button>";
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
function processRecordingRequest(targetElement: string): void {
    // Select recording to show
    let index = Math.floor(Math.random() * urls.length);
    while (seen.includes(index)) {
        index = Math.floor(Math.random() * urls.length);
    }
    seen.push(index);
    const url = urls[index];
    const transcript = transcripts[index];

    // Display recording on page
    const tag =
        '<audio controls><source src="' +
        url +
        '" type="audio/mp3"></audio> <br> Transcript: ' +
        transcript;
    document
        .getElementById(targetElement)!
        .getElementsByClassName('QuestionText')[0].innerHTML = tag;
}

/**
 * Validate Echo user status and eligibility
 *
 * Determines whether a user can proceed with the survey
 */
const validateAmazon = async () => {
    device = 'alexa';
    const csrfTok = await getCSRF();
    if (csrfTok == null) {
        verified = 'loggedOut';
        return;
    }
    const dict = await getAudio(csrfTok);
    if (dict == null) {
        verified = 'error';
        return;
    }
    urls = Object.keys(dict);
    transcripts = Object.values(dict);
    if (urls.length > 0) {
        verified = 'loggedIn';
        return;
    } else {
        verified = 'ineligible';
        return;
    }
};

/**
 * Validate Home user status and eligibility
 *
 * Determines whether a user can proceed with the survey
 */
const validateGoogle = async () => {
    device = 'google';
    const csrfTok = await fetchCsrfToken();
    if (csrfTok === '') {
        verified = 'loggedOut';
        return;
    }
    const response = await fetchJsonData(csrfTok);
    const data = await tryParseJson(response);
    if (data === null) {
        verified = 'error';
        return;
    }
    urls = data[0].urls;
    transcripts = data[0].transcripts;
    if (urls.length > 0) {
        verified = 'loggedIn';
        return;
    } else {
        verified = 'ineligible';
        return;
    }
};

async function fetchDeviceData(): Promise<void> {
    if (device === 'alexa') {
        await validateAmazon();
    } else if (device === 'google') {
        await validateGoogle();
    } else {
        console.error(`Unrecognized device: ${device}`);
    }
}

const messageListener = async event => {
    if (event.source !== window) {
        // pass
    } else if (event.data === 'verify') {
        await fetchDeviceData();
        window.postMessage({ type: 'verification', value: verified }, '*');
    } else if (event.data.hasOwnProperty('type')) {
        switch (event.data.type) {
            case 'device':
                if (!('device' in event.data)) {
                    console.error('Message from webpage missing device');
                    return;
                }
                device = event.data.device;
                break;

            case 'verification':
                if (!('value' in event.data)) {
                    console.error(
                        'Message from webpage missing verification value'
                    );
                    return;
                }
                checkVerification(event.data.value);
                break;

            case 'recordingRequest': {
                // A recording request is expected to contain the id of the element where the result should be inserted.
                if (!('element' in event.data)) {
                    console.error(
                        'Message from webpage missing target element ID'
                    );
                    return;
                }
                processRecordingRequest(event.data.element);
                break;
            }
        }
    }
};

window.addEventListener('message', messageListener, false);
