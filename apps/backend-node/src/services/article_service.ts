import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { Article } from '../models/article.js';
import { PlatformType } from '../db/models.js';
import { getPlatformType } from '../core/constants.js';
import { taskService } from './task-service.js';
import { startPublishThread } from './publish-executor.js';
import { extensionService } from './extension-service.js';

class ArticleService {
  private resolveAccountFilePath(accountRef: string, expectedPlatformType: number): string {
    const db = dbManager.getDb();
    const isNumericId = /^\d+$/.test(String(accountRef));
    const row = (isNumericId
      ? db.prepare('SELECT id, type, filePath FROM user_info WHERE id = ?').get(Number(accountRef))
      : db.prepare('SELECT id, type, filePath FROM user_info WHERE filePath = ?').get(accountRef)) as { id: number, type: number, filePath: string } | undefined;

    if (!row) {
      throw new Error('Account not found');
    }
    if (row.type !== expectedPlatformType) {
      throw new Error(`Account platform mismatch: expected=${expectedPlatformType}, actual=${row.type}`);
    }
    if (!row.filePath) {
      throw new Error('Account cookie file is missing');
    }
    return row.filePath;
  }

  /**
   * Get all articles.
   */
  getAllArticles(): Article[] {
    const db = dbManager.getDb();
    const rows = db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all() as (Article & { tags: string })[];
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  /**
   * Get an article by ID.
   */
  getArticle(id: string): Article | null {
    const db = dbManager.getDb();
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as (Article & { tags: string }) | undefined;
    if (!row) return null;
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]')
    };
  }

  /**
   * Create a new article.
   */
  createArticle(data: Omit<Article, 'id' | 'created_at' | 'updated_at'>): string {
    const db = dbManager.getDb();
    const id = `article_${uuidv4().slice(0, 8)}`;

    const stmt = db.prepare(`
      INSERT INTO articles (id, title, content, tags, cover_image)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title,
      data.content,
      JSON.stringify(data.tags || []),
      data.cover_image || null
    );

    return id;
  }

  /**
   * Publish an article.
   */
  async publishArticle(
    articleId: string,
    accountId: string | undefined,
    platform: string | number,
    browserProfileId?: string,
    scheduleTime?: string
  ): Promise<string> {
    const article = this.getArticle(articleId);
    if (!article) throw new Error('Article not found');
    const platformType = this._getPlatformType(platform);
    if (!platformType) throw new Error(`Unsupported platform: ${String(platform)}`);
    if (!this._supportsArticlePublishing(platformType)) {
      throw new Error(`Unsupported article platform type: ${platformType}`);
    }
    
    const accountList: string[] = [];
    if (accountId) {
      accountList.push(this.resolveAccountFilePath(accountId, platformType));
    }

    // Create a task
    const publishData = {
      title: article.title,
      type: platformType,
      content_type: 'article',
      content_id: articleId,
      accountList: accountList,
      browser_profile_id: browserProfileId,
      schedule_time: scheduleTime,
      article: article // Pass full article data for the uploader
    };

    const taskId = taskService.createTask(publishData);
    
    // Update task with article-specific fields if needed
    const db = dbManager.getDb();
    db.prepare('UPDATE tasks SET content_type = ?, content_id = ? WHERE id = ?')
      .run('article', articleId, taskId);

    // Start publishing thread
    startPublishThread(taskId, publishData);

    return taskId;
  }

  private _getPlatformType(platform: string | number): number {
    if (typeof platform === 'number' && Number.isInteger(platform) && platform > 0) {
      return platform;
    }

    const raw = String(platform).trim();
    if (!raw) return 0;
    if (/^\d+$/.test(raw)) {
      return Number(raw);
    }

    switch (raw.toUpperCase()) {
      case 'ZHIHU':
        return PlatformType.ZHIHU;
      case 'JUEJIN':
        return PlatformType.JUEJIN;
      case 'WX_OFFICIAL_ACCOUNT':
        return PlatformType.WX_OFFICIAL_ACCOUNT;
      default:
        return getPlatformType(raw);
    }
  }

  private _supportsArticlePublishing(platformType: number): boolean {
    if (platformType === PlatformType.ZHIHU || platformType === PlatformType.JUEJIN) {
      return true;
    }
    if (platformType === PlatformType.WX_OFFICIAL_ACCOUNT || platformType >= 100) {
      const ext = extensionService.getExtensionByPlatformId(platformType);
      return Boolean(ext?.manifest.actions.publish_article);
    }
    return false;
  }
}

export const articleService = new ArticleService();
