/**
 * Type definitions for OmniPost Node.js Backend.
 * Mirrors: data-model.md
 */

export enum PlatformType {
    XHS = 1,
    Channels = 2,
    Douyin = 3,
    Kuaishou = 4,
    Bilibili = 5,
    ZHIHU = 6,
    JUEJIN = 7
}

export interface UserInfo {
    id: number;
    type: PlatformType;
    filePath: string;
    userName: string;
    status: number;
    group_id: number | null;
    session_source: 'managed' | 'local';
    browser_profile_id: string | null;
    created_at: string;
    last_validated_at: string | null;
}

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
    schedule_data: any;
    error_msg: string | null;
    publish_data: any;
    created_at: string;
    updated_at: string;
}

export interface UploadOptions {
    title: string;
    fileList: string[];
    tags: string[];
    accountList: string[];
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
}
