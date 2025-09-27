# Working Days API

This project is a RESTful API for calculating working days and hours in Colombia, taking into account national holidays, business hours (Monday to Friday, 8:00 AM to 5:00 PM with lunch break 12:00 PM to 1:00 PM), and Colombia timezone considerations.

## Features

- Calculate working days and hours based on user input
- Exclude Colombian national holidays from calculations
- Handle timezone conversions between Colombia (America/Bogota) and UTC
- Validate input parameters to ensure they meet required criteria
- Backward approximation for non-working times
- Precise lunch break handling (12:00 PM - 1:00 PM excluded)

## Technical Requirements

- **Node.js**: >=14.0.0
- **TypeScript**: ^5.9.2
- **Working Hours**: Monday-Friday, 8:00 AM - 5:00 PM (Colombia time)
- **Lunch Break**: 12:00 PM - 1:00 PM (excluded from working hours)
- **Timezone**: All calculations in Colombia time, responses in UTC

## Project Structure

```
working-days-api/
├── src/
│   ├── server.ts                     # Express server entry point
│   ├── controllers/
│   │   └── workingDaysController.ts  # API request handlers
│   ├── services/
│   │   ├── dateCalculationService.ts # Core business logic for date calculations
│   │   └── holidayService.ts         # Holiday management with API fallback
│   ├── utils/
│   │   ├── dateUtils.ts             # Date manipulation utilities
│   │   └── validationUtils.ts       # Input validation utilities
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces and types
│   ├── middleware/
│   │   └── errorHandler.ts          # Global error handling
│   └── const/
│       └── constants.ts             # Application constants
├── tests/
│   ├── services/
│   │   └── dateCalculationService.test.ts
│   └── controllers/
│       └── workingDaysController.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── test-api.http                    # HTTP requests for manual testing
└── README.md
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd working-days-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables in `.env`:
   ```
   PORT=4000
   HOLIDAY_API_URL=https://content.capta.co/Recruitment/WorkingDays.json
   TIMEZONE=America/Bogota
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

The API will be available at `http://localhost:4000` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- **GET** `/health`
  - Returns server status

### Calculate Working Days/Hours
- **GET** `/api/working-days`
  - **Query Parameters:**
    - `days` (optional): Number of working days to add (positive integer)
    - `hours` (optional): Number of working hours to add (positive integer, can be decimal)
    - `date` (optional): Starting date in UTC ISO 8601 format with Z suffix (e.g., `2025-04-10T15:00:00.000Z`)
  
  - **Response Format:**
    ```json
    {
      "date": "2025-04-21T20:00:00.000Z"
    }
    ```
  
  - **Error Response:**
    ```json
    {
      "error": "InvalidParameters",
      "message": "At least one parameter (days or hours) must be provided"
    }
    ```

## API Examples

### Basic Examples
```bash
# Add 1 working day
GET /api/working-days?days=1

# Add 4 working hours
GET /api/working-days?hours=4

# Add both days and hours (days first, then hours)
GET /api/working-days?days=1&hours=2

# Specify start date
GET /api/working-days?date=2025-04-10T15:00:00.000Z&days=5&hours=4
```

### Business Rules Examples

1. **Friday 5:00 PM + 1 hour = Monday 9:00 AM**
   ```
   GET /api/working-days?date=2025-01-10T22:00:00.000Z&hours=1
   ```

2. **Saturday 2:00 PM + 1 hour = Monday 9:00 AM**
   ```
   GET /api/working-days?date=2025-01-11T19:00:00.000Z&hours=1
   ```

3. **Complex calculation: 5 days + 4 hours (skipping holidays)**
   ```
   GET /api/working-days?date=2025-04-10T15:00:00.000Z&days=5&hours=4
   ```

## Business Logic

### Working Hours
- **Monday - Friday**: 8:00 AM - 5:00 PM (Colombia time)
- **Lunch Break**: 12:00 PM - 1:00 PM (excluded)
- **Weekends**: Excluded
- **Holidays**: Colombian national holidays excluded

### Calculation Rules
1. **Backward Approximation**: If start time is outside working hours/days, it's adjusted backward to the nearest working time
2. **Days First**: When both days and hours are provided, days are added first, then hours
3. **Lunch Break Handling**: Hours that fall during lunch (12:00-1:00 PM) are skipped
4. **Holiday Handling**: Colombian holidays are automatically excluded from calculations

### Timezone Handling
- Input dates are in UTC format
- All calculations performed in Colombia timezone (America/Bogota, UTC-5)
- Output dates returned in UTC format

## Testing

### Run All Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Manual Testing
Use the provided `test-api.http` file with REST Client extension in VS Code, or test endpoints manually:

```bash
# Health check
curl http://localhost:4000/health

# Basic calculation
curl "http://localhost:4000/api/working-days?days=1&hours=2"

# With specific date
curl "http://localhost:4000/api/working-days?date=2025-04-10T15:00:00.000Z&days=5"
```

## Dependencies

### Production
- **express**: Web framework
- **luxon**: Advanced date/time library with timezone support
- **axios**: HTTP client for holiday API
- **cors**: CORS middleware
- **dotenv**: Environment variable management

### Development
- **typescript**: TypeScript compiler
- **jest**: Testing framework
- **tsx**: TypeScript execution for development
- **supertest**: HTTP testing

## Error Handling

The API returns appropriate HTTP status codes:

- **200**: Success
- **400**: Invalid parameters
- **503**: Service unavailable (internal errors)

## Holiday Management

The API fetches Colombian holidays from an external API with fallback to a local list:
- **Primary**: `https://content.capta.co/Recruitment/WorkingDays.json`
- **Fallback**: Local holiday array in constants
- **Caching**: Holidays are cached during application runtime

## Performance

- **Efficient algorithms**: Optimized for large day/hour calculations
- **Memory management**: Minimal memory footprint
- **Holiday caching**: Reduces API calls
- **Minute-by-minute precision**: For accurate hour calculations

## License

This project is licensed under the MIT License.