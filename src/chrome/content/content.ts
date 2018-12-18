import {
    Device,
    Interaction,
    ValidationResult,
    VerificationState
} from '../../common/types';
import { validateGoogle } from '../../common/google/google';
import { validateAmazon } from '../../common/alexa/amazon';
import { getDebugStatus } from '../common/debug';
import { displayVerificationResults, displayInteraction } from './views';

class State {
    public device: Device;
    public interactions: Interaction[] = [];
    public seen: number[] = [];
}

const STATE = new State();

/**
 * Process request for a recording
 *
 * Selects a recording and adds it to the survey page
 *
 * @param iteration the current iteration of the recording loop (i.e., how many recordings the user has seen so far)
 */
async function processRecordingRequest(
    state: State,
    iteration: string
): Promise<void> {
    // Select recording to show
    let index: number;
    const questionNumber = parseInt(iteration, 10);
    if (questionNumber <= state.seen.length) {
        // User is on an old question
        index = state.seen[questionNumber - 1];
    } else {
        // Select new recording
        index = Math.floor(Math.random() * state.interactions.length);
        // FIXME: this will go into an infinite loop if the number of available recordings is less than the number of questions
        // Debug mode, in particular, will trigger this.
        while (state.seen.includes(index)) {
            index = Math.floor(Math.random() * state.interactions.length);
        }
        state.seen.push(index);
    }

    // FIXME: debug mode is broken because, at this point, interactions are empty, yet we try to index them
    let url = state.interactions[index].url;
    let transcript = state.interactions[index].transcript;

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
    displayInteraction(url, transcript, iteration);
}

/**
 * Query the device's manufacturer to check login status and download interactions
 */
async function fetchDeviceData(state: State): Promise<VerificationState> {
    let result: ValidationResult;
    if (state.device === Device.alexa) {
        result = await validateAmazon();
    } else if (state.device === Device.google) {
        result = await validateGoogle();
    } else {
        throw new Error(`Unrecognized device: ${state.device}`);
    }

    if (result.urls && result.transcripts) {
        if (result.urls.length !== result.transcripts.length) {
            throw new Error("number of URLs and transcripts doesn't match");
        }

        const transcripts = result.transcripts;
        state.interactions = result.urls.map((url, i) => {
            const transcript = transcripts[i];
            return { url, transcript };
        });
    }

    return result.status;
}

/**
 * Process 'verify' message
 */
async function processVerify(state: State) {
    const verified = await fetchDeviceData(state);

    // If debug is on, always report status as logged in
    const debug = await getDebugStatus();
    const verificationStatus = debug ? VerificationState.loggedIn : verified;

    displayVerificationResults(verificationStatus);
}

/**
 * Process 'device' message
 */
function processDevice(state: State, newDevice: string) {
    if (newDevice === 'alexa') {
        state.device = Device.alexa;
    } else if (newDevice === 'google') {
        state.device = Device.google;
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
        processVerify(STATE);
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

            processDevice(STATE, event.data.device);
            break;

        case 'recordingRequest': {
            // A recording request is expected to contain the id of the element where the result should be inserted.
            if (!('element' in event.data)) {
                console.error('Message from webpage missing target element ID');
                return;
            }

            processRecordingRequest(STATE, event.data.element);
            break;
        }
    }
}

window.addEventListener('message', messageListener, false);
