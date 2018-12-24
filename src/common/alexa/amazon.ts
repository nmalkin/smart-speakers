import {
    ValidationResult,
    VerificationState,
    Interaction,
    Device
} from '../../common/types';

const csrfReg = /csrfToken = "(.*)"/g;
const expReg = /<audio id="audio-(.*)"> <source[\w\W]*?(?:<div class="summaryCss">|<div class="summaryNotAvailableCss">)\s*(.*?)\s*<\/div/g;

/**
 * Extract CSRF token from page contents
 *
 * @param pageText the raw HTML of a page with the CSRF token
 */
function matchCSRF(pageText: string): string | null {
    const match = pageText.match(csrfReg);
    if (match == null) {
        return null;
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

/**
 * Given a match object returned by expReg, extracts the resulting interaction
 *
 * @see expReg
 */
function getInteractionFromMatch(match: RegExpMatchArray): Interaction | null {
    if (match.length < 3) {
        return null;
    }

    const audioID = match[1];
    if (validAudioID(audioID)) {
        const transcript = match[2];
        const url = `https://www.amazon.com/hz/mycd/playOption?id=${audioID}`;
        return { url, transcript };
    } else {
        return null;
    }
}

/**
 * Extract interaction data from page HTML
 *
 * @param pageText the raw HTML of the page
 * @returns an object with keys as the URL and transcripts as value, or an empty object if those could not be found
 */
export function extractAudio(pageText: string): Interaction[] {
    const interactions: Interaction[] = [];
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
async function getCSRF(): Promise<string | null> {
    try {
        const text = await getCSRFPage();
        return matchCSRF(text);
    } catch (err) {
        console.log(err);
        return null;
    }
}

/**
 * Get the page with activity data and return its contents
 * @param token the CSRF token to use in the request
 */
async function fetchTranscriptPage(token: string): Promise<string> {
    const response = await fetch(
        'https://www.amazon.com/hz/mycd/alexa/activityTranscripts',
        {
            method: 'POST',
            body: `csrfToken=${token}&rangeType=custom&startDate=000000000000&endDate=9999999999999&batchSize=999999&shouldParseStartDate=false&shouldParseEndDate=false`,
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
 * Get the page with activity data and return the parsed interaction data
 * @param tok the CSRF token to use in the request
 */
async function getAudio(tok: string): Promise<Interaction[] | null> {
    const text = await fetchTranscriptPage(tok);
    if (
        text !==
        '{"ERROR":"{\\"success\\":false,\\"error\\":\\"CSRF_VALIDATION_FAILED\\"}"}'
    ) {
        return extractAudio(text);
    }
    return null;
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
    if (csrfTok === null) {
        return { status: VerificationState.error };
    }

    const interactions = await getAudio(csrfTok);
    if (interactions === null) {
        return { status: VerificationState.error };
    }

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
