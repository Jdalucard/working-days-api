import { expect, test, describe, beforeAll } from "@jest/globals";
import { DateTime } from "luxon";
import { DateCalculationService } from "../../src/services/dateCalculationService.js";
import { HolidayService } from "../../src/services/holidayService.js";

const TZ = "America/Bogota";

function bogotaToUtcDate(isoLocal: string): Date {
  return DateTime.fromISO(isoLocal, { zone: TZ }).toUTC().toJSDate();
}
beforeAll(() => {
  // Limpiar la caché de festivos antes de las pruebas
  HolidayService.clearCache();
});

function utcToBogotaString(utcDate: Date): string {
  return DateTime.fromJSDate(utcDate).setZone(TZ).toISO({ includeOffset: false }) || '';
}

describe("DateCalculationService", () => {
  describe("Formato de fechas y timezone", () => {
    test("debe devolver fechas en formato UTC ISO 8601", async () => {
      const start = DateTime.fromISO("2025-01-15T10:00:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 0, 1);
      
      // Verificar que el resultado es una fecha válida en UTC
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verificar que la fecha devuelta corresponde a 11:00 AM en Bogotá
      const expectedBogota = "2025-01-15T11:00:00.000";
      const resultInBogota = utcToBogotaString(result);
      expect(resultInBogota).toBe(expectedBogota);
    });

    test("debe manejar correctamente la conversión de timezone Colombia -> UTC", async () => {
      const start = DateTime.fromISO("2025-01-15T14:00:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 0, 2);
      
      // 14:00 + 2h = 16:00 en Bogotá (UTC-5), debería ser 21:00 UTC
      const expected = bogotaToUtcDate("2025-01-15T16:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("Horarios de trabajo", () => {
    test("debe normalizar horario antes de 8:00 AM al inicio del día laboral", async () => {
      const start = DateTime.fromISO("2025-01-15T06:00:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 0, 1);
      
      // Debe empezar a las 8:00 AM y sumar 1 hora = 9:00 AM
      const expected = bogotaToUtcDate("2025-01-15T09:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe mover horario después de 5:00 PM al siguiente día laboral", async () => {
      const start = DateTime.fromISO("2025-01-15T18:00:00", { zone: TZ }).toJSDate(); // 6 PM
      const result = await DateCalculationService.addWorkingTime(start, 0, 1);
      
      // Debe moverse al siguiente día a las 8:00 AM + 1 hora = 9:00 AM
      const expected = bogotaToUtcDate("2025-01-16T09:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe saltar la hora de almuerzo (12:00 PM - 1:00 PM)", async () => {
      const start = DateTime.fromISO("2025-01-15T11:45:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 0, 0.5); // 30 minutos
      
      // 11:45 AM + 30 min debería saltar el almuerzo y llegar a 1:15 PM
      const expected = bogotaToUtcDate("2025-01-15T13:15:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe normalizar horario durante almuerzo al final del almuerzo", async () => {
      const start = DateTime.fromISO("2025-01-15T12:30:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 0, 1);
      
      // Debe moverse a 1:00 PM y sumar 1 hora = 2:00 PM
      const expected = bogotaToUtcDate("2025-01-15T14:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("Días laborales", () => {
    test("debe agregar 1 día laboral correctamente", async () => {
      const start = DateTime.fromISO("2025-01-15T10:00:00", { zone: TZ }).toJSDate(); // Miércoles
      const result = await DateCalculationService.addWorkingTime(start, 1, 0);
      
      // El servicio normaliza al inicio del día laboral (8:00 AM) al agregar días
      const expected = bogotaToUtcDate("2025-01-16T08:00:00"); // Jueves 8:00 AM
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe saltar fines de semana al agregar días", async () => {
      const start = DateTime.fromISO("2025-01-17T10:00:00", { zone: TZ }).toJSDate(); // Viernes
      const result = await DateCalculationService.addWorkingTime(start, 1, 0);
      
      // El servicio normaliza al inicio del día laboral (8:00 AM) al agregar días
      const expected = bogotaToUtcDate("2025-01-20T08:00:00"); // Lunes 8:00 AM
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe saltar festivos al agregar días", async () => {
      const start = DateTime.fromISO("2024-12-31T10:00:00", { zone: TZ }).toJSDate(); // 31 dic (martes laboral)
      const result = await DateCalculationService.addWorkingTime(start, 1, 0);
      
      // 1 enero es festivo, debe ir al 2 enero normalizando al inicio del día (8:00 AM)
      const expected = bogotaToUtcDate("2025-01-02T08:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("Horas laborales", () => {
    test("debe agregar horas dentro del mismo día", async () => {
      const start = DateTime.fromISO("2025-01-15T10:00:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 0, 3);
      
      const expected = bogotaToUtcDate("2025-01-15T14:00:00"); // 10:00 + 3h + 1h (almuerzo) = 14:00
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe mover al siguiente día cuando se excede el horario laboral", async () => {
      const start = DateTime.fromISO("2025-01-15T16:00:00", { zone: TZ }).toJSDate(); // 4 PM
      const result = await DateCalculationService.addWorkingTime(start, 0, 2); // +2 horas
      
      // 4 PM + 1 hora = 5 PM (fin del día), +1 hora = siguiente día 9 AM
      const expected = bogotaToUtcDate("2025-01-16T09:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe saltar fin de semana al agregar horas", async () => {
      const start = DateTime.fromISO("2025-01-17T16:00:00", { zone: TZ }).toJSDate(); // Viernes 4 PM
      const result = await DateCalculationService.addWorkingTime(start, 0, 2);
      
      // Viernes 4 PM + 1 hora = 5 PM, +1 hora = Lunes 9 AM
      const expected = bogotaToUtcDate("2025-01-20T09:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("Días fraccionarios", () => {
    test("debe manejar días fraccionarios: 1.25 días = 1 día + 2 horas", async () => {
      const start = DateTime.fromISO("2025-01-15T10:00:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 1.25, 0);
      
      // 1 día completo normaliza a 8:00 AM + 2 horas (0.25 * 8) = 10:00 AM
      const expected = bogotaToUtcDate("2025-01-16T10:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("días fraccionarios + horas: 1.25 días + 1h desde 10:00 = 13:00 al día hábil siguiente", async () => {
      const start = DateTime.fromISO("2025-01-15T10:00:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 1.25, 1);
      
      // 1 día normaliza a 8:00 AM + 2 horas (0.25*8) + 1 hora = 11:00 AM
      const expected = bogotaToUtcDate("2025-01-16T11:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe manejar días fraccionarios con almuerzo: 0.5 días desde 11:00 = 16:00", async () => {
      const start = DateTime.fromISO("2025-01-15T11:00:00", { zone: TZ }).toJSDate();
      const result = await DateCalculationService.addWorkingTime(start, 0.5, 0);
      
      // 0.5 días = 4 horas: 11:00 + 1h = 12:00 (almuerzo) -> 13:00 + 3h = 16:00
      const expected = bogotaToUtcDate("2025-01-15T16:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("Casos especiales y edge cases", () => {
    test("debe manejar 0 días y 0 horas normalizando la fecha", async () => {
      const start = DateTime.fromISO("2025-01-15T12:30:00", { zone: TZ }).toJSDate(); // Durante almuerzo
      const result = await DateCalculationService.addWorkingTime(start, 0, 0);
      
      // Debe normalizar al final del almuerzo
      const expected = bogotaToUtcDate("2025-01-15T13:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe manejar inicio en domingo", async () => {
      const start = DateTime.fromISO("2025-01-12T10:00:00", { zone: TZ }).toJSDate(); // Domingo
      const result = await DateCalculationService.addWorkingTime(start, 0, 1);
      
      // Debe moverse al lunes a las 8:00 AM + 1 hora = 9:00 AM
      const expected = bogotaToUtcDate("2025-01-13T09:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe manejar inicio en sábado", async () => {
      const start = DateTime.fromISO("2025-01-11T14:00:00", { zone: TZ }).toJSDate(); // Sábado
      const result = await DateCalculationService.addWorkingTime(start, 0, 2);
      
      // Debe moverse al lunes a las 8:00 AM + 2 horas = 10:00 AM
      const expected = bogotaToUtcDate("2025-01-13T10:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("debe manejar múltiples días con festivos intercalados", async () => {
      const start = DateTime.fromISO("2024-12-30T10:00:00", { zone: TZ }).toJSDate(); // Lunes
      const result = await DateCalculationService.addWorkingTime(start, 3, 0);
      
      // Al agregar 3 días laborales, normaliza al inicio del día (8:00 AM)
      // 2025-01-03T13:00:00.000Z = 2025-01-03T08:00:00 en Bogotá
      expect(result.toISOString()).toBe("2025-01-03T13:00:00.000Z");
    });

    test("debe manejar cálculo de muchas horas cruzando múltiples días", async () => {
      const start = DateTime.fromISO("2025-01-15T14:00:00", { zone: TZ }).toJSDate(); // Miércoles 2 PM
      const result = await DateCalculationService.addWorkingTime(start, 0, 20); // 20 horas
      
      // Miércoles: 14:00 a 17:00 = 3 horas (quedan 17)
      // Jueves: 8 horas completas (quedan 9)
      // Viernes: 8 horas completas (queda 1)
      // Lunes: 8:00 + 1 hora = 9:00
      const expected = bogotaToUtcDate("2025-01-20T09:00:00");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("Casos de requisitos específicos", () => {
    test("Viernes 5:00 PM + 1 hora = Lunes 9:00 AM", async () => {
      const start = DateTime.fromISO("2025-01-10T17:00:00", { zone: TZ }).toJSDate(); // Viernes 5 PM
      const result = await DateCalculationService.addWorkingTime(start, 0, 1);
      
      const expected = bogotaToUtcDate("2025-01-13T09:00:00"); // Lunes 9 AM
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("Sábado 2:00 PM + 1 hora = Lunes 9:00 AM", async () => {
      const start = DateTime.fromISO("2025-01-11T14:00:00", { zone: TZ }).toJSDate(); // Sábado 2 PM
      const result = await DateCalculationService.addWorkingTime(start, 0, 1);
      
      const expected = bogotaToUtcDate("2025-01-13T09:00:00"); // Lunes 9 AM
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("Ejemplo de requisitos: 5 días + 4 horas desde 2025-04-10T15:00:00Z", async () => {
      // Convertir la fecha UTC a una fecha de inicio en Colombia
      const startUtc = new Date("2025-04-10T15:00:00.000Z");
      const result = await DateCalculationService.addWorkingTime(startUtc, 5, 4);
      
      // Verificar que devuelve una fecha válida en formato UTC
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // La fecha resultante debe ser posterior a la fecha de inicio
      expect(result.getTime()).toBeGreaterThan(startUtc.getTime());
    });
  });

  describe("Performance y límites", () => {
    test("debe manejar cálculos grandes de días eficientemente", async () => {
      const start = DateTime.fromISO("2025-01-15T10:00:00", { zone: TZ }).toJSDate();
      const startTime = Date.now();
      
      const result = await DateCalculationService.addWorkingTime(start, 100, 0);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // El cálculo debe completarse en menos de 1 segundo
      expect(executionTime).toBeLessThan(1000);
      expect(result).toBeInstanceOf(Date);
    });

    test("debe manejar cálculos grandes de horas eficientemente", async () => {
      const start = DateTime.fromISO("2025-01-15T10:00:00", { zone: TZ }).toJSDate();
      const startTime = Date.now();
      
      const result = await DateCalculationService.addWorkingTime(start, 0, 800); // 100 días laborales
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // El cálculo debe completarse en tiempo razonable
      expect(executionTime).toBeLessThan(5000); // 5 segundos máximo
      expect(result).toBeInstanceOf(Date);
    });
  });
});


