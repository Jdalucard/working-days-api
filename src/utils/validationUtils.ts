import { WorkingDaysRequest } from "../types/index.js";

export class ValidationUtils {
  static validateRequest(query: WorkingDaysRequest): {
    isValid: boolean;
    error?: string;
  } {
    const { days, hours, date } = query as WorkingDaysRequest;

    if (!days && !hours) {
      return {
        isValid: false,
        error: "At least one parameter (days or hours) must be provided",
      };
    }

    if (days !== undefined) {
      const daysNum = Number(days);
      if (isNaN(daysNum) || daysNum <= 0 || !Number.isInteger(daysNum)) {
        return {
          isValid: false,
          error: "Days parameter must be a positive integer",
        };
      }
    }

    if (hours !== undefined) {
      const hoursNum = Number(hours);
      if (isNaN(hoursNum) || hoursNum <= 0) {
        return {
          isValid: false,
          error: "Hours parameter must be a positive number",
        };
      }
    }

    if (date !== undefined) {
      if (typeof date !== "string" || !date.endsWith("Z")) {
        return {
          isValid: false,
          error: "Date parameter must be a valid ISO 8601 string with Z suffix",
        };
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return {
          isValid: false,
          error: "Date parameter must be a valid ISO 8601 date",
        };
      }
    }

    return { isValid: true };
  }
}