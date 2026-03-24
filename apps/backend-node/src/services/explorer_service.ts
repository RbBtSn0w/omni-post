import { chromium } from 'playwright';
import { logger } from '../core/logger.js';

class ExplorerService {
  /**
   * Validate URL for safety (SSRF protection).
   * Resolves hostname and blocks private/loopback/link-local/ULA ranges.
   */
  private async validateUrl(url: string) {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol. Only http/https are allowed.');
    }
    const { lookup } = await import('node:dns/promises');
    const hostname = urlObj.hostname.toLowerCase();
    
    // Preliminary regex check for literals (v4 private, v6 localhost/private/link-local)
    const privateIps = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|100\.6[4-9]\.|100\.7[0-9]\.|::1|fc00:|fe80:)/i;
    if (privateIps.test(hostname) || hostname === 'localhost' || hostname === '::1') {
      throw new Error('Private network access is restricted for security.');
    }

    try {
      const { address } = await lookup(hostname);
      // More robust check should happen here if using a dedicated SSRF library or deeper subnet checking
      // For now, check if resolved address matches private prefixes
      if (privateIps.test(address) || address === '127.0.0.1' || address === '::1') {
        throw new Error('Hostname resolved to a restricted private IP address.');
      }
    } catch (error: unknown) {
      if (error instanceof Error && (error as { code?: string }).code !== 'ENOTFOUND') {
        throw error;
      }
    }

    return urlObj;
  }

  /**
   * Explore a URL to identify interaction points.
   */
  async explore(url: string): Promise<any> {
    const urlObj = await this.validateUrl(url);
    
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Prevent redirects/requests to private networks
      await page.route('**/*', async (route) => {
        try {
          const reqUrl = route.request().url();
          await this.validateUrl(reqUrl);
          await route.continue();
        } catch (error: unknown) {
          logger.warn(`[Explorer] SSRF BLOCKED: ${route.request().url()}`);
          await route.abort('accessdenied');
        }
      });

      logger.info(`[Explorer] Probing URL: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      if (response) {
        // Fallback: validate final URL after redirects if they somehow bypassed route (should not happen in Playwright)
        await this.validateUrl(response.url());
      }

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
