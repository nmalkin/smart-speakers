import {
    ValidationResult,
    VerificationState,
    Device,
    Interaction
} from '../../common/types';

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
 * @param token CSRF token
 */
async function fetchActivityData(token: string): Promise<string> {
    const response = await fetch(
        'https://myactivity.google.com/item?product=31&jspb=1',
        {
            method: 'POST',
            body: `{"sig":"${token}"}`
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
async function fetchJsonData(token: string): Promise<string> {
    const response = await fetchActivityData(token);
    return processActivityData(response);
}

/**
 * Try to parse Google activity into valid JSON
 * We expect it to be an array, because that's what it always looks like.
 * If it isn't, we return null.
 *
 * @param jsonString
 * @return the parsed data as an array, or null if something unexpected is given
 */
function tryParseJson(jsonString: string): string[] | null {
    try {
        const obj = JSON.parse(jsonString);
        if (Array.isArray(obj)) {
            return obj;
        }
    } catch (e) {
        return null;
    }
    return null;
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

    public static fromArray(rawJson: any[]): GoogleInteraction[] {
        if (!rawJson) {
            throw new Error('raw Google interaction data is empty');
        } else if (!Array.isArray(rawJson)) {
            throw new Error(
                'expecting raw Google interaction data to be an array of interaction items'
            );
        }

        return rawJson.map(item => {
            const interaction = new GoogleInteraction(item);
            return interaction;
        });
    }

    private json: any[];

    constructor(rawJson: any[]) {
        if (!Array.isArray(rawJson)) {
            const snippet = JSON.stringify(rawJson).slice(0, 5); // truncate for privacy
            throw new Error(
                `expected raw data for Google interaction to be an array, but it was ${snippet}...`
            );
        }
        this.json = rawJson;
    }

    get transcript() {
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

        return this.json[GoogleInteraction.TRANSCRIPT_INDEX][0];
    }

    /**
     * Return true if the interaction contains a recording URL
     */
    get recordingAvailable(): boolean {
        if (this.json.length <= GoogleInteraction.URL_INDEX) {
            return false;
        } else if (!Array.isArray(this.json[GoogleInteraction.URL_INDEX])) {
            return false;
        }

        return true;
    }

    get url() {
        if (this.json.length <= GoogleInteraction.URL_INDEX) {
            throw new Error(
                `interaction missing url at ${GoogleInteraction.URL_INDEX}`
            );
        } else if (!Array.isArray(this.json[GoogleInteraction.URL_INDEX])) {
            throw new Error('interaction missing url');
        }

        return this.json[GoogleInteraction.URL_INDEX][0];
    }

    get timestamp() {
        if (this.json.length <= GoogleInteraction.TIMESTAMP_INDEX) {
            throw new Error(
                `interaction missing timestamp at ${
                    GoogleInteraction.TIMESTAMP_INDEX
                }`
            );
        }

        return parseTimestamp(this.json[GoogleInteraction.TIMESTAMP_INDEX]);
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

function extractData(data): Interaction[] {
    if (data !== null) {
        const interactions = GoogleInteraction.fromArray(data);

        return interactions.filter(interaction => {
            return interaction.isGoogleHome;
        });
    } else {
        return [];
    }
}

function validateInteractions(interactions: Interaction[]): void {
    interactions.forEach(interaction => {
        // The purpose of this loop is to access the fields of the Interaction.
        // Because the implementation of GoogleInteraction uses getters,
        // they are lazy-evaluated, so we wouldn't know until we tried
        // accessing them whether they're valid or not.
        // We want to know that *now* rather than later,
        // so we try accessing them now.
        const { transcript, timestamp } = interaction;
    });
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
        return { status: VerificationState.loggedOut };
    }

    // Get the interaction data
    const response = await fetchJsonData(csrfTok);

    // Try to parse the interaction data
    const data = tryParseJson(response);
    if (data === null || data.length === 0) {
        return { status: VerificationState.error };
    }
    const interactions = extractData(data[0]);
    validateInteractions(interactions);

    // Check eligibility
    if (interactions.length > 0) {
        return { status: VerificationState.loggedIn, interactions };
    } else {
        return { status: VerificationState.ineligible };
    }
}

export const Google: Device = {
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
    tryParseJson,
    validateGoogle
};
