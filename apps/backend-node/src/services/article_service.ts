import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { Article, PlatformType } from '../db/models.js';
import { taskService } from './task-service.js';
import { startPublishThread } from './publish-executor.js';

class ArticleService {
  /**
   * Get all articles.
   */
  getAllArticles(): Article[] {
    const db = dbManager.getDb();
    const rows = db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all() as any[];
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
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
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
    accountId: string,
    platform: string,
    browserProfileId?: string,
    scheduleTime?: string
  ): Promise<string> {
    const article = this.getArticle(articleId);
    if (!article) throw new Error('Article not found');

    // Create a task
    const publishData = {
      title: article.title,
      type: this._getPlatformType(platform),
      content_type: 'article',
      content_id: articleId,
      accountList: [accountId],
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

  private _getPlatformType(platform: string): number {
    switch (platform.toUpperCase()) {
      case 'ZHIHU': return PlatformType.ZHIHU;
      case 'JUEJIN': return PlatformType.JUEJIN;
      default: return 0;
    }
  }
}

export const articleService = new ArticleService();
