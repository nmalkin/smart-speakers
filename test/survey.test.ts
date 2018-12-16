import * as puppeteer from 'puppeteer';

import { getBrowser, describeOutsideCI } from './browser';
import { readFileSync } from 'fs';

const SURVEY_URL = 'https://berkeley.qualtrics.com/jfe/form/SV_7NzNJ4QmCe4uE05';

/** Default timeout for tests, in ms */
const DEFAULT_TIMEOUT = 5000;
/** How long we expect a pageload to take, in ms */
const PAGE_LOAD_INTERVAL = 1000;

/**
 * Click "Next" in the Qualtrics survey loaded into the given Puppeteer page
 * @param page the current page in the survey
 */
async function clickNext(page: puppeteer.Page) {
    await page.waitForSelector('#NextButton');
    await page.click('#NextButton');
}

const consentTextSelector = '#QID3';
const consentChoiceSelector = '#QID12-1-label';
const speakerChoiceAmazon = '#QID5-1-label';
const speakerChoiceGoogle = '#QID5-2-label';

describeOutsideCI('test in browser', () => {
    let browser: puppeteer.Browser;
    let backgroundPage: puppeteer.Page; // currently unused
    let page: puppeteer.Page;

    beforeAll(async () => {
        browser = await getBrowser();

        // Hooks for testing the extension's background page
        const targets = await browser.targets();
        const backgroundPageTarget = targets.find(
            target => target.type() === 'background_page'
        );
        if (!backgroundPageTarget) {
            throw Error(
                "Extension's background page can't be found. Did the extension fail to load?"
            );
        }
        backgroundPage = await backgroundPageTarget.page();
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.goto(SURVEY_URL);
    });

    afterEach(async () => {
        page.close();
    });

    afterAll(() => {
        browser.close();
    });

    describe('survey flow', () => {
        test(
            'the survey starts with the consent page',
            async () => {
                await page.goto(SURVEY_URL);

                expect(await page.$(consentTextSelector)).toBeTruthy();
                expect(await page.$(consentChoiceSelector)).toBeTruthy();
            },
            DEFAULT_TIMEOUT
        );

        // TODO: reenable when consent becomes required in the survey (currently skipped for easy testing)
        test.skip(
            'consent is required before proceeding',
            async () => {
                await page.waitForSelector(consentChoiceSelector);

                // Click next without providing consent
                await clickNext(page);

                await page.waitFor(PAGE_LOAD_INTERVAL);

                const consentText = await page.$(consentTextSelector);
                expect(consentText).toBeTruthy();

                expect(await page.$(consentChoiceSelector)).toBeTruthy();
            },
            DEFAULT_TIMEOUT
        );

        test(
            'selecting a speaker is required',
            async () => {
                // Provide consent
                await page.waitForSelector(consentChoiceSelector);
                await page.click(consentChoiceSelector);
                await clickNext(page);

                await page.waitForSelector(speakerChoiceAmazon);
                await page.waitForSelector(speakerChoiceGoogle);

                // Click next without selecting speaker
                await clickNext(page);

                await page.waitFor(PAGE_LOAD_INTERVAL);

                expect(await page.$(speakerChoiceAmazon)).toBeTruthy();
                expect(await page.$(speakerChoiceGoogle)).toBeTruthy();
            },
            DEFAULT_TIMEOUT
        );

        test(
            'account access notice is displayed after speaker is selected',
            async () => {
                // Provide consent
                await page.waitForSelector(consentChoiceSelector);
                await page.click(consentChoiceSelector);
                await clickNext(page);

                // Select speaker
                await page.waitForSelector(speakerChoiceGoogle);
                await page.click(speakerChoiceGoogle);

                // Enter some stuff into the other text field (optional)
                const input = '#QID18 input';
                await page.waitForSelector(input);
                await page.type(input, 'test');

                // Wait a little bit to make sure the previous action takes effect.
                // Test seems to fail without this.
                // My suspicion is that the validation after the required field has been updated needs a cycles to take effect.
                // TODO: it would be nice to wait for specific events, if there are any.
                await page.waitFor(1000);

                await clickNext(page);

                await page.waitForSelector('#QID19');
            },
            DEFAULT_TIMEOUT
        );

        test(
            'recording check page shows retry button',
            async () => {
                // Provide consent
                await page.waitForSelector(consentChoiceSelector);
                await page.click(consentChoiceSelector);
                await clickNext(page);

                // Select speaker
                await page.waitForSelector(speakerChoiceGoogle);
                await page.click(speakerChoiceGoogle);

                // Enter some stuff into the other text field (optional)
                const input = '#QID18 input';
                await page.waitForSelector(input);
                await page.type(input, 'test');

                // Wait a little bit to make sure the previous action takes effect.
                // Test seems to fail without this.
                // My suspicion is that the validation after the required field has been updated needs a cycles to take effect.
                // TODO: it would be nice to wait for specific events, if there are any.
                await page.waitFor(1000);

                await clickNext(page);

                await page.waitForSelector('#QID19');
                await page.waitFor(2000);
                await clickNext(page);
                await page.waitFor(4000);

                await page.waitForSelector('button');
            },
            100000
        );
    });
});

