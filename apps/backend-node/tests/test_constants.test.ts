/**
 * Platform constants test.
 * Mirrors: apps/backend/tests/test_constants.py
 */

import { describe, expect, it } from 'vitest';
import {
    PlatformType,
    getPlatformName,
    getPlatformType,
    isValidPlatform,
} from '../src/core/constants.js';

describe('PlatformType Constants', () => {
    it('should have correct enum values', () => {
        expect(PlatformType.XIAOHONGSHU).toBe(1);
        expect(PlatformType.TENCENT).toBe(2);
        expect(PlatformType.DOUYIN).toBe(3);
        expect(PlatformType.KUAISHOU).toBe(4);
        expect(PlatformType.BILIBILI).toBe(5);
    });
});

describe('getPlatformName', () => {
    it('should return correct platform names', () => {
        expect(getPlatformName(1)).toBe('小红书');
        expect(getPlatformName(5)).toBe('Bilibili');
        expect(getPlatformName(PlatformType.DOUYIN)).toBe('抖音');
    });

    it('should return "未知" for unknown platform', () => {
        expect(getPlatformName(99)).toBe('未知');
    });
});

describe('getPlatformType', () => {
    it('should return correct platform type by name', () => {
        expect(getPlatformType('小红书')).toBe(1);
        expect(getPlatformType('Bilibili')).toBe(5);
    });

    it('should return 0 for unknown platform name', () => {
        expect(getPlatformType('Unknown')).toBe(0);
    });
});

describe('isValidPlatform', () => {
    it('should validate known platforms', () => {
        expect(isValidPlatform(1)).toBe(true);
        expect(isValidPlatform(5)).toBe(true);
    });

    it('should reject invalid platforms', () => {
        expect(isValidPlatform(6)).toBe(false);
        expect(isValidPlatform(0)).toBe(false);
    });
});
