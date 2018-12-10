import { join } from 'path';
import * as puppeteer from 'puppeteer';

const pathToExtension = join(__dirname, '../chrome_extension');

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

/**
 * Return true if the process is running inside a known CI environment
 *
 * While more comprehensive solutions exist, in our case, we'll only check for
 * the CI we know will be running with this repo.
 */
function runningInCI(): boolean {
    return 'GITHUB_WORKFLOW' in process.env;
}

/**
 * A Jest test that is skipped if the process is in CI
 *
 * @param args the standard arguments to the Jest test
 */
const testOutsideCI = (...args): void => {
    if (runningInCI()) {
        (test.skip as any)(...args);
        // "as any" is required to make the typechecker happy
        // see https://github.com/Microsoft/TypeScript/issues/5296
    } else {
        (test as any)(...args);
    }
};

/**
 * A Jest test that is skipped if the process is in CI
 *
 * @param args the standard arguments to the Jest test
 */
const describeOutsideCI = (...args): void => {
    if (runningInCI()) {
        (describe.skip as any)(...args);
    } else {
        (describe as any)(...args);
    }
};

export { getBrowser, describeOutsideCI, testOutsideCI };
