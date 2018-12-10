import { fetchAudioGoogle } from '../../common/google/google';
import { getCSRF } from '../../common/alexa/amazon';
import { getAudio } from '../../common/alexa/amazon';

let device = '';
let verified = false;
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
function checkVerification(value: boolean): void {
    const placeholder = document.getElementById('QID17')!;
    const nextButton = document.getElementById('NextButton')! as HTMLInputElement;
    placeholder.style.display = 'none';
    if (value) {
        nextButton.disabled = false;
        nextButton.click();
    } else {
        // we may want to add some saved params to tell them "signed out of Amazon/Google acct"
        placeholder.style.display = 'block';
        alert('Please ensure that you are logged in to your Amazon/Google account. This is required for our study, so we can customize our questions to your specific device. Please relog and click on the retry button below.');
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

const messageListener = async event => {
    if (event.source !== window) {
        // pass
    } else if (event.data === 'alexa') {
        device = 'alexa';
        const csrfTok = await getCSRF();
        if (csrfTok == null) {
            console.log('logged out');
        }
        const dict = await getAudio(csrfTok);
        if (dict == null) {
            console.log('CSRF Validation Error');
        } else {
            console.log(dict);
            urls = Object.keys(dict);
            transcripts = Object.values(dict);
            console.log(urls);
            if (urls.length > 0) {
                // additional screening logic
                verified = true;
            }
        }
    } else if (event.data === 'google') {
        device = 'google';
        const data = await fetchAudioGoogle();
        urls = data.urls;
        transcripts = data.transcripts;
        if (urls.length > 0) {
            // additional screening logic
            verified = true;
        }
    } else if (event.data === 'verify') {
        window.postMessage({ type: 'verification', value: verified }, '*');
    } else if (event.data === 'retry') {
        window.postMessage(device, '*');
        setTimeout(() => {
            window.postMessage('verify', '*');
        }, 2000);
    } else if (event.data.hasOwnProperty('type')) {
        switch (event.data.type) {
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
