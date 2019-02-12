import { reportIssue } from '../../chrome/common/errors';
import {
    DownloadStatus,
    Interaction,
    ValidationResult,
    VerificationState
} from '../../common/types';
import { Device } from '../device';
import { MAX_WAIT_SECONDS } from '../settings';
import { sleep } from '../util';

type GoogleActivityList = any[];
type GoogleActivityResponse = [GoogleActivityList | null, string | null];
interface GoogleValidationResult extends ValidationResult {
    activities: GoogleActivityList;
}

/**
 * If we find ourselves making this many requests, something may have gone wrong, and we should probably stop.
 * Alternately, the user may have *a lot* of data, but we don't need complete coverage.
 */
const TOO_MANY_REQUESTS = 100;

/**
 * Check page for whether user is signed out
 * @param text contents of the activity page
 * @returns true if signed out
 */
function checkSignedOut(text: string): boolean {
    const regex = /FootprintsMyactivitySignedoutUi/;
    return text.search(regex) > -1;
}

/**
 * Extract CSRF token from page
 * @param text
 * @returns csrf token or null if it couldn't be found
 */
function extractCsrfToken(text: string): string | null {
    const regex = /window\.HISTORY_xsrf='(\S{44})'/;
    const match = text.match(regex);
    const token = match ? match[1] : null;
    return token;
}

/**
 * Make a request and return CSRF token
 * @returns CSRF token, empty string if signed out, null if not found
 */
async function fetchCsrfToken(): Promise<string | null> {
    const response = await fetch(
        'https://myactivity.google.com/item?product=31'
    );
    const restxt = await response.text();
    if (checkSignedOut(restxt)) {
        return '';
    }
    return extractCsrfToken(restxt);
}

/**
 * Fetch activity data
 * (We only fetch data for Assistant by specifying its product ID.)
 *
 * @param token CSRF token
 * @param cursor cursor for repeated requests
 */
async function fetchActivityData(
    token: string,
    cursor?: string
): Promise<string> {
    const cursorBody = `,"ct":"${cursor}"`;
    const body = `{"sig":"${token}"${cursor ? cursorBody : ''}}`;

    const response = await fetch(
        'https://myactivity.google.com/item?product=31&jspb=1',
        {
            method: 'POST',
            body
        }
    );
    const restxt = await response.text();
    return restxt;
}

/**
 * Pre-process activity data
 * @param response returned by fetchActivityData
 */
function processActivityData(response: string): string {
    // The response is valid JSON, except it starts with: )]}',
    const cleaned = response.slice(6);
    return cleaned;
}

/**
 * Fetch and pre-process activity data
 * @param token CSRF token
 */
async function fetchJsonData(token: string, cursor?: string): Promise<string> {
    const response = await fetchActivityData(token, cursor);
    return processActivityData(response);
}

/**
 * Try to parse Google activity into valid JSON, then further validate that it looks as expected
 *
 * @param jsonString
 * @return the parsed data as an array
 * @throws error if something doesn't match our expectations
 */
function parseActivityData(jsonString: string): GoogleActivityResponse {
    let obj = JSON.parse(jsonString);

    if (!Array.isArray(obj)) {
        throw new Error('unexpected activity response: data is not an array');
    } else if (obj.length !== 2) {
        throw new Error(
            'unexpected activity response: length of array is not 2'
        );
    }

    obj = obj as [any, any];
    if (obj[0] && !Array.isArray(obj[0])) {
        throw new Error(
            'unexpected activity response: activity list is not an array'
        );
    } else if (obj[1] && typeof obj[1] !== 'string') {
        throw new Error(
            'unexpected activity response: token field is not a string'
        );
    }

    return obj;
}

/**
 * Repeatedly query activity endpoint until there's nothing left
 * @param csrfToken
 * @returns all activities, concatenated; plus any errors encountered
 */
