import {
    URL_INDEX,
    TRANSCRIPT_INDEX,
    fetchCsrfToken,
    fetchJsonData,
    tryParseJson
} from '../../common/google/google';

const ENTRY_INDEX = 65;

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

document.getElementById('google').onclick = testInBrowser;
