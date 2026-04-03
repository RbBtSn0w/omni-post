/**
 * Shared type definitions — Single Source of Truth (SSOT)
 *
 * Previously defined in:
 *   - apps/backend-node/src/db/models.ts
 */

import { PlatformType } from '../constants/platform.js';

// ─── UserInfo ────────────────────────────────────────────────────────
export interface UserInfo {
    id: number;
    type: PlatformType;
    filePath: string;
    userName: string;
    status: number;
    group_id: number | null;
    session_source: 'managed' | 'local';
    browser_profile_id: string | null;
    credentials: string | null; // JSON string
    created_at: string;
    last_validated_at: string | null;
}

// ─── Task ────────────────────────────────────────────────────────────
export interface Task {
    id: string;
    title: string | null;
    status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed';
    progress: number;
    priority: number;
    content_type: 'video' | 'article';
    content_id: string | null;
    platforms: number[];
    file_list: string[];
    account_list: string[];
    browser_profile_id: string | null;
    schedule_data: unknown;
    error_msg: string | null;
    publish_data: unknown;
    created_at: string;
    updated_at: string;
}

// ─── UploadOptions ───────────────────────────────────────────────────
export interface UploadOptions {
    title: string;
    fileList: string[];
    tags: string[];
    accountList: string[];
    article?: {
        title: string;
        content: string;
        tags: string[];
        cover_image?: string | null;
    };
    category?: number | null;
    enableTimer?: boolean;
    videosPerDay?: number;
    dailyTimes?: number[];
    startDays?: number;
    thumbnailPath?: string;
    productLink?: string;
    productTitle?: string;
    isDraft?: boolean;
    publishDatetimes?: (Date | number | 0)[];
    browser_profile_id?: string | null;
    platform_id?: number; // For dynamic platforms
    userName?: string; // Current publishing user
}
