const axios = require('axios');

// Constants
const COLOMBIA_TIMEZONE = 'America/Bogota';
const WORKING_HOURS_START = 8; // 8 AM
const WORKING_HOURS_END = 17; // 5 PM  
const LUNCH_BREAK_START = 12; // 12 PM
const LUNCH_BREAK_END = 13; // 1 PM
const WORKING_HOURS_PER_DAY = 8;
const HOLIDAYS_API_URL = "https://content.capta.co/Recruitment/WorkingDays.json";

const COLOMBIA_HOLIDAYS = [
  "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-17", "2025-04-18", 
  "2025-05-01", "2025-06-02", "2025-06-23", "2025-07-20", "2025-08-07", 
  "2025-08-18", "2025-10-13", "2025-11-03", "2025-11-17", "2025-12-08", "2025-12-25"
];

// Holiday service
class HolidayService {
  static holidayCache = null;

  static async getHolidays() {
    if (this.holidayCache) {
      return this.holidayCache;
    }

    try {
      const response = await axios.get(HOLIDAYS_API_URL, {
        timeout: 5000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 && response.data && Array.isArray(response.data)) {
        this.holidayCache = response.data;
        return response.data;
      }
    } catch (error) {
      // Use fallback holidays
    }

    this.holidayCache = COLOMBIA_HOLIDAYS;
    return COLOMBIA_HOLIDAYS;
  }

  static async isHoliday(date) {
    const holidays = await this.getHolidays();
    const dateString = date.toISOString().split("T")[0];
    return holidays.includes(dateString);
  }
}

// Validation utilities
function validateRequest(query) {
  const { days, hours, date } = query;

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

// Date calculation service
async function addWorkingTime(startDate, days, hours) {
  const result = new Date(startDate.getTime());
  
  // Convert to Colombia timezone for calculations
  const colombiaOffset = -5 * 60; // UTC-5 in minutes
  const currentOffset = result.getTimezoneOffset();
  const offsetDiff = colombiaOffset - currentOffset;
  
  // Adjust to Colombian time
  result.setMinutes(result.getMinutes() + offsetDiff);
  
  let totalHours = (days * WORKING_HOURS_PER_DAY) + hours;
  
  // If outside working hours, move to next working day start
  if (result.getHours() < WORKING_HOURS_START || result.getHours() >= WORKING_HOURS_END) {
    result.setHours(WORKING_HOURS_START, 0, 0, 0);
    if (result.getHours() >= WORKING_HOURS_END) {
      result.setDate(result.getDate() + 1);
    }
  }
  
  // Skip weekends and holidays
  while (result.getDay() === 0 || result.getDay() === 6 || await HolidayService.isHoliday(result)) {
    result.setDate(result.getDate() + 1);
    result.setHours(WORKING_HOURS_START, 0, 0, 0);
  }
  
  while (totalHours > 0) {
    const currentHour = result.getHours();
    const currentMinute = result.getMinutes();
    
    // Skip lunch break
    if (currentHour === LUNCH_BREAK_START) {
      result.setHours(LUNCH_BREAK_END, 0, 0, 0);
      continue;
    }
    
    // If at end of working day, move to next working day
    if (currentHour >= WORKING_HOURS_END) {
      result.setDate(result.getDate() + 1);
      result.setHours(WORKING_HOURS_START, 0, 0, 0);
      
      // Skip weekends and holidays
      while (result.getDay() === 0 || result.getDay() === 6 || await HolidayService.isHoliday(result)) {
        result.setDate(result.getDate() + 1);
        result.setHours(WORKING_HOURS_START, 0, 0, 0);
      }
      continue;
    }
    
    // Calculate how much time we can add before lunch or end of day
    let availableMinutes;
    if (currentHour < LUNCH_BREAK_START) {
      availableMinutes = (LUNCH_BREAK_START - currentHour) * 60 - currentMinute;
    } else {
      availableMinutes = (WORKING_HOURS_END - currentHour) * 60 - currentMinute;
    }
    
    const hoursToAdd = Math.min(totalHours, availableMinutes / 60);
    const minutesToAdd = Math.floor(hoursToAdd * 60);
    
    result.setMinutes(result.getMinutes() + minutesToAdd);
    totalHours -= hoursToAdd;
  }
  
  // Convert back to UTC
  result.setMinutes(result.getMinutes() - offsetDiff);
  
  return result;
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { days, hours, date } = event.queryStringParameters || {};

    const validation = validateRequest({ days, hours, date });
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "InvalidParameters",
          message: validation.error,
        }),
      };
    }

    const daysNum = days ? Number(days) : 0;
    const hoursNum = hours ? Number(hours) : 0;

    let startDate;
    if (date) {
      startDate = new Date(date);
    } else {
      startDate = new Date();
    }

    const resultDate = await addWorkingTime(startDate, daysNum, hoursNum);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date: resultDate.toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: "ServiceUnavailable",
        message: "Unable to calculate working days"
      }),
    };
  }
};