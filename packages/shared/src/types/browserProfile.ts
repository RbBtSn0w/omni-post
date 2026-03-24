/**
 * BrowserProfile interface — Single Source of Truth (SSOT)
 *
 * Previously defined in:
 *   - apps/backend-node/src/models/browser_profile.ts
 */

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
