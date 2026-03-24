export interface ApiEnvelope<T> {
  code: number;
  msg: string | null;
  data: T | null;
}

export interface BrowserProfile {
  id: string | number;
  name: string;
  browser_type: string;
  user_data_dir: string;
}

export interface LinkProfileRequest {
  name: string;
  user_data_dir: string;
  profile_name: string;
  browser_type: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  tags: string[];
}

export interface CreateArticleResponse {
  id: string;
}

export interface PublishArticleRequest {
  article_id: string;
  account_id?: string;
  platform: string;
  browser_profile_id?: string;
}

export interface PublishArticleResponse {
  task_id: string;
}

export interface PublishTask {
  id: string;
  title?: string;
  status: string;
  progress: number;
  created_at?: string;
}

export interface ExploreResult {
  analysis: {
    inputs: unknown[];
    buttons: unknown[];
  };
  adapterDraft: Record<string, unknown>;
}
