import {
    URL_INDEX,
    TRANSCRIPT_INDEX,
    fetchCsrfToken,
    fetchJsonData,
    tryParseJson
} from '../../common/google/google';
import * as google from '../../common/google/google';
import {
    getCSRF,
    getCSRFPage,
    fetchTranscriptPage,
    extractAudio
} from '../../common/alexa/amazon';
import * as amazon from '../../common/alexa/amazon';
import { Interaction } from '../../common/types';
import { initErrorHandling } from '../common/errors';

enum Tests {
    google = 'google',
    amazon = 'amazon'
}

let tests: Tests;
let runner: Mocha.Runner;

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
                    runner.abort();
                    document.getElementById('mocha')!.innerHTML =
                        'Please sign in to your Google account and try again.';
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

        context('Checking timestamps', () => {
            let timestamps: string[];
            it('Check timestamp arrays', () => {
                entries.forEach(entry => {
                    if (entry.length <= google.TIMESTAMP_INDEX) {
                        throw new Error('timestamp missing from data entry');
                    }
                });
                timestamps = entries.map(
                    entry => entry[google.TIMESTAMP_INDEX]
                );
            });

            it('Check timestamp strings', () => {
                timestamps.forEach(timestamp => {
                    checkString(timestamp, 'timestamp');
                });
            });

            it('Check that timestamps are numeric', () => {
                timestamps.forEach(timestamp => {
                    const parsedTimestamp = parseInt(timestamp, 10);
                    if (Number.isNaN(parsedTimestamp)) {
                        throw new Error(
                            `timestamp is not a number: ${timestamp}`
                        );
                    }
                });
            });

            it('Check that timestamps look like real dates', () => {
                timestamps.forEach(timestamp => {
                    const parsedTimestamp = parseInt(timestamp, 10);
                    const inMilliseconds = parsedTimestamp / 1000;
                    const asDate = new Date(inMilliseconds);
                    const year = asDate.getFullYear();
                    if (year < 2012 || year > 2019) {
                        throw new Error(
                            `timestamp ${timestamp} looks like an invalid date`
                        );
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

        context('checking login status', async () => {
            it('checking for being logged out', async () => {
                const loggedIn: boolean = await amazon.isLoggedIn();
                if (!loggedIn) {
                    runner.abort();
                    document.getElementById('mocha')!.innerHTML =
                        'According to our test, you are signed out of your Amazon account. ' +
                        'Please sign in and try again.';
                }
            });

            it('checking for password re-entry', async () => {
                const upgradeRequired: boolean = await amazon.requiresPasswordUpgrade();
                if (upgradeRequired) {
                    runner.abort();
                    document.getElementById('mocha')!.innerHTML =
                        'Amazon requires you to re-enter your password. ' +
                        `Please <a href="${
                            amazon.Alexa.loginURL
                        }" target="_blank">visit this page</a> ` +
                        'then re-run these tests.';
                }
            });
        });
        context('fetching the CSRF token', async () => {
            it('should get the CSRF page without errors', async () => {
                await getCSRFPage();
            });

            it('should parse the token without throwing errors', async () => {
                token = await getCSRF();
            });

            it('should be able to find the CSRF token in the page', () => {
                if (token === null) {
                    throw new Error('CSRF token missing from activity page');
                    // This also happens when the user is signed out
                    // or needs to reenter their password,
                    // but we have a separate test for that which executes earlier.
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

            it('expects to extract at least one interaction', () => {
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

            it('finds reasonable timestamps for interactions', () => {
                let interactions: Interaction[] = [];
                if (page !== null) {
                    interactions = extractAudio(page);
                }

                interactions.forEach(interaction => {
                    const asDate = new Date(interaction.timestamp);
                    const year = asDate.getFullYear();
                    if (year < 2012 || year > 2019) {
                        throw new Error(
                            `timestamp ${
                                interaction.timestamp
                            } looks like an invalid date`
                        );
                    }
                });
            });
        });

        context('finished Amazon tests', () => {
            it('All tests passed!', done => {
                done();
            });
        });
    });
}

/**
 * Confirm login status before running the given tests
 */
function runTests(testSuite: Tests) {
    tests = testSuite;
    setupMocha();
    runner = mocha.run();
}

function setupDiagnostics() {
    document.getElementById('google')!.onclick = () => {
        runTests(Tests.google);
    };
    document.getElementById('amazon')!.onclick = () => {
        runTests(Tests.amazon);
    };
}

initErrorHandling();

setupDiagnostics();

export { setupDiagnostics };
