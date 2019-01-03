import {
    ValidationResult,
    VerificationState,
    Interaction,
    Device
} from '../../common/types';
import { wait } from '../util';

/** Batch size when querying Amazon */
const BATCH_SIZE = 20;

/**
 * If we find ourselves making this many requests, something may have gone wrong, and we should probably stop.
 * Alternately, the user may have *a lot* of data, but we don't need complete coverage.
 */
const TOO_MANY_REQUESTS = 500;

const csrfReg = /csrfToken = "(.*)"/g;
const expReg = /<audio id="audio-(.+)"> <source[\w\W]*?(?:<div class="summaryCss">|<div class="summaryNotAvailableCss">)\s*(.*?)\s*<\/div/g;

interface AlexaInteraction extends Interaction {
    audioID: string;
}

/**
 * Extract CSRF token from page contents
 *
 * @param pageText the raw HTML of a page with the CSRF token
 */
function matchCSRF(pageText: string): string {
    const match = pageText.match(csrfReg);
    if (match === null) {
        throw new Error("couldn't find CSRF token in page");
    }
    return encodeURIComponent(match[0].slice(13, -1));
}

/**
 * Return true if the audio id is well-formed
 *
 * A well-formed audio ID is expected to have a / as its next-to-last (104th) character.
 * TODO: why? Is there anything more stable we can check for?
 */
function validAudioID(id: string): boolean {
    return id.length >= 104 && id[104] === '/';
}

/** Regular expression for extracting the timestamp from an audio ID */
const timestampRegex = /^A\w+:1.0\/(20\d\d)\/(\d\d)\/(\d\d)\/(\d\d)\/\w+\/(\d\d):(\d\d):/;

/**
 * Given an Amazon audio ID, extracts the approximate timestamp for that interaction
 * @see timestampRegex
 */
export function timestampFromAudioID(id: string): number {
    const match = timestampRegex.exec(id);
    if (match === null) {
        throw new Error(`failed to find timestamp in audio ID: ${id}`);
    }

    const [year, month, day, hour, minute, second] = match
        .slice(1)
        .map(value => parseInt(value, 10));
    return Date.UTC(year, month - 1, day, hour, minute, second);
}

/**
 * Given a match object returned by expReg, extracts the resulting interaction
 *
 * @see expReg
 */
function getInteractionFromMatch(match: RegExpMatchArray): AlexaInteraction {
    if (match.length < 3) {
        throw new Error('matched interaction but missing fields');
    }

    const audioID = match[1];
    if (!validAudioID(audioID)) {
        console.warn(`encountered invalid audio ID: ${audioID}`);
        // TODO: this used to be an error, but I'm currently not clear if this validation is necessary, so I'm disabling it for now.
    }
    const transcript = match[2];
    const url = `https://www.amazon.com/hz/mycd/playOption?id=${audioID}`;
    const timestamp = timestampFromAudioID(audioID);
    return { audioID, url, transcript, timestamp, recordingAvailable: true };
}

/**
 * Extract interaction data from page HTML
 *
 * @param pageText the raw HTML of the page
 * @returns an object with keys as the URL and transcripts as value, or an empty object if those could not be found
 */
export function extractAudio(pageText: string): AlexaInteraction[] {
    const interactions: AlexaInteraction[] = [];
    let match = expReg.exec(pageText);
    while (match) {
        const interaction = getInteractionFromMatch(match);
        if (interaction) {
            interactions.push(interaction);
        }
        match = expReg.exec(pageText);
    }
    return interactions;
}

/**
 * Get the contents of the overview page
 *
 * We use it only to extract the CSRF token.
 */
async function getCSRFPage(): Promise<string> {
    const response = await fetch(
        'https://www.amazon.com/hz/mycd/myx#/home/content/booksAll/dateDsc/'
    );
    const text = await response.text();
    return text;
}

/**
 * Return true if the current user is logged in to Amazon
 *
 * This is done by trying to access a page that's only visible if the user is logged in.
 * If the request ends up redirected (presumably to the login page),
 * we assume that they're not.
 */
export async function isLoggedIn(): Promise<boolean> {
    const response = await fetch('https://www.amazon.com/gp/yourstore/home');
    const loggedIn = !response.redirected;
    return loggedIn;
}

/**
 * A URL that Amazon considers "sensitive":
 * if you try accessing this after having been logged in for a while,
 * it re-prompts you for a password.
 */
const upgradeUrl =
    'https://www.amazon.com/gp/mas/your-account/myapps/yourdevices/';

/**
 * Return true if the current user needs to re-enter their password before accessing content
 *
 * We know this is the case if they're redirected away from a "sensitive" page.
 * @see upgradeUrl
 */
export async function requiresPasswordUpgrade(): Promise<boolean> {
    const response = await fetch(upgradeUrl);
    const upgradeRequired = response.redirected;
    return upgradeRequired;
}

/**
 * Fetch the overview page
 */
async function getCSRF(): Promise<string> {
    const text = await getCSRFPage();
    return matchCSRF(text);
}

/**
 * Get the page with activity data and return its contents
 * @param token the CSRF token to use in the request
 */
async function fetchTranscriptPage(
    token: string,
    endTimestamp = Date.now(),
    startTimestamp = 1388538769000,
    batchSize = BATCH_SIZE
): Promise<string> {
    const response = await fetch(
        'https://www.amazon.com/hz/mycd/alexa/activityTranscripts',
        {
            method: 'POST',
            body: `csrfToken=${token}&rangeType=custom&startDate=${startTimestamp}&endDate=${endTimestamp}&batchSize=${batchSize}&shouldParseStartDate=false&shouldParseEndDate=false`,
            mode: 'cors',
            redirect: 'follow',
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
        }
    );
    const text = await response.text();
    return text;
}

