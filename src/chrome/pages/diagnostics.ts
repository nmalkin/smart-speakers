import {
    URL_INDEX,
    TRANSCRIPT_INDEX,
    fetchCsrfToken,
    fetchJsonData,
    tryParseJson
} from '../../common/google/google';
import {
    getCSRF,
    getCSRFPage,
    fetchTranscriptPage,
    extractAudio
} from '../../common/alexa/amazon';
import { Interaction } from '../../common/types';

const ASYNC_TIMEOUT = 5000;

enum Tests {
    all = 'all',
    google = 'google',
    amazon = 'amazon'
}

let tests: Tests;

function setupMocha() {
    document.getElementById('mocha')!.innerHTML = '';
    mocha.suite = mocha.suite.clone();
    mocha.setup({
        ui: 'bdd',
        bail: true,
        timeout: 5000
    });
    mocha.checkLeaks();

    /**
     * Diagnostic tests for Google
     */
    (tests === Tests.google ? describe.only : describe)('Google', () => {
        let token;
        let json;
        let data;
        let entries;
        let urls;
        let transcripts;

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
                entries = data[0];
            });
        });

        context('Checking URLs', () => {
            it('Check URL arrays', () => {
                entries.forEach(entry => {
                    checkArray(entry[URL_INDEX], 'URL');
                });
                urls = entries.map(entry => entry[URL_INDEX][0]);
            });

            it('Check URL strings', () => {
                urls.forEach(url => {
                    checkString(url, 'URL');
                });
            });

            it('Verify URLs', () => {
                urls.forEach(url => {
                    if (
                        url.slice(0, 49) !==
                        'https://myactivity.google.com/history/audio/play/'
                    ) {
                        throw new Error('Detected invalid URL');
                    }
                });
            });
        });

        context('Checking transcripts', () => {
            it('Check transcript arrays', () => {
                entries.forEach(entry => {
                    checkArray(entry[TRANSCRIPT_INDEX], 'transcript');
                });
                transcripts = entries.map(entry => entry[TRANSCRIPT_INDEX][0]);
            });

            it('Check transcript strings', () => {
                transcripts.forEach(transcript => {
                    checkString(transcript, 'transcript');
                });
            });

            it('Verify transcripts', () => {
                transcripts.forEach(transcript => {
                    if (transcript.length === 0) {
                        throw new Error('Detected invalid transcript');
                    }
                });
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
        let token: string | null;

        context('fetching the CSRF token', async () => {
            it('should get the CSRF page without errors', async () => {
                await getCSRFPage();
            });

            it('should parse the token without throwing errors', async () => {
                token = await getCSRF();
            });

            it('the user is expected to be signed in', () => {
                if (token === null) {
                    /* TODO: Make these different checks. */
                    throw new Error(
                        'Detected user signed out or token missing'
                    );
                }
            });
        });

        context('fetching Audio Recordings', async () => {
            let page: string | null;

            it('fetches the activity page without errors', async () => {
                if (token) {
                    page = await fetchTranscriptPage(token);
                }
            });

            it('should not report that CSRF validation failed', () => {
                if (
                    page ===
                    '{"ERROR":"{\\"success\\":false,\\"error\\":\\"CSRF_VALIDATION_FAILED\\"}"}'
                ) {
                    throw new Error('Amazon says CSRF validation failed');
                }
            });

            it('should extract audio without throwing errors', () => {
                if (page !== null) {
                    extractAudio(page);
                }
            });

            it('expects to extract at least one interaction ', () => {
                let interactions: Interaction[] = [];
                if (page !== null) {
                    interactions = extractAudio(page);
                }

                if (interactions.length === 0) {
                    throw new Error(
                        "didn't extract a single interaction from the activity page"
                    );
                }
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
