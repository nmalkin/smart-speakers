import { join } from 'path';
import * as puppeteer from 'puppeteer';

const pathToExtension = join(__dirname, '../../chrome_extension');

async function getBrowser(): Promise<puppeteer.Browser> {
    return await puppeteer.launch({
        headless: false,
        // slowMo: 100, // pause between actions
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`
        ]
    });
}

export { getBrowser };
