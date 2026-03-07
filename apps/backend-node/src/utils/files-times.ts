/**
 * Schedule time generation utility.
 * Mirrors: apps/backend/src/utils/files_times.py
 */

/**
 * Generate a schedule for video uploads, starting from the next day.
 *
 * @param totalVideos - Total number of videos to be uploaded
 * @param videosPerDay - Number of videos per day (default: 1)
 * @param dailyTimes - Optional list of hours to publish (default: [6, 11, 14, 16, 22])
 * @param timestamps - Return Unix timestamps instead of Date objects
 * @param startDays - Start from after startDays
 * @returns Array of scheduling times
 */
export function generateScheduleTimeNextDay(
    totalVideos: number,
    videosPerDay: number = 1,
    dailyTimes: number[] | null = null,
    timestamps: boolean = false,
    startDays: number = 0
): (Date | number)[] {
    if (videosPerDay <= 0) {
        throw new Error('videos_per_day should be a positive integer');
    }

    if (dailyTimes === null) {
        dailyTimes = [6, 11, 14, 16, 22];
    }

    if (videosPerDay > dailyTimes.length) {
        throw new Error('videos_per_day should not exceed the length of daily_times');
    }

    const schedule: (Date | number)[] = [];
    const currentTime = new Date();

    for (let video = 0; video < totalVideos; video++) {
        const day = Math.floor(video / videosPerDay) + startDays + 1;
        const dailyVideoIndex = video % videosPerDay;

        const hour = dailyTimes[dailyVideoIndex];

        // Calculate the scheduled time
        const scheduledTime = new Date(currentTime);
        scheduledTime.setDate(scheduledTime.getDate() + day);
        scheduledTime.setHours(hour, 0, 0, 0);

        if (timestamps) {
            schedule.push(Math.floor(scheduledTime.getTime() / 1000));
        } else {
            schedule.push(scheduledTime);
        }
    }

    return schedule;
}
