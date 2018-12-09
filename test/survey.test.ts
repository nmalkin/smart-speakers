import * as puppeteer from 'puppeteer';

import { getBrowser } from './browser';

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
    await page.click('#NextButton');
}

describe('test in browser', () => {
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
        const consentTextSelector = '#QID3';
        const consentChoiceSelector = '#QID12-1-label';
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

        const speakerChoiceAmazon = '#QID5-1-label';
        const speakerChoiceGoogle = '#QID5-2-label';

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
    });
});
