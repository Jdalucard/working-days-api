import { Request, Response } from "express";
import { DateCalculationService } from "../services/dateCalculationService.js";
import { ValidationUtils } from "../utils/validationUtils.js";
import {
  WorkingDaysRequest,
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
      const { days, hours, date } = req.query as WorkingDaysRequest;

      const validation = ValidationUtils.validateRequest({ days, hours, date });
      if (!validation.isValid) {
        const errorResponse: ErrorResponse = {
          error: "InvalidParameters",
          message: validation.error!,
        };
        return res.status(400).json(errorResponse);
      }

      const daysNum = days ? Number(days) : 0;
      const hoursNum = hours ? Number(hours) : 0;

      let startDate: Date;
      if (date) {
        startDate = new Date(date);
      } else {
        startDate = new Date();
      }

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
