export interface WorkingDaysRequest {
  days?: number;
  hours?: number;
  date?: string;
}

export interface WorkingDaysResponse {
  date: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface WorkingHours {
  start: number; // 8 (8:00 AM)
  lunchStart: number; // 12 (12:00 PM)
  lunchEnd: number; // 13 (1:00 PM)
  end: number; // 17 (5:00 PM)
}