
/**
 * Unified platform constants — Single Source of Truth (SSOT)
 *
 * This file is the canonical definition of all platform type IDs,
 * display names, and helper functions shared across frontend and backend.
 *
 * Previously duplicated in:
 *   - apps/backend-node/src/core/constants.ts
 *   - apps/backend-node/src/db/models.ts
 *   - apps/frontend/src/core/platformConstants.js
 */

// ─── Platform Type Enum ─────────────────────────────────────────────
/** 平台类型枚举 - 所有平台类型的唯一真相来源 */
export enum PlatformType {
    XIAOHONGSHU = 1,
    WX_CHANNELS = 2, // 微信视频号
    DOUYIN = 3,
    KUAISHOU = 4,
    BILIBILI = 5,
    ZHIHU = 6,
    JUEJIN = 7,
}

// ─── Platform Display Names ─────────────────────────────────────────
/** Platform display names (Chinese) - ID to name mapping */
export const PLATFORM_NAMES: Record<PlatformType, string> = {
    [PlatformType.XIAOHONGSHU]: '小红书',
    [PlatformType.WX_CHANNELS]: '微信视频号',
    [PlatformType.DOUYIN]: '抖音',
    [PlatformType.KUAISHOU]: '快手',
    [PlatformType.BILIBILI]: 'Bilibili',
    [PlatformType.ZHIHU]: '知乎',
    [PlatformType.JUEJIN]: '掘金',
};

// ─── Reverse Mapping ─────────────────────────────────────────────────
/** Reverse mapping: Chinese name -> type ID */
export const PLATFORM_NAME_TO_TYPE: Record<string, PlatformType> = Object.fromEntries(
    Object.entries(PLATFORM_NAMES).map(([k, v]) => [v, Number(k) as PlatformType])
) as Record<string, PlatformType>;

// ─── Platform Login URLs ─────────────────────────────────────────────
/** Platform login URLs for session management */
export const PLATFORM_LOGIN_URLS: Record<PlatformType, string> = {
    [PlatformType.XIAOHONGSHU]: 'https://creator.xiaohongshu.com/',
    [PlatformType.WX_CHANNELS]: 'https://channels.weixin.qq.com',
    [PlatformType.DOUYIN]: 'https://creator.douyin.com/',
    [PlatformType.KUAISHOU]: 'https://cp.kuaishou.com',
    [PlatformType.BILIBILI]: 'https://member.bilibili.com/platform/home',
    [PlatformType.ZHIHU]: 'https://www.zhihu.com/signin',
    [PlatformType.JUEJIN]: 'https://juejin.cn/',
};

// ─── Helper Functions ────────────────────────────────────────────────
/**
 * Get platform display name by type ID.
 */
export function getPlatformName(platformType: number | null | undefined): string {
    if (platformType == null) return '未知';
    return PLATFORM_NAMES[platformType as PlatformType] ?? '未知';
}

/**
 * Get platform type ID by name.
 */
export function getPlatformType(platformName: string | null | undefined): number {
    if (!platformName) return 0;
    const platform = PLATFORM_NAME_TO_TYPE[platformName];
    return platform ?? 0;
}

/**
 * Check if a platform type ID is valid.
 */
export function isValidPlatform(platformType: number): boolean {
    return Object.values(PlatformType).includes(platformType as PlatformType);
}
