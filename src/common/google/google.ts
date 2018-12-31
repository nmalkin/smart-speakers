import {
    ValidationResult,
    VerificationState,
    Device,
    Interaction
} from '../../common/types';

const URL_INDEX = 24;
const TRANSCRIPT_INDEX = 9;
const TIMESTAMP_INDEX = 4;

function checkSignedOut(text: string) {
    const regex = /FootprintsMyactivitySignedoutUi/;
    return text.search(regex) > -1;
}

function extractCsrfToken(text: string): string | null {
    const regex = /window\.HISTORY_xsrf='(\S{44})'/;
    const match = text.match(regex);
    const token = match ? match[1] : null;
    return token;
}

async function fetchCsrfToken(): Promise<string | null> {
    const response = await fetch(
        'https://myactivity.google.com/item?product=29'
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
        'https://myactivity.google.com/item?product=29&jspb=1',
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

async function fetchDataGoogle() {
    const token = await fetchCsrfToken();
    if (token === null || token === '') {
        return null;
    }
    const response = await fetchJsonData(token);
    const data = tryParseJson(response);
    if (data && data.length > 0) {
        return data[0];
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
    public static TRANSCRIPT_INDEX = TRANSCRIPT_INDEX;
    public static URL_INDEX = URL_INDEX;
    public static TIMESTAMP_INDEX = TIMESTAMP_INDEX;

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
}

function extractData(data): Interaction[] {
    if (data !== null) {
        return GoogleInteraction.fromArray(data);
    } else {
        return [];
    }
}

async function fetchAudioGoogle() {
    const data = await fetchDataGoogle();
    return extractData(data);
}

/**
 * Validate Home user status and eligibility
 *
 * Determines whether a user can proceed with the survey
 */
async function validateGoogle(): Promise<ValidationResult> {
    const csrfTok = await fetchCsrfToken();
    if (!csrfTok || csrfTok === '') {
        return { status: VerificationState.loggedOut };
    }
    const response = await fetchJsonData(csrfTok);
    const data = tryParseJson(response);
    if (data === null || data.length === 0) {
        return { status: VerificationState.error };
    }
    const interactions = extractData(data[0]);
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

export { checkSignedOut, extractCsrfToken, fetchAudioGoogle };
export {
    URL_INDEX,
    TRANSCRIPT_INDEX,
    TIMESTAMP_INDEX,
    fetchCsrfToken,
    fetchActivityData,
    processActivityData,
    fetchJsonData,
    tryParseJson,
    validateGoogle
};
