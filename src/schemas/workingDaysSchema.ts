import { z } from "zod";

export const WorkingDaysSchema = z
  .object({
    days: z.coerce
      .number()
      .min(0, "Days must be a non-negative number.")
      .optional(),
    hours: z.coerce
      .number()
      .min(0, "Hours must be a non-negative number.")
      .optional(),
    date: z
      .string()
      .datetime({ offset: true, message: "Date must be a valid ISO 8601 string with offset (e.g., '...Z')." })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const daysIsMissing = data.days === undefined;
    const hoursIsMissing = data.hours === undefined;

    if (daysIsMissing && hoursIsMissing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one parameter (days or hours) must be provided.",
        path: ["days", "hours"],
      });
      return;
    }
  });

export type ValidatedWorkingDaysRequest = z.infer<typeof WorkingDaysSchema>;


