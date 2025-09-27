import request from 'supertest';
import app from '../../src/server'; 
import { WorkingDaysController } from '../../src/controllers/workingDaysController';

describe('WorkingDaysController', () => {
  let workingDaysController: WorkingDaysController;

  beforeAll(() => {
    workingDaysController = new WorkingDaysController();
  });

  it('should return a valid date when adding working days', async () => {
    const response = await request(app)
      .get('/api/working-days') 
      .query({ days: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('date');
    expect(typeof response.body.date).toBe('string');
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should return a valid date when adding working hours', async () => {
    const response = await request(app)
      .get('/api/working-days') 
      .query({ hours: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('date');
    expect(typeof response.body.date).toBe('string');
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should return an error for invalid parameters', async () => {
    const response = await request(app)
      .get('/api/working-days'); 

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'InvalidParameters');
    expect(response.body).toHaveProperty('message');
  });

  it('should handle a date parameter correctly', async () => {
    const response = await request(app)
      .get('/api/working-days') 
      .query({ date: '2025-04-10T15:00:00.000Z', days: 5 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('date');
    expect(typeof response.body.date).toBe('string');
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should return error for negative days', async () => {
    const response = await request(app)
      .get('/api/working-days') 
      .query({ days: -1 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'InvalidParameters');
  });

  it('should return error for invalid date format', async () => {
    const response = await request(app)
      .get('/api/working-days') 
      .query({ date: '2025-04-10T15:00:00', days: 1 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'InvalidParameters');
  });

  it('should handle fractional hours correctly', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ hours: '1.5' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('date');
    expect(typeof response.body.date).toBe('string');
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should return error for zero values', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ days: 0 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'InvalidParameters');
  });

  it('should handle both days and hours parameters', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ days: 1, hours: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('date');
    expect(typeof response.body.date).toBe('string');
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should handle health check endpoint', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ 
      status: 'OK', 
      message: 'Service is healthy' 
    });
  });

  it('should handle very large number of days', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ date: '2025-01-15T13:00:00.000Z', days: 100 });
        
    expect(response.status).toBe(200);
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }, 30000);

  it('should handle very large number of hours', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ date: '2025-01-15T13:00:00.000Z', hours: 100 });
        
    expect(response.status).toBe(200);
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }, 30000);

  it('should return proper UTC format with milliseconds', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ date: '2025-01-15T13:00:00.000Z', hours: 1 });
        
    expect(response.status).toBe(200);
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(response.body.date).toContain('Z');
  });

  it('should handle different timezone input formats', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ date: '2025-01-15T18:00:00.000Z', hours: 1 });
        
    expect(response.status).toBe(200);
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should handle basic day calculation', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ date: '2025-01-15T13:00:00.000Z', days: 1 });
        
    expect(response.status).toBe(200);
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should handle basic hour calculation', async () => {
    const response = await request(app)
      .get('/api/working-days')
      .query({ date: '2025-01-15T13:00:00.000Z', hours: 2 });
        
    expect(response.status).toBe(200);
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});