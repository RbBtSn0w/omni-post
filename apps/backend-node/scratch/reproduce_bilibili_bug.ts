import { chromium } from 'playwright';
import { BilibiliUploader } from '../src/uploader/bilibili/main.js';

async function reproduce() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Mocking the behavior of getPublishButtonState
    // This is a simplified version of what would fail
    try {
        await page.evaluate(() => {
            // @ts-ignore
            console.log(BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT);
        });
        console.log('✅ Fix verified: No ReferenceError');
    } catch (e: any) {
        if (e.message.includes('ReferenceError')) {
            console.error('❌ Bug reproduced: ReferenceError');
        } else {
            console.error('❌ Unexpected error:', e.message);
        }
    } finally {
        await browser.close();
    }
}

reproduce();
