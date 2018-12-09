import { join } from 'path';
import * as puppeteer from 'puppeteer';

const pathToExtension = join(__dirname, '../chrome_extension');
console.log(pathToExtension);

test('the extension can be installed', async () => {
    const options = {
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`
        ]
    };
    const browser = await puppeteer.launch(options);
    expect(browser).toBeTruthy();
    await browser.close();
}, 3000);
