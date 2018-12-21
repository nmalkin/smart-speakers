import {
    URL_INDEX,
    TRANSCRIPT_INDEX,
    fetchCsrfToken,
    fetchJsonData,
    tryParseJson
} from '../../common/google/google';
import { getCSRF, getAudio } from '../../common/alexa/amazon';

function _checkArray(data: any, name: string) {
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

function _checkString(data: any, name: string) {
    if (data === null) {
        throw new Error(`Detected null ${name}`);
    }
    if (typeof data !== 'string') {
        throw new Error(`Detected ${name} was not a string`);
    }
}

async function testInBrowser() {
    document.getElementById('result')!.innerHTML = '';

    let result = 'Test passed!';
    try {
        const token = await fetchCsrfToken();
        if (token === null) {
            throw new Error(
                "Response didn't match either signed out or CSRF token regex"
            );
        }
        if (token === '') {
            throw new Error('Detected user signed out');
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

        _checkArray(data[0], 'activity');
        const entry = data[0][data[0].length - 1];

        _checkArray(entry[URL_INDEX], 'URL');
        const url = entry[URL_INDEX][0];
        _checkString(url, 'URL');
        if (url.slice(-16) !== '1534466983744010') {
            throw new Error('Audio ID did not match');
        }

        _checkArray(entry[TRANSCRIPT_INDEX], 'transcript');
        const transcript = entry[TRANSCRIPT_INDEX][0];
        _checkString(transcript, 'transcript');
        if (transcript !== 'do you want to read my proposal') {
            throw new Error('Transcript did not match');
        }
    } catch (e) {
        result = e;
    }

    document.getElementById('result')!.innerHTML = result;
}

document.getElementById('google')!.onclick = testInBrowser;

export { testInBrowser };

// Test using Mocha

mocha.setup({
    ui: 'bdd',
    bail: true
});

describe('Google', () => {
    let token;
    let json;
    let data;
    let entry;
    let url;
    let transcript;

    function checkArray(arr: any, name: string) {
        it(`Structure containing ${name} is not null`, () => {
            if (arr === null) {
                throw new Error(`Detected no ${name}`);
            }
        });

        it(`Structure containing ${name} is an array`, () => {
            if (!Array.isArray(arr)) {
                throw new Error(`Detected ${name} was not stored in array`);
            }
        });

        it(`Structure containing ${name} is not empty`, () => {
            if (arr.length === 0) {
                throw new Error(`Detected empty ${name} array`);
            }
        });
    }

    function checkString(str: any, name: string) {
        it(`Structure containing ${name} is not null`, () => {
            if (str === null) {
                throw new Error(`Detected null ${name}`);
            }
        });

        it(`String containing ${name} is a string`, () => {
            if (typeof str !== 'string') {
                throw new Error(`Detected ${name} was not a string`);
            }
        });
    }

    context('Fetching CSRF token', async () => {
        before('Fetch CSRF token', async () => {
            token = await fetchCsrfToken();
        });

        it('Response matches regex', () => {
            if (token === null) {
                throw new Error(
                    "Response didn't match either signed out or CSRF token regex"
                );
            }
        });

        it('User is signed in', () => {
            if (token === '') {
                throw new Error('Detected user signed out');
            }
        });
    });

    context('Fetching JSON data', async () => {
        before('Fetch JSON data', async () => {
            json = await fetchJsonData(token);
        });

        it('CSRF token is valid', () => {
            if (json === '[]') {
                throw new Error('CSRF token failed');
            }
        });
    });

    context('Parsing JSON data', () => {
        before('Parse JSON data', () => {
            data = tryParseJson(json);
        });

        it('Data is valid JSON array', () => {
            if (data === null) {
                throw new Error(
                    'Sliced response text was not valid JSON array'
                );
            }
        });

        it('Data is not empty', () => {
            if (data.length === 0) {
                throw new Error('Detected empty response array');
            }
        });
    });

    context('Checking data array', () => {
        it('Check data array', () => {
            checkArray(data[0], 'activity');
            entry = data[0][data[0].length - 1];
        });
    });

    context('Checking URL', () => {
        it('Check URL array', () => {
            checkArray(entry[URL_INDEX], 'URL');
            url = entry[URL_INDEX][0];
        });

        it('Check URL string', () => {
            checkString(url, 'URL');
        });

        it('Verify URL', () => {
            if (url.slice(-16) !== '1534466983744010') {
                throw new Error('Audio ID did not match');
            }
        });
    });

    context('Checking transcript', () => {
        it('Check transcript array', () => {
            checkArray(entry[TRANSCRIPT_INDEX], 'transcript');
            transcript = entry[TRANSCRIPT_INDEX][0];
        });

        it('Check transcript string', () => {
            checkString(transcript, 'transcript');
        });

        it('Verify transcript', () => {
            if (transcript !== 'do you want to read my proposal') {
                throw new Error('Transcript did not match');
            }
        });
    });
});

/*
    Diagnostic test for Amazon recording fetch flow.
*/

describe('Amazon', () => {
    let token;

    context('fetching the CSRF token', async () => {
        before(async () => {
            token = await getCSRF();
        });

        it('user is signed in', () => {
            if (token === null) {
                /* TODO: Make these different checks. */
                throw new Error('Detected user signed out or token missing');
            }
        });
    });

    context('fetching Audio Recordings', async () => {
        let interactions;
        before(async () => {
            interactions = await getAudio(token);
        });

        it('the CSRF token should work', () => {
            if (interactions === null) {
                throw new Error('CSRF token failed');
            }
            /* Not sure if this should be a diagnostic error or not */
            // if (Object.keys(interactions).length === 0) {
            //     throw new Error('Failed to retrieve recordings');
            // }
        });
    });
});

mocha.checkLeaks();
document.getElementById('test')!.onclick = () => {
    document.getElementById('mocha')!.innerHTML = '';
    mocha.run();
};
