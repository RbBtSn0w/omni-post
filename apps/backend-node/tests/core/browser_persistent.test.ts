import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';
// We'll implement launchPersistentContext in T011, but for testing we can use standard playwright
// or wait until T011 is done. Let's write the test based on what we WANT.

describe('Browser Persistent Context', () => {
  const testUserDataDir = path.join(process.cwd(), 'tests', 'fixtures', 'user-data');

  beforeAll(() => {
    if (!fs.existsSync(testUserDataDir)) {
      fs.mkdirSync(testUserDataDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup if needed
    // fs.rmSync(testUserDataDir, { recursive: true, force: true });
  });

  it('should launch a persistent context and save data', async () => {
    const expires = Math.floor(Date.now() / 1000) + 60 * 60;
    const context = await chromium.launchPersistentContext(testUserDataDir, {
      headless: true,
    });

    // Use cookie persistence instead of localStorage on about:blank.
    // about:blank has opaque origin and can trigger SecurityError in newer Chromium.
    await context.addCookies([
      {
        name: 'test-key',
        value: 'test-value',
        url: 'https://example.com',
        expires,
      },
    ]);

    await context.close();

    // Re-launch and check if data persists
    const context2 = await chromium.launchPersistentContext(testUserDataDir, {
      headless: true,
    });

    const cookies = await context2.cookies('https://example.com');
    const persisted = cookies.find((cookie) => cookie.name === 'test-key');
    const value = persisted?.value ?? null;

    expect(value).toBe('test-value');
    await context2.close();
  }, 30000);
});
