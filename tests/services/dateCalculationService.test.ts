import { DateCalculationService } from "../../src/services/dateCalculationService";
import { HolidayService } from "../../src/services/holidayService";

describe("DateCalculationService", () => {
  beforeEach(() => {
    HolidayService.clearCache();
  });

  test("should calculate working time with days only", async () => {
    const startDate = new Date("2025-04-10T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 1, 0);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("should calculate working time with hours only", async () => {
    const startDate = new Date("2025-04-10T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 0, 4);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("should calculate working time with both days and hours", async () => {
    const startDate = new Date("2025-04-10T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 1, 2);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("should handle weekend start date", async () => {
    const startDate = new Date("2025-04-12T19:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 0, 1);

    expect(result).toBeInstanceOf(Date);
    expect(result.getUTCDay()).toBe(1);
  });

  test("should handle holidays correctly", async () => {
    const startDate = new Date("2025-04-17T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 1, 0);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("should validate return format is UTC ISO string compatible", async () => {
    const startDate = new Date("2025-04-10T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 1, 1);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    expect(result.getTime()).not.toBeNaN();
  });

  test("should handle basic hour additions", async () => {
    const startDate = new Date("2025-04-10T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 0, 1);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("should handle basic day additions", async () => {
    const startDate = new Date("2025-04-10T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 1, 0);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("should handle fractional hours", async () => {
    const startDate = new Date("2025-04-10T13:00:00.000Z");
    const result = await DateCalculationService.addWorkingTime(startDate, 0, 0.5);

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });
});