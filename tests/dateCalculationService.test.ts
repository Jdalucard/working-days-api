import { DateTime } from "luxon";
import { DateCalculationService } from "../src/services/dateCalculationService.js";

const TZ = "America/Bogota";

function bogotaToUtcDate(isoLocal: string): Date {
  return DateTime.fromISO(isoLocal, { zone: TZ }).toUTC().toJSDate();
}

describe("DateCalculationService.addWorkingTime", () => {
  test("cruce de días: viernes 16:30 + 2h = lunes 09:30 (Bogotá)", async () => {
    const start = DateTime.fromISO("2025-10-03T16:30:00", { zone: TZ }).toJSDate(); 
    const result = await DateCalculationService.addWorkingTime(start, 0, 2);
    const expected = bogotaToUtcDate("2025-10-06T09:30:00");
    expect(result.toISOString()).toBe(expected.toISOString());
  });

  test("medio día desde 11:00 salta almuerzo: 0.5 días = 16:00 (Bogotá)", async () => {
    const start = DateTime.fromISO("2025-10-01T11:00:00", { zone: TZ }).toJSDate();
    const result = await DateCalculationService.addWorkingTime(start, 0.5, 0);
    const expected = bogotaToUtcDate("2025-10-01T16:00:00");
    expect(result.toISOString()).toBe(expected.toISOString());
  });

  test("inicio fuera de horario: 07:30 + 1h = 09:00 (Bogotá)", async () => {
    const start = DateTime.fromISO("2025-10-01T07:30:00", { zone: TZ }).toJSDate();
    const result = await DateCalculationService.addWorkingTime(start, 0, 1);
    const expected = bogotaToUtcDate("2025-10-01T09:00:00");
    expect(result.toISOString()).toBe(expected.toISOString());
  });

  test("inicio en almuerzo: 12:15 + 1h = 14:00 (Bogotá)", async () => {
    const start = DateTime.fromISO("2025-10-01T12:15:00", { zone: TZ }).toJSDate();
    const result = await DateCalculationService.addWorkingTime(start, 0, 1);
    const expected = bogotaToUtcDate("2025-10-01T14:00:00");
    expect(result.toISOString()).toBe(expected.toISOString());
  });

  test("días fraccionarios + horas: 1.25 días + 1h desde 10:00 = 11:00 al día hábil siguiente (Bogotá)", async () => {
    const start = DateTime.fromISO("2025-10-01T10:00:00", { zone: TZ }).toJSDate();
    const result = await DateCalculationService.addWorkingTime(start, 1.25, 1);
    const expected = bogotaToUtcDate("2025-10-02T11:00:00");
    expect(result.toISOString()).toBe(expected.toISOString());
  });
});



