/**
 * Platform type constants - Thin re-export shim
 *
 * Shared definitions (PlatformType, PLATFORM_NAMES, helpers) are now sourced
 * from @omni-post/shared (SSOT). Frontend-only constants (PLATFORM_TAG_TYPES,
 * PLATFORM_LIST, etc.) remain defined here.
 */

// ─── Re-exports from @omni-post/shared ──────────────────────────────
export {
    getPlatformName,
    getPlatformType,
    isValidPlatform, PLATFORM_NAME_TO_TYPE, PLATFORM_NAMES, PlatformType
} from '@omni-post/shared'

import { PLATFORM_NAME_TO_TYPE, PLATFORM_NAMES, PlatformType } from '@omni-post/shared'

// ─── Frontend-Only: Element Plus Tag Types ──────────────────────────
export const PLATFORM_TAG_TYPES = Object.freeze({
    [PlatformType.XIAOHONGSHU]: 'info',
    [PlatformType.WX_CHANNELS]: 'warning',
    [PlatformType.DOUYIN]: 'danger',
    [PlatformType.KUAISHOU]: 'success',
    [PlatformType.BILIBILI]: 'primary',
    [PlatformType.ZHIHU]: 'info',
    [PlatformType.JUEJIN]: 'success',
    [PlatformType.WX_OFFICIAL_ACCOUNT]: 'success', // 绿色标
})

// ─── Frontend-Only: UI Dropdown List ────────────────────────────────
export const PLATFORM_LIST = Object.freeze([
    { key: PlatformType.DOUYIN, name: '抖音' },
    { key: PlatformType.KUAISHOU, name: '快手' },
    { key: PlatformType.WX_CHANNELS, name: '微信视频号' },
    { key: PlatformType.XIAOHONGSHU, name: '小红书' },
    { key: PlatformType.BILIBILI, name: 'Bilibili' },
    { key: PlatformType.WX_OFFICIAL_ACCOUNT, name: '微信公众号' },
])

// ─── Frontend-Only: All Platform Names Array ────────────────────────
export const ALL_PLATFORM_NAMES = Object.freeze(
    Object.values(PLATFORM_NAMES)
)

/**
 * Get Element Plus tag type for a platform
 * @param {number|string} platform - Platform ID or display name (fallback)
 * @returns {string} Element Plus tag type ('success', 'danger', etc.)
 */
export function getPlatformTagType(platform) {
    // If it's a number (PlatformType ID), use it
    if (typeof platform === 'number') {
        return PLATFORM_TAG_TYPES[platform] || 'info'
    }
    // Fallback: reverse lookup for legacy name support if needed (not recommended)
    const type = PLATFORM_NAME_TO_TYPE[platform]
    return PLATFORM_TAG_TYPES[type] || 'info'
}
