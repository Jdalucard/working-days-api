import { expect, test, describe, beforeEach, jest } from "@jest/globals";
import { Request, Response } from "express";
import { WorkingDaysController } from "../../src/controllers/workingDaysController.js";
import { DateCalculationService } from "../../src/services/dateCalculationService.js";

describe("WorkingDaysController", () => {
  let controller: WorkingDaysController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockAddWorkingTime: any;

  beforeEach(() => {
    controller = new WorkingDaysController();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock response object
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    
    mockResponse = {
      status: mockStatus as any,
      json: mockJson as any,
    };

    // Spy on DateCalculationService
    mockAddWorkingTime = jest.spyOn(DateCalculationService, 'addWorkingTime');
  });

  describe("calculateWorkingDays - Casos exitosos", () => {
    test("debe devolver fecha en formato ISO 8601 válido con milisegundos", async () => {
      // Arrange
      const expectedDate = new Date("2025-04-15T14:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          days: "5",
          hours: "4",
          date: "2025-04-10T15:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        date: "2025-04-15T14:00:00.000Z" // Debe incluir milisegundos
      });
      
      // Verificar que la fecha devuelta es válida ISO 8601
      const responseCall = mockJson.mock.calls[0][0] as { date: string };
      expect(responseCall.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test("debe usar fecha actual cuando no se proporciona date", async () => {
      // Arrange
      const mockCurrentDate = new Date("2025-01-15T10:00:00.000Z");
      const expectedResult = new Date("2025-01-16T10:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedResult);
      
      // Mock Date constructor para que use una fecha fija
      const OriginalDate = global.Date;
      global.Date = jest.fn(() => mockCurrentDate) as any;
      global.Date.UTC = OriginalDate.UTC;
      global.Date.parse = OriginalDate.parse;
      global.Date.now = OriginalDate.now;

      mockRequest = {
        query: {
          days: "1"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        mockCurrentDate,
        1,
        0
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        date: "2025-01-16T10:00:00.000Z"
      });

      // Restore original Date
      global.Date = OriginalDate;
    });

    test("debe manejar solo horas sin días", async () => {
      // Arrange
      const expectedDate = new Date("2025-01-15T13:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          hours: "3",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00.000Z"),
        0,
        3
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        date: "2025-01-15T13:00:00.000Z"
      });
    });

    test("debe manejar solo días sin horas", async () => {
      // Arrange
      const expectedDate = new Date("2025-01-18T10:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          days: "3",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00.000Z"),
        3,
        0
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test("debe manejar días fraccionarios", async () => {
      // Arrange
      const expectedDate = new Date("2025-01-16T12:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          days: "1.25",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00.000Z"),
        1.25,
        0
      );
    });

    test("debe manejar horas fraccionarias", async () => {
      // Arrange
      const expectedDate = new Date("2025-01-15T10:30:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          hours: "0.5",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00.000Z"),
        0,
        0.5
      );
    });
  });

  describe("calculateWorkingDays - Validación de parámetros", () => {
    test("debe devolver error 400 cuando no se proporcionan días ni horas", async () => {
      // Arrange
      mockRequest = {
        query: {
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "InvalidParameters",
        message: "At least one parameter (days or hours) must be provided."
      });
    });

    test("debe devolver error 400 cuando days es negativo", async () => {
      // Arrange
      mockRequest = {
        query: {
          days: "-1",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "InvalidParameters",
        message: "Days must be a non-negative number."
      });
    });

    test("debe devolver error 400 cuando hours es negativo", async () => {
      // Arrange
      mockRequest = {
        query: {
          hours: "-5",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "InvalidParameters",
        message: "Hours must be a non-negative number."
      });
    });

    test("debe devolver error 400 cuando date no es ISO 8601 válido", async () => {
      // Arrange
      mockRequest = {
        query: {
          days: "1",
          date: "invalid-date"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "InvalidParameters",
        message: "Date must be a valid ISO 8601 string with offset (e.g., '...Z')."
      });
    });

    test("debe devolver error 400 cuando date no tiene offset", async () => {
      // Arrange
      mockRequest = {
        query: {
          days: "1",
          date: "2025-01-15T10:00:00" // Sin Z ni offset
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "InvalidParameters",
        message: "Date must be a valid ISO 8601 string with offset (e.g., '...Z')."
      });
    });

    test("debe devolver error 400 cuando days no es número", async () => {
      // Arrange
      mockRequest = {
        query: {
          days: "invalid-number",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "InvalidParameters",
        message: "Invalid input: expected number, received NaN"
      });
    });
  });

  describe("calculateWorkingDays - Manejo de errores", () => {
    test("debe devolver error 503 cuando DateCalculationService falla", async () => {
      // Arrange
      mockAddWorkingTime.mockRejectedValue(new Error("Service error"));
      
      mockRequest = {
        query: {
          days: "1",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        error: "ServiceUnavailable",
        message: "Unable to calculate working days"
      });
      expect(consoleSpy).toHaveBeenCalledWith("Error calculating working days:", expect.any(Error));

      // Restore console.error
      consoleSpy.mockRestore();
    });

    test("debe devolver error 503 cuando hay excepción inesperada", async () => {
      // Arrange
      mockAddWorkingTime.mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      
      mockRequest = {
        query: {
          days: "1",
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        error: "ServiceUnavailable",
        message: "Unable to calculate working days"
      });

      consoleSpy.mockRestore();
    });
  });

  describe("calculateWorkingDays - Casos edge y formatos", () => {
    test("debe manejar valores cero correctamente", async () => {
      // Arrange
      const inputDate = new Date("2025-01-15T12:30:00.000Z");
      const expectedDate = new Date("2025-01-15T13:00:00.000Z"); // Normalizada después del almuerzo
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          days: "0",
          hours: "0",
          date: "2025-01-15T12:30:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        inputDate,
        0,
        0
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        date: "2025-01-15T13:00:00.000Z"
      });
    });

    test("debe preservar formato ISO 8601 completo con diferentes offsets", async () => {
      // Arrange  
      const expectedDate = new Date("2025-01-15T14:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          hours: "1",
          date: "2025-01-15T10:00:00-05:00" // Offset diferente
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
      
      const responseCall = mockJson.mock.calls[0][0] as { date: string };
      // La respuesta debe estar en UTC y ser válida ISO 8601
      expect(responseCall.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(responseCall.date).toBe("2025-01-15T14:00:00.000Z");
    });

    test("debe manejar fechas de fin de semana correctamente", async () => {
      // Arrange
      const expectedDate = new Date("2025-01-13T09:00:00.000Z"); // Lunes siguiente
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          hours: "1",
          date: "2025-01-11T14:00:00.000Z" // Sábado
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        date: "2025-01-13T09:00:00.000Z"
      });
    });

    test("debe manejar números como strings en query parameters", async () => {
      // Arrange
      const expectedDate = new Date("2025-01-16T12:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          days: "1.5", // String que representa número
          hours: "2.25", // String que representa número
          date: "2025-01-15T10:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00.000Z"),
        1.5,
        2.25
      );
    });
  });

  describe("calculateWorkingDays - Integración con casos reales", () => {
    test("debe manejar el ejemplo del test-api.http: 5 días + 4 horas", async () => {
      // Arrange - Usando una fecha y resultado realista
      const inputDate = new Date("2025-04-10T15:00:00.000Z");
      const expectedDate = new Date("2025-04-17T14:00:00.000Z");
      mockAddWorkingTime.mockResolvedValue(expectedDate);
      
      mockRequest = {
        query: {
          days: "5",
          hours: "4",
          date: "2025-04-10T15:00:00.000Z"
        }
      };

      // Act
      await controller.calculateWorkingDays(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAddWorkingTime).toHaveBeenCalledWith(
        inputDate,
        5,
        4
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        date: "2025-04-17T14:00:00.000Z"
      });
      
      // Verificar formato ISO 8601 válido
      const responseCall = mockJson.mock.calls[0][0] as { date: string };
      expect(responseCall.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});