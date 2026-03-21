import { describe, it, expect, expectTypeOf } from 'vitest';
import type { UserInfo, Task, UploadOptions, BrowserProfile } from '../src/index.js';
import { PlatformType } from '../src/index.js';

/**
 * Compile-time type validation tests.
 * These verify that the exported types are structurally sound and importable.
 */

describe('Type exports compile-time validation', () => {
  it('Task interface should have required fields', () => {
    expectTypeOf<Task>().toHaveProperty('id');
    expectTypeOf<Task>().toHaveProperty('status');
    expectTypeOf<Task>().toHaveProperty('platforms');
    expectTypeOf<Task>().toHaveProperty('content_type');
    expectTypeOf<Task>().toHaveProperty('created_at');
  });

  it('UploadOptions interface should have required fields', () => {
    expectTypeOf<UploadOptions>().toHaveProperty('title');
    expectTypeOf<UploadOptions>().toHaveProperty('fileList');
    expectTypeOf<UploadOptions>().toHaveProperty('tags');
    expectTypeOf<UploadOptions>().toHaveProperty('accountList');
  });

  it('UserInfo interface should reference PlatformType', () => {
    expectTypeOf<UserInfo>().toHaveProperty('type');
    expectTypeOf<UserInfo>().toHaveProperty('session_source');
  });

  it('BrowserProfile interface should have required fields', () => {
    expectTypeOf<BrowserProfile>().toHaveProperty('id');
    expectTypeOf<BrowserProfile>().toHaveProperty('browser_type');
    expectTypeOf<BrowserProfile>().toHaveProperty('user_data_dir');
    expectTypeOf<BrowserProfile>().toHaveProperty('is_default');
  });

  it('PlatformType enum should be importable as a value', () => {
    expect(PlatformType).toBeDefined();
    expect(typeof PlatformType.XIAOHONGSHU).toBe('number');
  });
});
