import { describe, it, expect } from 'vitest';
import { markdownToHtml, extractImagePaths } from '../../src/utils/markdown.js';

describe('Markdown Utility', () => {
  it('should convert basic markdown to html', async () => {
    const md = '# Hello\nThis is **bold**.';
    const html = await markdownToHtml(md);
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<p>This is <strong>bold</strong>.</p>');
  });

  it('should extract image paths', () => {
    const md = '![alt](/path/to/img1.png) and ![alt2](https://example.com/img2.jpg)';
    const paths = extractImagePaths(md);
    expect(paths).toEqual(['/path/to/img1.png', 'https://example.com/img2.jpg']);
  });
});
