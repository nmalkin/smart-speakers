import {
    Interaction,
    ValidationResult,
    VerificationState
} from '../../common/types';
import { Device } from '../../common/device';
import { Google } from '../../common/google/google';
import { Alexa } from '../../common/alexa/amazon';
import { getDebugStatus } from '../common/debug';
import {
    displayVerificationResults,
    displayInteraction,
    displayVerificationPlaceholder
} from './views';
import { selectUnseen, zip } from '../../common/util';
import { reportError, initErrorHandling } from '../common/errors';

class SurveyState {
    public device: Device;
    public interactions: Interaction[] = [];
    public seen: number[] = [];
}

// tslint:disable-next-line:variable-name
const _state = new SurveyState();

const DUMMY_INTERACTION: Interaction = {
    recordingAvailable: true,
    url: 'https://people.eecs.berkeley.edu/~nmalkin/sample.mp3',
    transcript: 'This is a test transcript.',
    timestamp: 0
};

const ERROR_INTERACTION: Interaction = {
    recordingAvailable: false,
    url: '',
    transcript:
        "Something went wrong. Please enter STUDY ERROR as the transcript and select any answer to remaining questions. We're sorry for the inconvenience!",
    timestamp: 0
};

/**
 * Select a valid recording
 *
 * Processes the current state to find valid recording we haven't seen
 *
 * @param state the current state of the survey
 */
async function selectValid(state: SurveyState): Promise<Interaction> {
    let foundValid = false;
    let interaction;
    while (!foundValid) {
        const index = selectUnseen(state.interactions.length, state.seen);
        state.seen.push(index);
        interaction = state.interactions[index];
        if (!interaction.recordingAvailable) {
            break;
        }
        const response = await fetch(interaction.url);
        const contentType = response.headers.get('content-type');

        /* checks to make sure the response has the standard audio content-type header */
        foundValid = contentType !== null;
    }
    return interaction;
}

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
            interaction = await selectValid(state);
        } catch {
            // All available interactions have already been seen!
            if (await getDebugStatus()) {
                // Substitute dummy recording if we're in debug mode
                interaction = DUMMY_INTERACTION;
            } else {
                // This shouldn't happen, but if we end up in this state, we should handle it as gracefully as possible.
                reportError('No available recordings to show');
                interaction = ERROR_INTERACTION;
            }
        }
    }

    // Display recording on page
    displayInteraction(interaction, questionNumber);
}

/**
 * Check the current user's eligibility for the study.
 * If validation failed, then that status is preserved.
 * If validation succeeded but the user is ineligible, their status is updated.
 */
function checkEligibility(result: ValidationResult): void {
    if (result.status !== VerificationState.loggedIn) {
        // Validation failed, so we keep the status as-is.
        // Then the appropriate error message can be displayed to the user.
        return;
    }

    // Check eligibility
    // A user is eligible if they have:
    // 1) At least 30 recordings
    if (!result.interactions || result.interactions.length < 30) {
        result.status = VerificationState.ineligible;
        return;
    }

    // 2) Had the device for at least 30 days
    const oldestInteraction = result.interactions
        .map(interaction => interaction.timestamp)
        .sort()[0];
    const elapsedMilliseconds = Date.now() - oldestInteraction;
    const elapsedDays = elapsedMilliseconds / (1000 * 60 * 60 * 24);
    if (elapsedDays < 30) {
        result.status = VerificationState.ineligible;
        return;
    }

    // Good news! Validation succeeded.
}

/**
 * Process 'verify' message
 */
async function processVerify(state: SurveyState) {
    displayVerificationPlaceholder();

    let result: ValidationResult;
    try {
        result = await state.device.validate();
        checkEligibility(result);
    } catch (error) {
        reportError(error);
        result = { status: VerificationState.error };
    }

    if (result.interactions) {
        state.interactions = result.interactions;
    }

    if (result.errors) {
        console.error(
            'Errors happened earlier, while processing interactions.'
        );
        result.errors.forEach(error => {
            reportError(error);
        });
    }

    // If debug is on, always report status as logged in
    const debug = await getDebugStatus();
    const verificationStatus = debug
        ? VerificationState.loggedIn
        : result.status;

    displayVerificationResults(
        verificationStatus,
        state.device,
        state.interactions
    );
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
        state.device = Alexa;
    } else if (google) {
        state.device = Google;
    }
}

/**
 * Process messages received from the survey page
 */
async function processMessages(event: MessageEvent): Promise<void> {
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
                reportError('Message from webpage missing question id');
                return;
            }

            processRecordingRequest(_state, event.data.question);
            break;
        }
    }
}

/**
 * Process messages and catch errors
 */
async function messageListener(event: MessageEvent): Promise<void> {
    try {
        await processMessages(event);
    } catch (error) {
        reportError(error);
        const message = `We're really sorry, but something in our extension went wrong. This is unexpected, and we'll try to fix the problem as soon as possible.

In some cases, you may be able to continue, and everything will keep working. However, it's likely other things will break too.

We suggest pausing the study and sending an email either through the Mechanical Turk system or directly to usablesec@icsi.berkeley.edu

We apologize for the inconvenience!`;
        alert(message);
    }
}

initErrorHandling();
window.addEventListener('message', messageListener, false);

/**
 * Dynamically resize frame to have same height as survey page
 */
let observer;
window.addEventListener(
    'load',
    () => {
        const target = document.getElementById('Page')!;
        const config = { childList: true, subtree: true };
        observer = new MutationObserver(() => {
            window.parent.postMessage({ height: target.scrollHeight }, '*');
        });
        observer.observe(target, config);
    },
    false
);
