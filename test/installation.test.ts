import { getBrowser } from './browser';

test('the extension can be installed', async () => {
    const browser = await getBrowser();
    expect(browser).toBeTruthy();
    await browser.close();
}, 3000);
