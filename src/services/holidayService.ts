import axios from "axios";
import { HOLIDAYS_API_URL, COLOMBIA_HOLIDAYS } from "../const/constants.js";

export class HolidayService {
  private static holidayCache: string[] | null = null;

  static async getHolidays(): Promise<string[]> {
    if (this.holidayCache) {
      return this.holidayCache;
    }

    try {
      const response = await axios.get<string[] | unknown>(HOLIDAYS_API_URL, {
        timeout: 5000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        this.holidayCache = response.data as string[];
        return response.data as string[];
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.warn("Failed to fetch holidays from API:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
      } else {
        console.warn("Unknown error fetching holidays:", error);
      }
    }

    console.info("Using fallback holiday data");
    this.holidayCache = COLOMBIA_HOLIDAYS;
    return COLOMBIA_HOLIDAYS;
  }

  static async isHoliday(date: Date): Promise<boolean> {
    const holidays = await this.getHolidays();

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    const dateString = y && m && d ? `${y}-${m}-${d}` : undefined;
    return dateString ? holidays.includes(dateString) : false;
  }

  static clearCache(): void {
    this.holidayCache = null;
  }

  static async getHolidaysCount(): Promise<number> {
    const holidays = await this.getHolidays();
    return holidays.length;
  }
}
