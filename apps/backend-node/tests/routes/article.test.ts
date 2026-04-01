import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { articleService } from '../../src/services/article_service.js';

vi.mock('../../src/services/article_service.js');

describe('Article Routes', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /publish/article should accept numeric platform_id', async () => {
    vi.mocked(articleService.publishArticle).mockResolvedValue('task_123');

    const res = await request(app).post('/publish/article').send({
      article_id: 'article_1',
      account_id: '88',
      platform_id: 101
    });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.task_id).toBe('task_123');
    expect(articleService.publishArticle).toHaveBeenCalledWith('article_1', '88', 101, undefined, undefined);
  });

  it('POST /publish/article should reject missing platform input', async () => {
    const res = await request(app).post('/publish/article').send({
      article_id: 'article_1',
      account_id: '88'
    });

    expect(res.status).toBe(400);
    expect(res.body.msg).toContain('platform_id');
  });
});
