import { chromium } from 'playwright';
import { BilibiliUploader } from '../src/uploader/bilibili/main.js';

async function verifyEvaluateArgumentPassing() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Verification: values needed inside a browser evaluate callback must be
    // passed as arguments from Node.js scope — not read directly from Node classes.
    // This confirms the fix pattern: capture the limit in Node.js and pass it
    // into the browser context as an argument (matching how getPublishButtonState works).
    const diagnosticTextLimit = BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT;
    try {
        await page.evaluate((limit) => {
            console.log(limit);
        }, diagnosticTextLimit);
        console.log('✅ Verified: evaluate argument passing works correctly');
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('ReferenceError')) {
            console.error('❌ ReferenceError detected: Node.js class accessed inside browser context');
        } else {
            console.error('❌ Unexpected error:', msg);
        }
    } finally {
        await browser.close();
    }
}

verifyEvaluateArgumentPassing();
