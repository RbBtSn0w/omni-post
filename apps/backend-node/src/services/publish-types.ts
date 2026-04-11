import type { UploadOptions } from '../db/models.js';

type NonEmptyNumberArray = [number, ...number[]];

interface PublishTaskDataBase {
    title?: string;
    tags?: string[];
    fileList?: string[];
    accountList?: string[];
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

interface PublishTaskDataWithType extends PublishTaskDataBase {
    type: number;
    platforms?: number[];
}

interface PublishTaskDataWithPlatforms extends PublishTaskDataBase {
    platforms: NonEmptyNumberArray;
    type?: number;
}

export type PublishTaskData = PublishTaskDataWithType | PublishTaskDataWithPlatforms;

function isPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function resolvePublishPlatforms(data: PublishTaskData): NonEmptyNumberArray {
    const platforms = Array.isArray(data.platforms)
        ? data.platforms.filter(isPositiveInteger)
        : [];
    if (platforms.length > 0) {
        return platforms as NonEmptyNumberArray;
    }

    const type = data.type;
    if (isPositiveInteger(type)) {
        return [type];
    }

    throw new Error('Invalid publish payload: missing platform identity. Provide type or non-empty platforms.');
}

export function resolvePublishType(data: PublishTaskData): number {
    const type = data.type;
    if (isPositiveInteger(type)) {
        return type;
    }
    return resolvePublishPlatforms(data)[0];
}
