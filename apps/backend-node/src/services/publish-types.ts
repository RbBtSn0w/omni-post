import type { UploadOptions } from '../db/models.js';

export interface PublishTaskData {
    type?: number;
    title?: string;
    tags?: string[];
    fileList?: string[];
    accountList?: string[];
    platforms?: number[];
    content_type?: string;
    browser_profile_id?: string | null;
    category?: number | null;
    enableTimer?: boolean;
    videosPerDay?: number;
    dailyTimes?: number[];
    startDays?: number;
    productLink?: string;
    productTitle?: string;
    thumbnail?: string;
    isDraft?: boolean;
    article?: UploadOptions['article'];
    [key: string]: unknown;
}
