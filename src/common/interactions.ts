import { Interaction } from './types';
import { reportError } from '../chrome/common/errors';
import { shuffleArray } from './util';

const USELESS_TRANSCRIPTS: RegExp[] = [
    '^\\s*Alexa\\s*$',
    'Google Assistant',
    'Unknown voice command',
    'Text not available'
].map(s => new RegExp(s));

/**
 * Return true if the given interaction should be used in our survey
 * @param interaction the interaction to check
 */
export async function goodInteraction(
    interaction: Interaction
): Promise<boolean> {
    // Check for transcripts that don't convey any information
    // The associated audio is typically also missing.
    const anyBad: boolean = USELESS_TRANSCRIPTS.reduce(
        (previousBad: boolean, badTranscript: RegExp): boolean => {
            return previousBad || badTranscript.test(interaction.transcript);
        },
        false
    );
    if (anyBad) {
        return false;
    }

    // We will check if the recording is valid
    // because sometimes Amazon (at least) returns recordings that are empty.
    // If there's no recording at all, though, we will accept it
    // so as not to exclude the Google interactions that don't save audio.
    if (!interaction.recordingAvailable) {
        return true;
    }
    try {
        // Check that the recording URL returns a valid file.
        const response = await fetch(interaction.url);
        const contentType = response.headers.get('content-type');
        // Check to make sure the response has the standard audio content-type header
        return contentType !== null;
    } catch (error) {
        // Something weird happened when trying to fetch the recording URL.
        // Report the error and try to find another recording,
        // in case there's actually something wrong with this one.
        reportError(error);
        return false;
    }
}

/**
 * Given an array of interactions, order it in-place for iteration during the study.
 *
 * Since we want a random sample of the interactions, we shuffle the array.
 * But because we'd prefer that participants saw interactions with recordings,
 * we move those to the front (otherwise preserving the random ordering).
 */
export function orderInteractions(interactions: Interaction[]): void {
    // Randomize the order of interactions of the array
    shuffleArray(interactions);

    // But put all interactions with recordings ahead of those without them,
    // so that, if possible, those are seen (first).
    interactions.sort((a, b) => {
        if (a.recordingAvailable && !b.recordingAvailable) {
            return -1;
        } else if (!a.recordingAvailable && b.recordingAvailable) {
            return 1;
        } else {
            return 0;
        }
    });
}
