import { Request, Response } from "express";
import { DateCalculationService } from "../services/dateCalculationService.js";
import { WorkingDaysSchema, ValidatedWorkingDaysRequest } from "../schemas/workingDaysSchema.js";
import {
  WorkingDaysResponse,
  ErrorResponse,
} from "../types/index.js";

export class WorkingDaysController {
  constructor() {}

  public calculateWorkingDays = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const validationResult = WorkingDaysSchema.safeParse(req.query);
      if (!validationResult.success) {
        const firstIssue = validationResult.error.issues[0];
        const errorResponse: ErrorResponse = {
          error: "InvalidParameters",
          message: firstIssue?.message || "Invalid query parameters.",
        };
        return res.status(400).json(errorResponse);
      }

      const validated = validationResult.data as ValidatedWorkingDaysRequest;
      const daysNum = validated.days ?? 0;
      const hoursNum = validated.hours ?? 0;

      const startDate: Date = validated.date ? new Date(validated.date) : new Date();

      const resultDate = await DateCalculationService.addWorkingTime(
        startDate,
        daysNum,
        hoursNum
      );

      const response: WorkingDaysResponse = {
        date: resultDate.toISOString(),
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error calculating working days:", error);
      const errorResponse: ErrorResponse = {
        error: "ServiceUnavailable",
        message: "Unable to calculate working days",
      };
      return res.status(503).json(errorResponse);
    }
  };
}
