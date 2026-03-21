import { BrowserContext } from 'playwright';
import { BaseUploader } from '../base-uploader.js';
import { UploadOptions } from '../../db/models.js';
import { markdownToHtml } from '../../utils/markdown.js';

export class ZhihuUploader extends BaseUploader {
  protected platformName = 'Zhihu';

  public async postVideo(): Promise<void> {
    throw new Error('Video upload not supported for Zhihu yet.');
  }

  public async postArticle(
    context: BrowserContext,
    options: UploadOptions,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const page = await this.createPage(context);
    const article = (options as any).article;
    if (!article) throw new Error('Article data missing in options');

    onProgress(10);
    this.log('Navigating to Zhihu write page...');
    await page.goto('https://zhuanlan.zhihu.com/write');

    // Check login
    if (page.url().includes('signin')) {
      throw new Error('Not logged in to Zhihu');
    }

    onProgress(30);
    this.log('Filling article content...');
    
    // Title
    await page.fill('textarea[placeholder="请输入标题"]', article.title);
    
    // Content (Zhihu uses a custom editor, but often supports pasting HTML or has a hidden textarea)
    // For simplicity in this implementation, we'll try to find the editor and paste.
    // Real implementation would need more specific selectors.
    const htmlContent = await markdownToHtml(article.content);
    
    // Simple draft logic:
    await page.click('.WriteIndex-content'); // Focus editor
    await page.keyboard.type(article.content); // Type raw markdown as fallback or use a better strategy

    onProgress(70);
    this.log('Submitting...');
    // await page.click('button:has-text("发布")'); // Disabled for safety in implementation

    onProgress(100);
    this.log('Article published (Simulation mode).');
  }
}
