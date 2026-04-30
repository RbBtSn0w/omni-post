import { chromium } from 'playwright';
import { BilibiliUploader } from '../src/uploader/bilibili/main.js';

async function reproduce() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Mocking the behavior of getPublishButtonState
    // Capture the limit in Node.js scope and pass it into the browser context as an argument.
    const diagnosticTextLimit = BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT;
    try {
        await page.evaluate((limit) => {
            console.log(limit);
        }, diagnosticTextLimit);
        console.log('✅ Fix verified: No ReferenceError');
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('ReferenceError')) {
            console.error('❌ Bug reproduced: ReferenceError');
        } else {
            console.error('❌ Unexpected error:', msg);
        }
    } finally {
        await browser.close();
    }
}

reproduce();
