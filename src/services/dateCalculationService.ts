import { DateTime } from "luxon";
import { WORKING_HOURS } from "../const/constants.js";
import { HolidayService } from "./holidayService.js";

const COLOMBIA_TIMEZONE = "America/Bogota";

export class DateCalculationService {
  static async addWorkingTime(startDate: Date, days: number = 0, hours: number = 0): Promise<Date> {
    const colombiaDate = DateTime.fromJSDate(startDate, {
      zone: COLOMBIA_TIMEZONE,
    });

    const holidays = await HolidayService.getHolidays();

    let workingDate = this.normalizeToWorkingTime(colombiaDate, holidays);

    const workingDayHours =
      WORKING_HOURS.end - WORKING_HOURS.start - (WORKING_HOURS.lunchEnd - WORKING_HOURS.lunchStart);

    const wholeDays = Math.trunc(days);
    const fractionalDays = days - wholeDays;
    const hoursFromFractionalDays = fractionalDays * workingDayHours;

    if (wholeDays > 0) {
      workingDate = await this.addWorkingDays(workingDate, wholeDays, holidays);
    }

    const totalHoursToAdd = hours + hoursFromFractionalDays;
    if (totalHoursToAdd > 0) {
      workingDate = await this.addWorkingHours(workingDate, totalHoursToAdd, holidays);
    }

    return workingDate.toUTC().toJSDate();
  }

  private static normalizeToWorkingTime(date: DateTime, holidays: string[]): DateTime {
    let normalizedDate = date;

    while (this.isNonWorkingDay(normalizedDate, holidays)) {
      normalizedDate = normalizedDate.plus({ days: 1 }).set({
        hour: WORKING_HOURS.start,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    }

    const hour = normalizedDate.hour;

    if (hour < WORKING_HOURS.start) {
      normalizedDate = normalizedDate.set({
        hour: WORKING_HOURS.start,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    } else if (hour >= WORKING_HOURS.end) {
      normalizedDate = normalizedDate.plus({ days: 1 }).set({
        hour: WORKING_HOURS.start,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      while (this.isNonWorkingDay(normalizedDate, holidays)) {
        normalizedDate = normalizedDate.plus({ days: 1 }).set({
          hour: WORKING_HOURS.start,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
      }
    } else if (hour >= WORKING_HOURS.lunchStart && hour < WORKING_HOURS.lunchEnd) {
      normalizedDate = normalizedDate.set({
        hour: WORKING_HOURS.lunchEnd,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    }

    return normalizedDate;
  }

  private static isNonWorkingDay(date: DateTime, holidays: string[]): boolean {
    const dayOfWeek = date.weekday;
    const dateString = date.toISODate();

    if (dayOfWeek === 6 || dayOfWeek === 7) {
      return true;
    }

    return dateString ? holidays.includes(dateString) : false;
  }

  private static async addWorkingDays(
    startDate: DateTime,
    daysToAdd: number,
    holidays: string[]
  ): Promise<DateTime> {
    let resultDate = startDate;
    let addedDays = 0;

    while (addedDays < daysToAdd) {
      resultDate = resultDate.plus({ days: 1 });

      while (this.isNonWorkingDay(resultDate, holidays)) {
        resultDate = resultDate.plus({ days: 1 });
      }

      addedDays++;
    }

    return resultDate.set({
      hour: WORKING_HOURS.start,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
  }

  private static async addWorkingHours(
    startDate: DateTime,
    hoursToAdd: number,
    holidays: string[]
  ): Promise<DateTime> {
    let resultDate = startDate;

    let remainingMinutes = Math.floor(hoursToAdd * 60);

    while (remainingMinutes > 0) {
      while (this.isNonWorkingDay(resultDate, holidays)) {
        resultDate = resultDate.plus({ days: 1 }).set({
          hour: WORKING_HOURS.start,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        continue;
      }

      const hour = resultDate.hour;

      if (hour < WORKING_HOURS.start) {
        resultDate = resultDate.set({
          hour: WORKING_HOURS.start,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        continue;
      }

      if (hour >= WORKING_HOURS.end) {
        resultDate = resultDate.plus({ days: 1 }).set({
          hour: WORKING_HOURS.start,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        continue;
      }

      if (hour >= WORKING_HOURS.lunchStart && hour < WORKING_HOURS.lunchEnd) {
        resultDate = resultDate.set({
          hour: WORKING_HOURS.lunchEnd,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        continue;
      }

      resultDate = resultDate.plus({ minutes: 1 });
      remainingMinutes -= 1;
    }

    return resultDate;
  }
}
