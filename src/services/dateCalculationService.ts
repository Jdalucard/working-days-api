import { DateTime } from "luxon";
import { WORKING_HOURS } from "../const/constants.js";
import { HolidayService } from "./holidayService.js";

const COLOMBIA_TIMEZONE = "America/Bogota";

export class DateCalculationService {

  static async addWorkingTime(
    startDate: Date,
    days: number = 0,
    hours: number = 0
  ): Promise<Date> {
   
    const colombiaDate = DateTime.fromJSDate(startDate, { zone: COLOMBIA_TIMEZONE });


    const holidays = await HolidayService.getHolidays();

  
    let workingDate = this.normalizeToWorkingTime(colombiaDate, holidays);

  
    if (days > 0) {
      workingDate = await this.addWorkingDays(workingDate, days, holidays);
    }

   
    if (hours > 0) {
      workingDate = await this.addWorkingHours(workingDate, hours, holidays);
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
        millisecond: 0 
      });
    }

  
    const hour = normalizedDate.hour;

    if (hour < WORKING_HOURS.start) {
     
      normalizedDate = normalizedDate.set({ 
        hour: WORKING_HOURS.start, 
        minute: 0, 
        second: 0, 
        millisecond: 0 
      });
    } else if (hour >= WORKING_HOURS.end) {

      normalizedDate = normalizedDate.plus({ days: 1 }).set({ 
        hour: WORKING_HOURS.start, 
        minute: 0, 
        second: 0, 
        millisecond: 0 
      });
      
   
      while (this.isNonWorkingDay(normalizedDate, holidays)) {
        normalizedDate = normalizedDate.plus({ days: 1 });
      }
    } else if (hour >= WORKING_HOURS.lunchStart && hour < WORKING_HOURS.lunchEnd) {

      normalizedDate = normalizedDate.set({ 
        hour: WORKING_HOURS.lunchEnd, 
        minute: 0, 
        second: 0, 
        millisecond: 0 
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
      // Move to next day
      resultDate = resultDate.plus({ days: 1 });
      
      // Skip weekends and holidays
      while (this.isNonWorkingDay(resultDate, holidays)) {
        resultDate = resultDate.plus({ days: 1 });
      }

      addedDays++;
    }

    return resultDate;
  }

  /**
   * Add working hours to a date (minute-by-minute iteration for precision)
   * Following the exact algorithm from specifications
   */
  private static async addWorkingHours(
    startDate: DateTime,
    hoursToAdd: number,
    holidays: string[]
  ): Promise<DateTime> {
    let resultDate = startDate;
    let remainingMinutes = Math.round(hoursToAdd * 60);

    while (remainingMinutes > 0) {
      // A. Chequeo y Salto de Días No Hábiles
      while (this.isNonWorkingDay(resultDate, holidays)) {
        // Si no es un día hábil, avanza al inicio (8:00 AM) del siguiente día hábil.
        resultDate = resultDate.plus({ days: 1 }).set({ 
          hour: WORKING_HOURS.start, 
          minute: 0, 
          second: 0, 
          millisecond: 0 
        });
        continue; // Revisa el nuevo día
      }

      // B. Chequeo de Horas No Hábiles (Fuera de 8 AM - 5 PM)
      const hour = resultDate.hour;

      if (hour < WORKING_HOURS.start) {
        // Si es antes de las 8:00 AM, ajusta a las 8:00 AM del mismo día.
        resultDate = resultDate.set({ 
          hour: WORKING_HOURS.start, 
          minute: 0, 
          second: 0, 
          millisecond: 0 
        });
        continue;
      }

      if (hour >= WORKING_HOURS.end) { 
        // Si es 5:00 PM o más tarde, debe saltar al inicio del siguiente día hábil.
        resultDate = resultDate.plus({ days: 1 }).set({ 
          hour: WORKING_HOURS.start, 
          minute: 0, 
          second: 0, 
          millisecond: 0 
        });
        continue;
      }

      // C. CRÍTICO: Chequeo de Exclusión por Almuerzo (12:00 PM a 1:00 PM)
      if (hour >= WORKING_HOURS.lunchStart && hour < WORKING_HOURS.lunchEnd) {
        // Si cae en el bloque de 12 a 1, salta a la 1:00 PM.
        resultDate = resultDate.set({ 
          hour: WORKING_HOURS.lunchEnd, 
          minute: 0, 
          second: 0, 
          millisecond: 0 
        });
        continue;
      }

      // D. Consumo de Tiempo (El minuto actual es hábil)
      resultDate = resultDate.plus({ minutes: 1 });
      remainingMinutes -= 1;
    }

    return resultDate;
  }
}