async function downloadAllActivity(
    csrfToken: string
): Promise<GoogleValidationResult> {
    let allActivities: GoogleActivityList = [];
    const allErrors: Error[] = [];
    let downloadStatus: DownloadStatus = DownloadStatus.success;

    const startTime = performance.now();

    let response = await fetchJsonData(csrfToken);
    let [currentActivities, cursor] = parseActivityData(response);

    if (currentActivities === null) {
        // Initial activity response is empty (null)
        // This means the user has no activity saved.
        allActivities = [];

        // If there are no activities, then you'd expect there to be no further activities either,
        // so the cursor should be null too.
        if (cursor !== null) {
            reportIssue("initial activity was null but cursor wasn't");
            // This is weird, but has happened at least once.
            // Maybe there's more data if we ask for it.
            // For now, at least, let's continue with trying to download data.
            // cursor = null;
        }
    } else {
        allActivities = allActivities.concat(currentActivities);
    }

    let requests = 1;

    while (cursor !== null) {
        // Wait a little bit to avoid sending too many requests at once
        const waitTime = 100 * Math.log10(requests);
        await sleep(waitTime);

        // Fetch and parse the next round of data
        try {
            response = await fetchJsonData(csrfToken, cursor);
            [currentActivities, cursor] = parseActivityData(response);

            if (currentActivities === null) {
                // We've downloaded all available data. Nothing left.
                break;
            } else {
                // Add the new data to the existing one
                allActivities = allActivities.concat(currentActivities);
            }
        } catch (error) {
            allErrors.push(error);
            break;
        }

        // If we seem to be stuck in a loop, abort
        if (++requests > TOO_MANY_REQUESTS) {
            console.warn('aborting fetching because we sent too many requests');
            downloadStatus = DownloadStatus.maxedOut;
            break;
        }

        // If we've taken too long, abort.
        const timeNow = performance.now();
        const secondsElapsed = (timeNow - startTime) / 1000;
        if (secondsElapsed > MAX_WAIT_SECONDS) {
            console.warn(`exceeded wait time of ${MAX_WAIT_SECONDS} seconds`);
            downloadStatus = DownloadStatus.timedOut;
            break;
        }
    }

    return {
        status: VerificationState.loggedIn,
        downloadStatus,
        activities: allActivities,
        interactions: [],
        errors: allErrors
    };
}

/**
 * Parse a timestamp string in microseconds to a number in milliseconds
 */
export function parseTimestamp(timestampString: string): number {
    const parsedTimestamp = parseInt(timestampString, 10);
    if (Number.isNaN(parsedTimestamp)) {
        throw new Error(`timestamp is not a number: ${timestampString}`);
    }
    const inMilliseconds = parsedTimestamp / 1000; // convert to milliseconds
    const timestamp = Math.floor(inMilliseconds); // make sure result is integer
    return timestamp;
}

class GoogleInteraction implements Interaction {
    public static TRANSCRIPT_INDEX = 9;
    public static URL_INDEX = 24;
    public static TIMESTAMP_INDEX = 4;
    public static SOURCE_INDEX = 19;

    public static fromArray(
        rawJson: GoogleActivityList
    ): [GoogleInteraction[], Error[]] {
        if (!rawJson) {
            throw new Error('raw Google interaction data is empty');
        } else if (!Array.isArray(rawJson)) {
            throw new Error(
                'expecting raw Google interaction data to be an array of interaction items'
            );
        }

        const errors: Error[] = [];
        const interactions: GoogleInteraction[] = rawJson
            .map(item => {
                try {
                    return new GoogleInteraction(item);
                } catch (error) {
                    errors.push(error);
                }
            })
            .filter(
                (interaction): interaction is GoogleInteraction =>
                    interaction !== undefined
            );
        return [interactions, errors];
    }

    public readonly recordingAvailable: boolean;
    public readonly url: string;
    public readonly transcript: string;
    public readonly timestamp: number;

    private json: any[];

