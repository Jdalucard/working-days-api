import { WORKING_HOURS } from "../const/constants.js";

export class DateUtils {
  /**
   * Convert UTC date to Colombia timezone
   */
  static toColombiaTime(utcDate: Date): Date {
    const colombiaDate = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);
    return colombiaDate;
  }

  /**
   * Convert Colombia time to UTC
   */
  static toUTC(colombiaDate: Date): Date {
    const utcDate = new Date(colombiaDate.getTime() + 5 * 60 * 60 * 1000);
    return utcDate;
  }

  static isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Friday = 5
  }

  static isWorkingHours(date: Date): boolean {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const totalMinutes = hour * 60 + minute;

    const startMinutes = WORKING_HOURS.start * 60; // 8:00 AM
    const lunchStartMinutes = WORKING_HOURS.lunchStart * 60; // 12:00 PM
    const lunchEndMinutes = WORKING_HOURS.lunchEnd * 60; // 1:00 PM
    const endMinutes = WORKING_HOURS.end * 60; // 5:00 PM

    return (
      (totalMinutes >= startMinutes && totalMinutes < lunchStartMinutes) ||
      (totalMinutes >= lunchEndMinutes && totalMinutes < endMinutes)
    );
  }

  static adjustToWorkingTime(date: Date, holidays: string[]): Date {
    const adjustedDate = new Date(date);

    while (true) {
      const dateString = adjustedDate.toISOString().split("T")[0];

      if (this.isWorkingDay(adjustedDate) && !holidays.includes(dateString)) {
        break;
      }

      adjustedDate.setDate(adjustedDate.getDate() - 1);
    }

    const hour = adjustedDate.getHours();
    const minute = adjustedDate.getMinutes();
    const timeInHours = hour + minute / 60;

    if (timeInHours >= WORKING_HOURS.end) {
      adjustedDate.setHours(WORKING_HOURS.end - 1, 0, 0, 0);
    } else if (
      timeInHours >= WORKING_HOURS.lunchStart &&
      timeInHours < WORKING_HOURS.lunchEnd
    ) {
      adjustedDate.setHours(WORKING_HOURS.lunchStart, 0, 0, 0);
    } else if (timeInHours < WORKING_HOURS.start) {
      adjustedDate.setDate(adjustedDate.getDate() - 1);

      while (true) {
        const dateString = adjustedDate.toISOString().split("T")[0];
        if (this.isWorkingDay(adjustedDate) && !holidays.includes(dateString)) {
          break;
        }
        adjustedDate.setDate(adjustedDate.getDate() - 1);
      }

      adjustedDate.setHours(WORKING_HOURS.end - 1, 0, 0, 0);
    }

    return adjustedDate;
  }

  /**
   * Get current Colombia time
   */
  static getCurrentColombiaTime(): Date {
    const now = new Date();
    return this.toColombiaTime(now);
  }

  /**
   * Format date to UTC ISO string with Z suffix
   */
  static formatToUTCString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }
}
