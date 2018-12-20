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
import { selectUnseen, zip } from '../../common/util';

class SurveyState {
    public device: Device;
    public interactions: Interaction[] = [];
    public seen: number[] = [];
}

// tslint:disable-next-line:variable-name
const _state = new SurveyState();

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
 * Process request for a recording
 *
 * Selects a recording and adds it to the survey page
 *
 * @param questionNumber the current iteration of the recording loop (1-indexed)
 */
async function processRecordingRequest(
    state: SurveyState,
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
async function processVerify(state: SurveyState) {
    let result: ValidationResult;
    if (state.device === Device.alexa) {
        result = await validateAmazon();
    } else if (state.device === Device.google) {
        result = await validateGoogle();
    } else {
        throw new Error(`Unrecognized device: ${state.device}`);
    }

    if (result.urls && result.transcripts) {
        state.interactions = zip(
            result.urls,
            result.transcripts,
            (url, transcript) => {
                return { url, transcript };
            }
        );
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
function processDevice(state: SurveyState) {
    const choices = document.querySelector(
        '#QID5 > div.Inner.BorderColor.SAVR > div > fieldset > div > ul'
    )!;
    const alexa = choices.querySelector(
        'li.Selection.reg > label.q-radio.q-checked'
    );
    const google = choices.querySelector(
        'li.Selection.alt > label.q-radio.q-checked'
    );
    if (alexa) {
        state.device = Device.alexa;
    } else if (google) {
        state.device = Device.google;
    } else {
        state.device = Device.error;
    }
}

/**
 * Process messages received from the survey page
 */
async function messageListener(event: MessageEvent): Promise<void> {
    if (event.source !== window) {
        return;
    } else if (!event.data.hasOwnProperty('type')) {
        return;
    }

    switch (event.data.type) {
        case 'device':
            processDevice(_state);
            break;

        case 'verify':
            processVerify(_state);
            break;

        case 'recordingRequest': {
            // A recording request is expected to contain the id of the element where the result should be inserted.
            if (!('question' in event.data)) {
                console.error('Message from webpage missing question id');
                return;
            }

            processRecordingRequest(_state, event.data.question);
            break;
        }
    }
}

window.addEventListener('message', messageListener, false);
