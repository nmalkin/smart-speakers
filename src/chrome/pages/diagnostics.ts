import {
    URL_INDEX,
    TRANSCRIPT_INDEX,
    fetchCsrfToken,
    fetchJsonData,
    tryParseJson
} from '../../common/google/google';
import { getCSRF, getAudio } from '../../common/alexa/amazon';

const ASYNC_TIMEOUT = 5000;

enum Tests {
    all = 'all',
    google = 'google',
    amazon = 'amazon'
}

let tests;

function setupMocha() {
    document.getElementById('mocha')!.innerHTML = '';
    mocha.suite = mocha.suite.clone();
    mocha.setup({
        ui: 'bdd',
        bail: true
    });
    mocha.checkLeaks();

    /**
     * Diagnostic tests for Google
     */
    (tests === Tests.google ? describe.only : describe)('Google', () => {
        let token;
        let json;
        let data;
        let entry;
        let url;
        let transcript;

        function checkArray(arr: any, name: string) {
            if (arr === null) {
                throw new Error(`Detected no ${name}`);
            }
            if (!Array.isArray(arr)) {
                throw new Error(`Detected ${name} was not stored in array`);
            }
            if (arr.length === 0) {
                throw new Error(`Detected empty ${name} array`);
            }
        }

        function checkString(str: any, name: string) {
            if (str === null) {
                throw new Error(`Detected null ${name}`);
            }
            if (typeof str !== 'string') {
                throw new Error(`Detected ${name} was not a string`);
            }
        }

        context('Fetching CSRF token', async () => {
            before('Fetch CSRF token', async function() {
                this.timeout(ASYNC_TIMEOUT);
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
            before('Fetch JSON data', async function() {
                this.timeout(ASYNC_TIMEOUT);
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

        context('Concluding Google tests', () => {
            it('All tests passed!', () => {
                // pass
            });
        });
    });

    /**
     * Diagnostic tests for Amazon recording fetch flow.
     */
    (tests === Tests.amazon ? describe.only : describe)('Amazon', () => {
        let token;

        context('fetching the CSRF token', async () => {
            before(async () => {
                token = await getCSRF();
            });

            it('user is signed in', () => {
                if (token === null) {
                    /* TODO: Make these different checks. */
                    throw new Error(
                        'Detected user signed out or token missing'
                    );
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
}

function setupDiagnostics() {
    document.getElementById('test')!.onclick = () => {
        tests = Tests.all;
        setupMocha();
        mocha.run();
    };
    document.getElementById('google')!.onclick = () => {
        tests = Tests.google;
        setupMocha();
        mocha.run();
    };
    document.getElementById('amazon')!.onclick = () => {
        tests = Tests.amazon;
        setupMocha();
        mocha.run();
    };
}

setupDiagnostics();

export { setupDiagnostics };
