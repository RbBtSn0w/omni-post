/**
 * Platform type constants - Single source of truth for all platform definitions
 *
 * This module centralizes all platform-related constants to avoid scattered
 * definitions across multiple files.
 */

// Platform type enum-like object (matches backend PlatformType)
export const PlatformType = Object.freeze({
    XIAOHONGSHU: 1,
    TENCENT: 2,      // 视频号
    DOUYIN: 3,
    KUAISHOU: 4,
    BILIBILI: 5,
})

// Platform display names (ID -> Chinese name)
export const PLATFORM_NAMES = Object.freeze({
    [PlatformType.XIAOHONGSHU]: '小红书',
    [PlatformType.TENCENT]: '视频号',
    [PlatformType.DOUYIN]: '抖音',
    [PlatformType.KUAISHOU]: '快手',
    [PlatformType.BILIBILI]: 'Bilibili',
})

// Reverse mapping (Chinese name -> ID)
export const PLATFORM_NAME_TO_TYPE = Object.freeze(
    Object.fromEntries(
        Object.entries(PLATFORM_NAMES).map(([k, v]) => [v, Number(k)])
    )
)

// Platform tag types for Element Plus (name -> tag type)
export const PLATFORM_TAG_TYPES = Object.freeze({
    '小红书': 'info',
    '视频号': 'warning',
    '抖音': 'danger',
    '快手': 'success',
    'Bilibili': 'primary',
})

// Platform list for UI dropdowns (with display order)
export const PLATFORM_LIST = Object.freeze([
    { key: PlatformType.DOUYIN, name: '抖音' },
    { key: PlatformType.KUAISHOU, name: '快手' },
    { key: PlatformType.TENCENT, name: '视频号' },
    { key: PlatformType.XIAOHONGSHU, name: '小红书' },
    { key: PlatformType.BILIBILI, name: 'Bilibili' },
])

// All platform names as array (for filters/dropdowns)
export const ALL_PLATFORM_NAMES = Object.freeze(
    Object.values(PLATFORM_NAMES)
)

/**
 * Get platform display name by type ID
 * @param {number} typeId - Platform type ID (1-5)
 * @returns {string} Platform Chinese name or "未知" if not found
 */
export function getPlatformName(typeId) {
    return PLATFORM_NAMES[typeId] || '未知'
}

/**
 * Get platform type ID by name
 * @param {string} name - Platform display name (Chinese)
 * @returns {number} Platform type ID or 0 if not found
 */
export function getPlatformType(name) {
    return PLATFORM_NAME_TO_TYPE[name] || 0
}

/**
 * Get Element Plus tag type for a platform
 * @param {string} platformName - Platform display name
 * @returns {string} Element Plus tag type ('success', 'danger', etc.)
 */
export function getPlatformTagType(platformName) {
    return PLATFORM_TAG_TYPES[platformName] || 'info'
}

/**
 * Check if a platform type ID is valid
 * @param {number} typeId - Platform type ID to check
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidPlatform(typeId) {
    return Object.values(PlatformType).includes(typeId)
}
