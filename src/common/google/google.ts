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

async function fetchJsonData(token: string): Promise<string> {
    const response = await fetch(
        'https://myactivity.google.com/item?product=29&jspb=1&jsv=myactivity_20181016-0717_1',
        {
            method: 'POST',
            body: `{"sig":"${token}"}`
        }
    );
    const restxt = await response.text();
    return restxt.slice(6);
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

function extractData(data): Interaction[] {
    if (data !== null) {
        return data.map(entry => {
            const url = entry[URL_INDEX][0];
            const transcript = entry[TRANSCRIPT_INDEX][0];
            const timestampString = entry[TIMESTAMP_INDEX];
            const timestamp = parseTimestamp(timestampString);

            return { url, transcript, timestamp };
        });
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
    fetchJsonData,
    tryParseJson,
    validateGoogle
};
