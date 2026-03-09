import fs from 'fs';
import path from 'path';
import { launchBrowser, setInitScript } from './src/core/browser.js';

(async () => {
  const browser = await launchBrowser(true);
  const cookiePath = path.join('/Users/snow/Documents/GitHub/omni-post', 'apps/backend-node/data/cookies/1bce8df0-1a30-11f1-8213-05a054fcf792.json');
  const context = await setInitScript(await browser.newContext({ storageState: cookiePath, viewport: { width: 1920, height: 1080 } }));
  const page = await context.newPage();

  console.log('Navigating to Bilibili upload page...');
  await page.goto('https://member.bilibili.com/platform/upload/video/frame', { waitUntil: 'domcontentloaded' });

  console.log('Uploading video...');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(path.join('/Users/snow/Documents/GitHub/omni-post', 'apps/backend-node/data/videos/real_video.mp4'));

  console.log('Page loaded. Wait a bit for form...');
  await page.waitForTimeout(8000);

  console.log('Checking for submit buttons or labels...');
  // Find all elements that contain text "投稿" or "发布" or "提交" and are buttons or divs
  const candidates = await page.locator(':text-matches("投稿|发布|提交")').all();
  for (const c of candidates) {
    try {
      if (await c.isVisible()) {
        const tName = await c.evaluate(n => n.tagName);
        const tClass = await c.evaluate(n => n.className);
        const tText = await c.innerText();
        console.log(`[${tName}] class="${tClass}": ${tText.replace(/\n/g, ' ')}`);
      }
    } catch (e) { }
  }

  // Also specifically check the submit container class that we expect
  const submitContainer = await page.locator('.submit-container, .submit-btn, .submit-add, .form-submit, [class*="submit"]').all();
  console.log(`Found ${submitContainer.length} submit container elements.`);
  for (const el of submitContainer) {
    if (await el.isVisible()) {
      const tClass = await el.evaluate(n => n.className);
      const tText = await el.innerText();
      console.log(`[SubmitElement] class="${tClass}": ${tText.replace(/\n/g, ' ')}`);
    }
  }

  const html = await page.content();
  fs.writeFileSync('/tmp/bilibili_dom.html', html);
  console.log('Saved dom to /tmp/bilibili_dom.html');

  await browser.close();
})();
