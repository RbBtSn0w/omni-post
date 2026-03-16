export interface BrowserProfile {
  id: string;
  name: string;
  browser_type: 'chrome' | 'edge' | 'brave';
  user_data_dir: string;
  profile_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
