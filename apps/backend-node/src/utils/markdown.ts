import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/**
 * Convert Markdown to HTML.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  
  return String(result);
}

/**
 * Extract image paths from Markdown.
 * Useful for uploading local images to platform CDN.
 */
export function extractImagePaths(markdown: string): string[] {
  const regex = /!\[.*?\]\((.*?)\)/g;
  const paths: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}
