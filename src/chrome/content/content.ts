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

const DUMMY_INTERACTION: Interaction = {
    url: 'https://people.eecs.berkeley.edu/~nmalkin/sample.mp3',
    transcript: 'This is a test transcript.'
};

const ERROR_INTERACTION: Interaction = {
    url: '',
    transcript:
        "Something went wrong. Please enter STUDY ERROR as the transcript and select any answer to remaining questions. We're sorry for the inconvenience!"
};

/**
 * Selects an integer at random between 0 and max, if it doesn't appear in `seen`
 *
 * @param max the chosen number will be less than (but not equal to) max.
 * @param seen the integers that have already been seen
 */
function selectUnseen(max: number, seen: number[]): number {
    if (seen.length >= max) {
        throw new Error('all numbers seen');
    }

    const randomInt = () => Math.floor(Math.random() * max);
    let index = randomInt();
    while (seen.includes(index)) {
        index = randomInt();
    }
    return index;
}

/**
 * Process request for a recording
 *
 * Selects a recording and adds it to the survey page
 *
 * @param questionNumber the current iteration of the recording loop (1-indexed)
 */
async function processRecordingRequest(
    state: State,
    questionNumber: number
): Promise<void> {
    // Select recording to show
    let interaction: Interaction;
    if (questionNumber <= state.seen.length) {
        // Page is requesting a question/interaction that's already been seen.
        const index = state.seen[questionNumber - 1];
        interaction = state.interactions[index];
    } else {
        // Choose a new interaction
        try {
            // Try to get an interaction that hasn't been seen before
            const index = selectUnseen(state.interactions.length, state.seen);
            state.seen.push(index);
            interaction = state.interactions[index];
        } catch {
            // All available interactions have already been seen!
            if (await getDebugStatus()) {
                // Substitute dummy recording if we're in debug mode
                interaction = DUMMY_INTERACTION;
            } else {
                // This shouldn't happen, but if we end up in this state, we should handle it as gracefully as possible.
                console.error('No available recordings to show');
                interaction = ERROR_INTERACTION;
            }
        }
    }

    // Display recording on page
    displayInteraction(interaction, questionNumber);
}

/**
 * Process 'verify' message
 */
async function processVerify(state: State) {
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

    // If debug is on, always report status as logged in
    const debug = await getDebugStatus();
    const verificationStatus = debug
        ? VerificationState.loggedIn
        : result.status;

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

            // FIXME: pass number directly from the page
            const element = event.data.element;
            const questionNumber = parseInt(element, 10); // This relies on parseInt('4_QID9') to return 4, which is hacky.

            processRecordingRequest(STATE, questionNumber);
            break;
        }
    }
}

window.addEventListener('message', messageListener, false);
