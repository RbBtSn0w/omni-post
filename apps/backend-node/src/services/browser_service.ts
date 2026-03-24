import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { BrowserProfile } from '../models/browser_profile.js';

class BrowserService {
  /**
   * Get all browser profiles.
   */
  getAllProfiles(): BrowserProfile[] {
    const db = dbManager.getDb();
    const rows = db.prepare('SELECT * FROM browser_profiles ORDER BY created_at DESC').all() as BrowserProfile[];
    return rows.map(row => ({
      ...row,
      is_default: Boolean(row.is_default)
    }));
  }

  /**
   * Get a profile by ID.
   */
  getProfile(id: string): BrowserProfile | null {
    const db = dbManager.getDb();
    const row = db.prepare('SELECT * FROM browser_profiles WHERE id = ?').get(id) as BrowserProfile | undefined;
    if (!row) return null;
    return {
      ...row,
      is_default: Boolean(row.is_default)
    };
  }

  /**
   * Create a new browser profile.
   */
  createProfile(data: Omit<BrowserProfile, 'id' | 'created_at' | 'updated_at'>): string {
    const db = dbManager.getDb();
    const id = `profile_${uuidv4().slice(0, 8)}`;

    if (data.is_default) {
      db.prepare('UPDATE browser_profiles SET is_default = 0').run();
    }

    const stmt = db.prepare(`
      INSERT INTO browser_profiles (id, name, browser_type, user_data_dir, profile_name, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.browser_type || 'chrome',
      data.user_data_dir,
      data.profile_name || 'Default',
      data.is_default ? 1 : 0
    );

    return id;
  }

  /**
   * Update an existing profile.
   */
  updateProfile(id: string, data: Partial<BrowserProfile>): boolean {
    const db = dbManager.getDb();
    
    if (data.is_default) {
      db.prepare('UPDATE browser_profiles SET is_default = 0 WHERE id != ?').run(id);
    }

    const fields = Object.keys(data).filter(f => !['id', 'created_at', 'updated_at'].includes(f));
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const val = (data as Record<string, unknown>)[f];
      return f === 'is_default' ? (val ? 1 : 0) : val;
    });

    const result = db.prepare(`
      UPDATE browser_profiles 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(...values, id);

    return result.changes > 0;
  }

  /**
   * Delete a profile.
   */
  deleteProfile(id: string): boolean {
    const db = dbManager.getDb();
    const result = db.prepare('DELETE FROM browser_profiles WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const browserService = new BrowserService();