    constructor(rawJson: any[]) {
        if (!Array.isArray(rawJson)) {
            const snippet = JSON.stringify(rawJson).slice(0, 5); // truncate for privacy
            throw new Error(
                `expected raw data for Google interaction to be an array, but it was ${snippet}...`
            );
        }
        this.json = rawJson;

        // Set transcript
        if (this.json.length <= GoogleInteraction.TRANSCRIPT_INDEX) {
            throw new Error(
                `interaction missing transcript at ${
                    GoogleInteraction.TRANSCRIPT_INDEX
                }`
            );
        } else if (
            !Array.isArray(this.json[GoogleInteraction.TRANSCRIPT_INDEX])
        ) {
            throw new Error('transcript is not an array');
        }
        this.transcript = this.json[GoogleInteraction.TRANSCRIPT_INDEX][0];

        // Set recordingVailable
        if (this.json.length <= GoogleInteraction.URL_INDEX) {
            this.recordingAvailable = false;
        } else if (!Array.isArray(this.json[GoogleInteraction.URL_INDEX])) {
            this.recordingAvailable = false;
        } else {
            this.recordingAvailable = true;
        }

        // Set url
        if (this.recordingAvailable) {
            if (this.json.length <= GoogleInteraction.URL_INDEX) {
                throw new Error(
                    `interaction missing url at ${GoogleInteraction.URL_INDEX}`
                );
            } else if (!Array.isArray(this.json[GoogleInteraction.URL_INDEX])) {
                throw new Error('interaction missing url');
            }

            this.url = this.json[GoogleInteraction.URL_INDEX][0];
        } else {
            this.url = '';
        }

        // Set timestamp
        if (this.json.length <= GoogleInteraction.TIMESTAMP_INDEX) {
            throw new Error(
                `interaction missing timestamp at ${
                    GoogleInteraction.TIMESTAMP_INDEX
                }`
            );
        }

        this.timestamp = parseTimestamp(
            this.json[GoogleInteraction.TIMESTAMP_INDEX]
        );
    }

    /**
     * Check whether this interaction is attributed to Google Home
     */
    get isGoogleHome(): boolean {
        if (this.json.length <= GoogleInteraction.SOURCE_INDEX) {
            return false;
        } else if (!Array.isArray(this.json[GoogleInteraction.SOURCE_INDEX])) {
            return false;
        } else if (
            !Array.isArray(this.json[GoogleInteraction.SOURCE_INDEX][0])
        ) {
            return false;
        }

        const source = this.json[GoogleInteraction.SOURCE_INDEX][0][0];
        return source === 'Google Home';
    }

    /**
     * Throw an error if this interaction isn't attributed to Google Home
     */
    public assertGoogleHome(): void {
        if (this.json.length <= GoogleInteraction.SOURCE_INDEX) {
            throw new Error(
                `interaction missing source at ${
                    GoogleInteraction.SOURCE_INDEX
                }`
            );
        } else if (!Array.isArray(this.json[GoogleInteraction.SOURCE_INDEX])) {
            throw new Error(
                'unexpected format for interaction source (layer 1)'
            );
        } else if (
            !Array.isArray(this.json[GoogleInteraction.SOURCE_INDEX][0])
        ) {
            throw new Error(
                'unexpected format for interaction source (layer 2)'
            );
        }

        const source = this.json[GoogleInteraction.SOURCE_INDEX][0][0];
        if (source !== 'Google Home') {
            throw new Error('source is not Google Home');
        }
    }
}

function extractData(data: GoogleActivityList): [GoogleInteraction[], Error[]] {
    const [interactions, errors] = GoogleInteraction.fromArray(data);

    return [
        interactions.filter(interaction => {
            return interaction.isGoogleHome;
        }),
        errors
    ];
}

/**
 * Validate Home user status and eligibility and get interaction data
 *
 * Determines whether a user can proceed with the survey,
 * returning this along with the interaction data.
 */
async function validateGoogle(): Promise<ValidationResult> {
    // Get the CSRF token if the user isn't logged out
    const csrfTok = await fetchCsrfToken();
    if (!csrfTok || csrfTok === '') {
        return {
            status: VerificationState.loggedOut,
            downloadStatus: DownloadStatus.notAttempted,
            interactions: []
        };
    }

    // Get the interaction data
    const result = await downloadAllActivity(csrfTok);

    // Extract interactions from the data
    const [interactions, extractErrors] = extractData(result.activities);
    result.interactions = interactions;
    result.errors = result.errors!.concat(extractErrors);

    return result;
}

export const Google: Device = {
    serialize: () => 'google',
    accountName: 'Google',
    loginURL: 'https://accounts.google.com/ServiceLogin',
    validate: validateGoogle
};

export { checkSignedOut, extractCsrfToken };
export {
    fetchCsrfToken,
    fetchActivityData,
    GoogleInteraction,
    processActivityData,
    fetchJsonData,
    parseActivityData,
    validateGoogle
};
