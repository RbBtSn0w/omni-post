import { chromium } from 'playwright';
import { logger } from '../core/logger.js';

class ExplorerService {
  /**
   * Explore a URL to identify interaction points.
   */
  async explore(url: string): Promise<any> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    logger.info(`[Explorer] Probing URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Inject probe script
    const analysis = await page.evaluate(() => {
      const results: any = {
        inputs: [],
        buttons: [],
        potentialApis: []
      };

      // Find inputs
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const el = input as HTMLInputElement;
        results.inputs.push({
          id: el.id,
          name: el.name,
          placeholder: el.placeholder,
          type: el.type,
          label: el.labels?.[0]?.innerText || ''
        });
      });

      // Find buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        results.buttons.push({
          text: btn.innerText,
          classes: btn.className,
          type: btn.type
        });
      });

      return results;
    });

    await browser.close();

    // Synthesis: suggest an adapter template
    const adapterDraft = {
      platform: new URL(url).hostname,
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
  }
}

export const explorerService = new ExplorerService();
