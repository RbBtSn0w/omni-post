/**
 * Type definitions for OmniPost Node.js Backend.
 * Mirrors: data-model.md
 */

export enum PlatformType {
    XHS = 1,
    Channels = 2,
    Douyin = 3,
    Kuaishou = 4,
    Bilibili = 5
}

export interface UserInfo {
    id: number;
    type: PlatformType;
    filePath: string;
    userName: string;
    status: number;
    group_id: number | null;
    created_at: string;
    last_validated_at: string | null;
}

export interface Task {
    id: string;
    title: string | null;
    status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed';
    progress: number;
    priority: number;
    platforms: number[];
    file_list: string[];
    account_list: string[];
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
}
