export interface Article {
  id: string;
  title: string;
  content: string; // Markdown
  tags: string[];
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}