interface Credentials {
    username: string;
    password: string;
}

function getGoogleCredentials(): Credentials {
    try {
        const unparsedSecrets = readFileSync('SECRETS.json', 'utf8');
        const secrets = JSON.parse(unparsedSecrets);
        return secrets.google;
    } catch (e) {
        throw Error('unable to find and extract Google credentials');
    }
}

describeOutsideCI('test using Google credentials', () => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;

    beforeAll(async () => {
            browser = await getBrowser();
            const credentials = getGoogleCredentials();

            page = await browser.newPage();

            await page.goto('https://accounts.google.com/ServiceLogin');
            await page.waitForSelector('#identifierId');
            await page.type('#identifierId', credentials.username);
            await page.click('#identifierNext');
            await page.waitFor(2000); // the timeouts are necessary even with the waitForSelector calls
            await page.waitForSelector('input[type=password]');
            await page.type('input[type=password]', credentials.password);
            await page.waitFor(1000);
            await page.waitForSelector('#passwordNext');
            await page.click('#passwordNext');
            await page.waitFor(4000);
            await page.waitForSelector('.gb_cb');

            await page.close();
    }, 100000);

    beforeEach(async () => {
        page = await browser.newPage();
        // await page.goto(SURVEY_URL);
    });

    afterEach(async () => {
        await page.close();
    });

    afterAll(() => {
        browser.close();
    });

    test(
        'test for successful login',
        async () => {
            await page.goto('https://www.google.com');
            expect(await page.$('.gb_cb')).toBeTruthy();
        },
        DEFAULT_TIMEOUT
    );

    describe('survey flow', () => {
        test(
            'you get through to the first recording page',
            async () => {
                await page.goto(SURVEY_URL);

                // Provide consent
                await page.waitForSelector(consentChoiceSelector);
                await page.click(consentChoiceSelector);
                await clickNext(page);

                // Select speaker
                await page.waitForSelector(speakerChoiceGoogle);
                await page.click(speakerChoiceGoogle);

                // Enter some stuff into the other text field (optional)
                const input = '#QID18 input';
                await page.waitForSelector(input);
                await page.type(input, 'test');

                // Wait a little bit to make sure the previous action takes effect.
                // Test seems to fail without this.
                // My suspicion is that the validation after the required field has been updated needs a cycles to take effect.
                // TODO: it would be nice to wait for specific events, if there are any.
                await page.waitFor(1000);

                await clickNext(page);

                // Acknowledge the account access
                await page.waitForSelector('#QID19');
                await page.waitFor(2000);
                await clickNext(page);
                await page.waitFor(4000);

                // Recording check happens now

                await page.waitForSelector('[questionid="1_QID30"]');
                // Note: could also look for #1_QID30, but that's technically
                // not a valid selector, presumably because it starts with a number
            },
            DEFAULT_TIMEOUT * 10
        );
    });
});
