import {
    ValidationResult,
    VerificationState,
    Interaction
} from '../../common/types';

const csrfReg = /csrfToken = "(.*)"/g;
const expReg = /<audio id="audio-(.*)"> <source[\w\W]*?<div class="summaryCss">\s*(.*?)\s*<\/div/g;

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
 * Extract interaction data from page HTML
 *
 * @deprecated TODO: use extractAudio instead
 *
 * @param pageText the raw HTML of the page
 * @returns an object with keys as the URL and transcripts as value, or an empty object if those could not be found
 */
function matchAudio(pageText: string): object {
    const dict = {};
    const interactions = extractAudio(pageText);
    interactions.forEach(interaction => {
        dict[interaction.url] = interaction.transcript;
    });
    return dict;
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
async function getAudio(tok: string): Promise<object | null> {
    const text = await fetchTranscriptPage(tok);
    if (
        text !==
        '{"ERROR":"{\\"success\\":false,\\"error\\":\\"CSRF_VALIDATION_FAILED\\"}"}'
    ) {
        return matchAudio(text);
    }
    return null;
}

/**
 * Validate Echo user status and eligibility
 *
 * Determines whether a user can proceed with the survey
 */
async function validateAmazon(): Promise<ValidationResult> {
    const csrfTok = await getCSRF();
    if (csrfTok === null) {
        return { status: VerificationState.loggedOut };
    }
    const dict = await getAudio(csrfTok);
    if (dict === null) {
        return { status: VerificationState.error };
    }
    const urls = Object.keys(dict);
    const transcripts = Object.values(dict) as string[];
    if (urls.length > 10) {
        return {
            status: VerificationState.loggedIn,
            urls,
            transcripts
        };
    } else {
        return { status: VerificationState.ineligible };
    }
}

export {
    validAudioID,
    getInteractionFromMatch,
    getCSRF,
    getCSRFPage,
    matchCSRF,
    fetchTranscriptPage,
    matchAudio,
    validateAmazon
};
