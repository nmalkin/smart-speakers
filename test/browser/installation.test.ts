import { getBrowser } from './browser';
import { exec } from 'child_process';

/**
 * Run the given command asynchronously using node's child_process.exec
 *
 * @param command the command to run
 * @returns a promise that resolves when the command completes
 */
async function execAsync(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                console.log(`stderr: ${stderr}`);
                reject(error);
            }
            resolve();
        });
    });
}

describe('test installation', () => {
    beforeAll(async () => {
        await execAsync('npm run build');
    }, 10000);

    test('the extension can be installed', async () => {
        const browser = await getBrowser();
        expect(browser).toBeTruthy();
        await browser.close();
    }, 15000);
});
