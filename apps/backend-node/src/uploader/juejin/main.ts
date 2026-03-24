import { BrowserContext } from 'playwright';
import { BaseUploader } from '../base-uploader.js';
import { UploadOptions } from '../../db/models.js';

export class JuejinUploader extends BaseUploader {
  protected platformName = 'Juejin';

  public async postVideo(): Promise<void> {
    throw new Error('Video upload not supported for Juejin yet.');
  }

  public async postArticle(
    context: BrowserContext,
    options: UploadOptions,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const page = await this.createPage(context);
    const article = options.article;
    if (!article) throw new Error('Article data missing in options');

    onProgress(10);
    this.log('Navigating to Juejin editor...');
    await page.goto('https://juejin.cn/editor/drafts/new');

    // Check login
    if (page.url().includes('login')) {
      throw new Error('Not logged in to Juejin');
    }

    onProgress(30);
    this.log('Filling title and content...');
    
    // Title
    await page.fill('input.title-input', article.title);
    
    // Content (Juejin uses ByteMirror/Codemirror)
    await page.click('.bytemd-editor');
    await page.keyboard.type(article.content);

    onProgress(70);
    this.log('Finalizing draft...');
    // await page.click('.publish-btn'); // Simulation

    onProgress(100);
    this.log('Article published (Simulation mode).');
  }
}
