const ENTRY_INDEX = 65;
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

function fetchCsrfToken() {
    return fetch('https://myactivity.google.com/item?product=29').then(
        async response => {
            const restxt = await response.text();
            if (checkSignedOut(restxt)) {
                return '';
            }
            return extractCsrfToken(restxt);
        }
    );
}

function fetchJsonData(token) {
    return fetch(
        'https://myactivity.google.com/item?product=29&jspb=1&jsv=myactivity_20181016-0717_1',
        {
            method: 'POST',
            body: `{"sig":"${token}"}`
        }
    ).then(async response => {
        const restxt = await response.text();
        return restxt.slice(6);
    });
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

async function fetchAudioGoogle() {
    const token = await fetchCsrfToken();
    if (token === '') {
        return null;
    }
    return fetchJsonData(token).then(response => {
        const data = tryParseJson(response);
        if (data.length > 0) {
            return data[0];
        }
        return null;
    });
}

function checkArray(data, name) {
    if (data === null) {
        throw new Error(`Detected no ${name}`);
    }
    if (!Array.isArray(data)) {
        throw new Error(`Detected ${name} was not stored in array`);
    }
    if (data.length === 0) {
        throw new Error(`Detected empty ${name} array`);
    }
}

function checkString(data, name) {
    if (data === null) {
        throw new Error(`Detected null ${name}`);
    }
    if (typeof data !== 'string') {
        throw new Error(`Detected ${name} was not a string`);
    }
}

async function testInBrowser() {
    let result = 'Test passed!';
    try {
        const token = await fetchCsrfToken();
        if (token === '') {
            throw new Error('Detected user signed out');
        }
        if (token === null) {
            throw new Error(
                "Response didn't match either signed out or CSRF token regex"
            );
        }
        const json = await fetchJsonData(token);
        if (json === '[]') {
            throw new Error('CSRF token failed');
        }
        const data = tryParseJson(json);
        console.log(data);
        if (data === null) {
            throw new Error('Sliced response text was not valid JSON array');
        }
        if (data.length === 0) {
            throw new Error('Detected empty response array');
        }
        checkArray(data[0], 'activity');
        const entry = data[0][ENTRY_INDEX];
        checkArray(entry[URL_INDEX], 'URL');
        const url = entry[URL_INDEX][0];
        checkString(url, 'URL');
        if (url.slice(-16) !== '1534466983744010') {
            throw new Error('Audio ID did not match');
        }
        checkArray(entry[TRANSCRIPT_INDEX], 'transcript');
        const transcript = entry[TRANSCRIPT_INDEX][0];
        checkString(transcript, 'transcript');
        if (transcript !== 'do you want to read my proposal') {
            throw new Error('Transcript did not match');
        }
    } catch (e) {
        result = e;
    }
    document.getElementById('result').innerHTML = result;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { checkSignedOut, extractCsrfToken, fetchAudioGoogle };
} else if (document.getElementById('testSmartSpeakers') != null) {
    document.getElementById('google').onclick = testInBrowser;
}
