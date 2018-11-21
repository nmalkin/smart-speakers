const URL_INDEX = 24;
const TRANSCRIPT_INDEX = 9;

function checkSignedOut(text) {
    const regex = /FootprintsMyactivitySignedoutUi/;
    return text.search(regex) > -1;
}

function extractCsrfToken(text) {
    const regex = /window\.HISTORY_xsrf='(\S{44})'/;
    const token = text.match(regex)[1];
    return token;
}

async function fetchCsrfToken() {
    const response = await fetch(
        'https://myactivity.google.com/item?product=29'
    );
    const restxt = await response.text();
    if (checkSignedOut(restxt)) {
        return '';
    }
    return extractCsrfToken(restxt);
}

async function fetchJsonData(token) {
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

function tryParseJson(jsonString) {
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
    if (token === '') {
        return null;
    }
    const response = await fetchJsonData(token);
    const data = tryParseJson(response);
    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

async function fetchAudioGoogle() {
    const data = await fetchDataGoogle();
    let urls = [];
    let transcripts = [];
    if (data !== null) {
        urls = data.map(entry => entry[URL_INDEX][0]);
        transcripts = data.map(entry => entry[TRANSCRIPT_INDEX][0]);
    }
    return { urls, transcripts };
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { checkSignedOut, extractCsrfToken, fetchAudioGoogle };
}

export {
    URL_INDEX,
    TRANSCRIPT_INDEX,
    fetchCsrfToken,
    fetchJsonData,
    tryParseJson
};
