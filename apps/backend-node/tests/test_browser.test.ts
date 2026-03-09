import type { Browser, BrowserContext } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { launchBrowser, setInitScript } from '../src/core/browser.js';

/**
 * T046: stealth.min.js injection implicit assertion.
 * Per FR-013 clarification (Session 2026-03-08): "default trust" —
 * as long as stealth.min.js is successfully injected into the Playwright
 * context and does not crash, no dedicated anti-fingerprint tests are needed.
 */
describe('Browser Stealth Test', () => {
    let browser: Browser;
    let context: BrowserContext;

    beforeAll(async () => {
        // launchBrowser returns Browser directly
        browser = await launchBrowser(true);
        context = await browser.newContext();
        // Apply stealth script — this is the critical injection under test
        await setInitScript(context);
    }, 30000);

    afterAll(async () => {
        if (context) await context.close();
        if (browser) await browser.close();
    });

    it('should inject stealth.min.js without crashing and mask webdriver flag', async () => {
        const page = await context.newPage();

        // Navigate to a blank page to verify injection runs
        await page.goto('about:blank');

        // In a normal automated browser, navigator.webdriver is true.
        // With stealth.min.js injected, it should be undefined or false.
        const isWebdriver = await page.evaluate(() => (navigator as any).webdriver);
        expect(isWebdriver).not.toBe(true);

        await page.close();
    }, 15000);
});
