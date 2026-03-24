import { chromium } from 'playwright';
import { logger } from '../core/logger.js';

class ExplorerService {
  /**
   * Validate URL for safety (SSRF protection).
   */
  private validateUrl(url: string) {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol. Only http/https are allowed.');
    }
    const hostname = urlObj.hostname.toLowerCase();
    const privateIps = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|100\.6[4-9]\.|100\.7[0-9]\.)/;
    if (privateIps.test(hostname) || hostname === 'localhost' || hostname === '::1') {
      throw new Error('Private network access is restricted for security.');
    }
    return urlObj;
  }

  /**
   * Explore a URL to identify interaction points.
   */
  async explore(url: string): Promise<any> {
    const urlObj = this.validateUrl(url);
    
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      logger.info(`[Explorer] Probing URL: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Inject probe script
      const analysis = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        const results: any = {
          inputs: [],
          buttons: [],
          potentialApis: []
        };

        // Find inputs
        const inputs = doc.querySelectorAll('input, textarea');
        inputs.forEach((el: any) => {
          results.inputs.push({
            id: el.id,
            name: el.name,
            placeholder: el.placeholder,
            type: el.type,
            label: el.labels?.[0]?.innerText || ''
          });
        });

        // Find buttons and interactive roles
        const buttons = doc.querySelectorAll('button, [role="button"], [role="link"]');
        buttons.forEach((btn: any) => {
          results.buttons.push({
            text: btn.innerText,
            classes: btn.className,
            type: btn.type
          });
        });

        return results;
      });

      // Synthesis: suggest an adapter template
      const hostname = urlObj.hostname;
      
      const adapterDraft = {
        platform: hostname,
        version: '1.0.0',
        selectors: {
          title: analysis.inputs.find((i: any) => i.placeholder?.includes('标题'))?.name || 'TODO',
          content: analysis.inputs.find((i: any) => i.type === 'textarea')?.name || 'TODO',
          submit: analysis.buttons.find((b: any) => b.text?.includes('发布'))?.classes || 'TODO'
        }
      };

      return {
        analysis,
        adapterDraft
      };
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

export const explorerService = new ExplorerService();
