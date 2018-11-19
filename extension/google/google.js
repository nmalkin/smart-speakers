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

async function testInBrowser() {
    let result = 'Test passed!';
    try {
        const token = await fetchCsrfToken();
        if (token === '') {
            throw new Error('Detected signed out');
        }
        if (token === null) {
            throw new Error(
                "Didn't match either signed out or CSRF token regex"
            );
        }
        const json = await fetchJsonData(token);
        if (json === '[]') {
            throw new Error('CSRF token failed');
        }
        const data = tryParseJson(json);
        if (data === null) {
            throw new Error('Sliced response text was not JSON-parsable');
        }
        if (data.length === 0) {
            throw new Error(
                'Data was not encapsulated in single array element'
            );
        }
        if (!Array.isArray(data[0])) {
            throw new Error('Recordings were not stored in array');
        }
        if (data[0].length === 0) {
            throw new Error('Detected no recordings');
        }
        const entry = data[0][65];
        if (!Array.isArray(entry[24])) {
            throw new Error('URL was not stored in array');
        }
        if (entry[24].length === 0) {
            throw new Error('Did not detect URL');
        }
        const url = entry[24][0];
        if (url.slice(-16) !== '1534466983744010') {
            throw new Error('Audio ID did not match');
        }
        if (!Array.isArray(entry[9])) {
            throw new Error('Transcript was not stored in array');
        }
        if (entry[9].length === 0) {
            throw new Error('Did not detect transcript');
        }
        const transcript = entry[9][0];
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
    document.getElementById('google').onclick = testInBrowser();
}
