import { describe, it, expect } from 'vitest';
import {
  PlatformType,
  PLATFORM_NAMES,
  PLATFORM_NAME_TO_TYPE,
  PLATFORM_LOGIN_URLS,
  getPlatformName,
  getPlatformType,
  isValidPlatform,
} from '../src/index.js';

describe('PlatformType enum', () => {
  it('should have correct integer IDs for all platforms', () => {
    expect(PlatformType.XIAOHONGSHU).toBe(1);
    expect(PlatformType.TENCENT).toBe(2);
    expect(PlatformType.DOUYIN).toBe(3);
    expect(PlatformType.KUAISHOU).toBe(4);
    expect(PlatformType.BILIBILI).toBe(5);
    expect(PlatformType.ZHIHU).toBe(6);
    expect(PlatformType.JUEJIN).toBe(7);
  });

  it('should have exactly 7 platforms', () => {
    // Numeric enum values (filter out reverse mappings)
    const numericValues = Object.values(PlatformType).filter(v => typeof v === 'number');
    expect(numericValues).toHaveLength(7);
  });
});

describe('PLATFORM_NAMES', () => {
  it('should have a Chinese name for every platform type', () => {
    const numericValues = Object.values(PlatformType).filter(v => typeof v === 'number') as number[];
    for (const id of numericValues) {
      expect(PLATFORM_NAMES[id as PlatformType]).toBeDefined();
      expect(typeof PLATFORM_NAMES[id as PlatformType]).toBe('string');
    }
  });

  it('should have correct display names', () => {
    expect(PLATFORM_NAMES[PlatformType.XIAOHONGSHU]).toBe('小红书');
    expect(PLATFORM_NAMES[PlatformType.TENCENT]).toBe('视频号');
    expect(PLATFORM_NAMES[PlatformType.DOUYIN]).toBe('抖音');
    expect(PLATFORM_NAMES[PlatformType.KUAISHOU]).toBe('快手');
    expect(PLATFORM_NAMES[PlatformType.BILIBILI]).toBe('Bilibili');
    expect(PLATFORM_NAMES[PlatformType.ZHIHU]).toBe('知乎');
    expect(PLATFORM_NAMES[PlatformType.JUEJIN]).toBe('掘金');
  });

  it('should have same count as PlatformType enum', () => {
    const enumCount = Object.values(PlatformType).filter(v => typeof v === 'number').length;
    const namesCount = Object.keys(PLATFORM_NAMES).length;
    expect(namesCount).toBe(enumCount);
  });
});

describe('PLATFORM_NAME_TO_TYPE (reverse mapping)', () => {
  it('should round-trip: name -> type -> name', () => {
    for (const [idStr, name] of Object.entries(PLATFORM_NAMES)) {
      const id = Number(idStr);
      expect(PLATFORM_NAME_TO_TYPE[name]).toBe(id);
    }
  });
});

describe('PLATFORM_LOGIN_URLS', () => {
  it('should have a URL for every platform type', () => {
    const numericValues = Object.values(PlatformType).filter(v => typeof v === 'number') as number[];
    for (const id of numericValues) {
      const url = PLATFORM_LOGIN_URLS[id as PlatformType];
      expect(url).toBeDefined();
      expect(url.startsWith('https://')).toBe(true);
    }
  });
});

describe('getPlatformName()', () => {
  it('should return correct name for valid IDs', () => {
    expect(getPlatformName(1)).toBe('小红书');
    expect(getPlatformName(3)).toBe('抖音');
    expect(getPlatformName(5)).toBe('Bilibili');
  });

  it('should return "未知" for invalid IDs', () => {
    expect(getPlatformName(0)).toBe('未知');
    expect(getPlatformName(99)).toBe('未知');
    expect(getPlatformName(-1)).toBe('未知');
  });
});

describe('getPlatformType()', () => {
  it('should return correct ID for valid names', () => {
    expect(getPlatformType('小红书')).toBe(1);
    expect(getPlatformType('抖音')).toBe(3);
    expect(getPlatformType('Bilibili')).toBe(5);
  });

  it('should return 0 for unknown names', () => {
    expect(getPlatformType('unknown')).toBe(0);
    expect(getPlatformType('')).toBe(0);
  });
});

describe('isValidPlatform()', () => {
  it('should return true for valid platform IDs', () => {
    for (let i = 1; i <= 7; i++) {
      expect(isValidPlatform(i)).toBe(true);
    }
  });

  it('should return false for invalid platform IDs', () => {
    expect(isValidPlatform(0)).toBe(false);
    expect(isValidPlatform(8)).toBe(false);
    expect(isValidPlatform(-1)).toBe(false);
    expect(isValidPlatform(100)).toBe(false);
  });
});
