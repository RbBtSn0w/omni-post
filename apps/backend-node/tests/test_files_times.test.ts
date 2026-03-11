/**
 * Schedule time calculation test.
 * Mirrors: apps/backend/tests/test_files_times.py
 */

import { describe, expect, it } from 'vitest';
import { generateScheduleTimeNextDay } from '../src/utils/files-times.js';

describe('generateScheduleTimeNextDay', () => {
    it('should generate basic schedule times', () => {
        const result = generateScheduleTimeNextDay(3, 1, [10], false);
        expect(result).toHaveLength(3);
        expect(result.every((item: any) => item instanceof Date)).toBe(true);

        // Check days are consecutive
        for (let i = 1; i < 3; i++) {
            const dayDiff = Math.round(((result[i] as Date).getTime() - (result[i - 1] as Date).getTime()) / (1000 * 60 * 60 * 24));
            expect(dayDiff).toBe(1);
        }
    });

    it('should generate timestamps when requested', () => {
        const result = generateScheduleTimeNextDay(3, 1, [10], true);
        expect(result).toHaveLength(3);
        expect(result.every((item: any) => typeof item === 'number')).toBe(true);

        // Check timestamps are in ascending order
        expect(result[0]).toBeLessThan(result[1] as number);
        expect(result[1]).toBeLessThan(result[2] as number);
    });

    it('should respect custom daily times', () => {
        const dailyTimes = [9, 14, 18];
        const result = generateScheduleTimeNextDay(5, 2, dailyTimes, false) as Date[];
        expect(result).toHaveLength(5);

        // First two videos should be same day
        expect(result[0].toDateString()).toBe(result[1].toDateString());
        // Third video should be a different day
        expect(result[2].getTime()).toBeGreaterThan(result[1].getTime());

        // Check hours match
        expect(result[0].getHours()).toBe(dailyTimes[0]);
        expect(result[1].getHours()).toBe(dailyTimes[1]);
        expect(result[2].getHours()).toBe(dailyTimes[0]);
    });

    it('should apply start_days offset', () => {
        const startDays = 2;
        const result = generateScheduleTimeNextDay(2, 1, [10], false, startDays) as Date[];
        expect(result).toHaveLength(2);

        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + startDays + 1);
        expect(result[0].toDateString()).toBe(expectedDate.toDateString());
    });

    it('should throw for invalid videos_per_day', () => {
        expect(() => generateScheduleTimeNextDay(3, 0, [10])).toThrow();
        expect(() => generateScheduleTimeNextDay(3, -1, [10])).toThrow();
    });

    it('should throw when videos_per_day exceeds daily_times length', () => {
        expect(() => generateScheduleTimeNextDay(3, 3, [10, 14])).toThrow();
    });

    it('should return empty array for zero videos', () => {
        const result = generateScheduleTimeNextDay(0, 1, [10]);
        expect(result).toHaveLength(0);
    });
});