/**
 * Response type for the activityTimestamps endpoint
 */
interface AmazonTimestamp {
    activityKey: string;
    activityTimeStamp: number;
    deletionStatus: string;
}

/**
 * Query the Amazon timestamp endpoint
 * @param token the CSRF token to use in the request
 * @returns the parsed JSON that is returned
 */
async function fetchTimestamps(
    token: string,
    endTimestamp = Date.now(),
    startTimestamp = 1388538769000,
    batchSize = BATCH_SIZE
): Promise<AmazonTimestamp[]> {
    const response = await fetch(
        'https://www.amazon.com/hz/mycd/alexa/activityTimestamps',
        {
            method: 'POST',
            body: `csrfToken=${token}&rangeType=custom&startDate=${startTimestamp}&endDate=${endTimestamp}&batchSize=${batchSize}&shouldParseStartDate=false&shouldParseEndDate=false`,
            mode: 'cors',
            redirect: 'follow',
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
        }
    );

    const json = await response.json();

    // Validate response
    if (!Array.isArray(json)) {
        throw new Error('unexpected response format for activityTimestamps');
    }
    json.forEach(activity => {
        if (!('activityTimeStamp' in activity)) {
            throw new Error(
                'activityTimestamps response missing activityTimeStamp'
            );
        }
    });

    return json;
}

/**
 * Update all interactions with given timestamps
 * @param interactions
 * @param timestamps
 */
function updateInteractionTimestamps(
    interactions: AlexaInteraction[],
    timestamps: AmazonTimestamp[]
): void {
    interactions.forEach((interaction, i) => {
        interaction.timestamp = timestamps[i].activityTimeStamp;
    });
}

/**
 * Get the page with activity data and return the parsed interaction data
 * @param csrfToken the CSRF token to use in the request
 */
async function getAudio(
    csrfToken: string,
    endTimestamp?: number,
    startTimestamp?: number
): Promise<AlexaInteraction[]> {
    const text = await fetchTranscriptPage(
        csrfToken,
        endTimestamp,
        startTimestamp
    );
    if (
        text ===
        '{"ERROR":"{\\"success\\":false,\\"error\\":\\"CSRF_VALIDATION_FAILED\\"}"}'
    ) {
        throw new Error('CSRF validation failed');
    }
    return extractAudio(text);
}

/**
 * Repeatedly query activity endpoint until we get all data
 * @param csrfToken
 */
export async function getAllInteractions(
    csrfToken: string
): Promise<AlexaInteraction[]> {
    let allInteractions: AlexaInteraction[] = [];

    // Make initial request for activity data, asking at first for all time
    // i.e., beginning of time to now
    // We won't get everything, though: only up to BATCH_SIZE interactions.
    let endTimestamp = Date.now();
    let interactions = await getAudio(csrfToken, endTimestamp);
    allInteractions = allInteractions.concat(interactions);

    // Are there more interactions available?
    // To find out, we will query for the same time range but with a batch size of n+1.
    // If we receive n+1 results back, then we know there's at least one more interaction left.
    // One additional detail:
    // rather than querying the HTML data, we'll query a separate endpoint that only returns timestamps.
    // Fun fact: this is exactly how the Amazon/Alexa UI actually does it.
    // As a bonus, we also retrieve the more fine-grained timestamps for the interactions.
    let timestamps = await fetchTimestamps(
        csrfToken,
        endTimestamp,
        undefined,
        BATCH_SIZE + 1
    );
    updateInteractionTimestamps(interactions, timestamps);

    let batchesRequested = 1; // how many (groups of) requests we've made

    while (timestamps.length > BATCH_SIZE) {
        // Wait a little bit to avoid sending too many requests at once
        const waitTime = 100 * Math.log10(batchesRequested);
        await wait(waitTime);

        // Ask for everything up to the earliest interaction we saw
        const earliestInteraction = timestamps[BATCH_SIZE - 1];
        endTimestamp = earliestInteraction.activityTimeStamp;

        // Make the next pair of requests
        interactions = await getAudio(csrfToken, endTimestamp);
        allInteractions = allInteractions.concat(interactions);
        timestamps = await fetchTimestamps(
            csrfToken,
            endTimestamp,
            undefined,
            BATCH_SIZE + 1
        );
        updateInteractionTimestamps(interactions, timestamps);

        // If we seem to be stuck in a loop, abort
        if (++batchesRequested > TOO_MANY_REQUESTS) {
            console.warn('aborting fetching because we sent too many requests');
            break;
        }
    }

    return allInteractions;
}

/**
 * Validate Echo user status and eligibility
 *
 * Determines whether a user can proceed with the survey
 */
async function validateAmazon(): Promise<ValidationResult> {
    const loggedIn: boolean = await isLoggedIn();
    if (!loggedIn) {
        return { status: VerificationState.loggedOut };
    }

    const upgradeRequired: boolean = await requiresPasswordUpgrade();
    if (upgradeRequired) {
        return { status: VerificationState.upgradeRequired };
    }

    const csrfTok = await getCSRF();

    const interactions = await getAllInteractions(csrfTok);

    // Validate quantity of interactions
    if (interactions.length > 10) {
        return {
            status: VerificationState.loggedIn,
            interactions
        };
    } else {
        return { status: VerificationState.ineligible };
    }
}

export const Alexa: Device = {
    accountName: 'Amazon',
    loginURL: upgradeUrl,
    validate: validateAmazon
};

export {
    validAudioID,
    getInteractionFromMatch,
    getCSRF,
    getCSRFPage,
    matchCSRF,
    fetchTranscriptPage,
    validateAmazon
};
