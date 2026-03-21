/**
 * @omni-post/shared — Main entry point
 *
 * Re-exports all shared constants, types, and utilities.
 */

// Constants
export {
  PlatformType,
  PLATFORM_NAMES,
  PLATFORM_NAME_TO_TYPE,
  PLATFORM_LOGIN_URLS,
  getPlatformName,
  getPlatformType,
  isValidPlatform,
} from './constants/platform.js';

// Types
export type { UserInfo, Task, UploadOptions } from './types/task.js';
export type { BrowserProfile } from './types/browserProfile.js';
