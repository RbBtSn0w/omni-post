import { describe, it, expect, beforeEach } from 'vitest';
import { browserService } from '../../src/services/browser_service.js';
import { dbManager } from '../../src/db/database.js';
import { createTables } from '../../src/db/migrations.js';

describe('BrowserService', () => {
  beforeEach(() => {
    createTables();
    // Clear database or mock properly if needed
    // For now, let's assume we can run real SQLite in-memory or a test file
    const db = dbManager.getDb();
    db.prepare('DELETE FROM browser_profiles').run();
  });

  it('should create and get a browser profile', () => {
    const profileData = {
      name: 'Test Profile',
      browser_type: 'chrome' as const,
      user_data_dir: '/tmp/chrome-data',
      profile_name: 'Default',
      is_default: true
    };

    const id = browserService.createProfile(profileData);
    expect(id).toBeDefined();
    expect(id).toContain('profile_');

    const profile = browserService.getProfile(id);
    expect(profile).toBeDefined();
    expect(profile?.name).toBe(profileData.name);
    expect(profile?.is_default).toBe(true);
  });

  it('should ensure only one profile is default', () => {
    browserService.createProfile({
      name: 'Profile 1',
      browser_type: 'chrome',
      user_data_dir: '/tmp/1',
      profile_name: 'Default',
      is_default: true
    });

    const id2 = browserService.createProfile({
      name: 'Profile 2',
      browser_type: 'chrome',
      user_data_dir: '/tmp/2',
      profile_name: 'Default',
      is_default: true
    });

    const profiles = browserService.getAllProfiles();
    expect(profiles.length).toBe(2);
    
    const p1 = profiles.find(p => p.name === 'Profile 1');
    const p2 = profiles.find(p => p.name === 'Profile 2');
    
    expect(p1?.is_default).toBe(false);
    expect(p2?.is_default).toBe(true);
  });

  it('should update a profile', () => {
    const id = browserService.createProfile({
      name: 'Old Name',
      browser_type: 'chrome',
      user_data_dir: '/tmp/old',
      profile_name: 'Default',
      is_default: false
    });

    const updated = browserService.updateProfile(id, { name: 'New Name', is_default: true });
    expect(updated).toBe(true);

    const profile = browserService.getProfile(id);
    expect(profile?.name).toBe('New Name');
    expect(profile?.is_default).toBe(true);
  });

  it('should delete a profile', () => {
    const id = browserService.createProfile({
      name: 'To Delete',
      browser_type: 'chrome',
      user_data_dir: '/tmp/delete',
      profile_name: 'Default',
      is_default: false
    });

    const deleted = browserService.deleteProfile(id);
    expect(deleted).toBe(true);

    const profile = browserService.getProfile(id);
    expect(profile).toBeNull();
  });
});
