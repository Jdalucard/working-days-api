import { expect, test, describe } from "@jest/globals";
import request from "supertest";
import app from "../../dist/server.js";

describe("API Format Validation - Extended Tests", () => {
  test("debe validar casos de error también devuelven formato correcto", async () => {
    const errorCases = [
      {
        name: "Sin parámetros",
        query: {},
        expectedStatus: 400
      },
      {
        name: "Días negativos",
        query: { days: "-1", date: "2025-01-15T10:00:00.000Z" },
        expectedStatus: 400
      },
      {
        name: "Fecha inválida",
        query: { days: "1", date: "invalid-date" },
        expectedStatus: 400
      }
    ];

    for (const testCase of errorCases) {
      console.log(`\nTesting error case: ${testCase.name}`);
      const response = await request(app)
        .get("/api/working-days")
        .query(testCase.query)
        .expect(testCase.expectedStatus);

      console.log(`Error response: ${JSON.stringify(response.body, null, 2)}`);
    
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    }
  });

  test("debe verificar casos extremos de formato", async () => {
    const extremeCases = [
      {
        name: "0 días y 0 horas",
        query: { days: "0", hours: "0", date: "2025-01-15T12:30:00.000Z" }
      },
      {
        name: "Días fraccionarios",
        query: { days: "1.5", date: "2025-01-15T10:00:00.000Z" }
      },
      {
        name: "Horas fraccionarias",
        query: { hours: "0.5", date: "2025-01-15T10:00:00.000Z" }
      },
      {
        name: "Números muy pequeños",
        query: { hours: "0.01", date: "2025-01-15T10:00:00.000Z" }
      }
    ];

    for (const testCase of extremeCases) {
      console.log(`\nTesting extreme case: ${testCase.name}`);
      const response = await request(app)
        .get("/api/working-days")
        .query(testCase.query)
        .expect(200);

      console.log(`Query: ${JSON.stringify(testCase.query)}`);
      console.log(`Response: ${JSON.stringify(response.body, null, 2)}`);

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(response.body.date).toMatch(iso8601Regex);
      expect(response.body.date).toHaveLength(24);
      
    
      const parsedDate = new Date(response.body.date);
      expect(parsedDate).toBeInstanceOf(Date);
      expect(isNaN(parsedDate.getTime())).toBe(false);
    }
  });

  test("debe verificar headers de respuesta", async () => {
    const response = await request(app)
      .get("/api/working-days")
      .query({ days: "1", date: "2025-01-15T10:00:00.000Z" })
      .expect(200);

    console.log('Response headers:');
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Length:', response.headers['content-length']);
    
 
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  test("debe verificar que la respuesta cumple con JSON Schema", async () => {
    const response = await request(app)
      .get("/api/working-days")
      .query({ days: "2", hours: "3", date: "2025-01-15T10:00:00.000Z" })
      .expect(200);

    console.log('Schema validation test:', JSON.stringify(response.body, null, 2));
    

    expect(response.body).toMatchObject({
      date: expect.any(String)
    });
    
   
    const keys = Object.keys(response.body);
    expect(keys).toEqual(['date']);
    
    // Verificar que el string de fecha es exactamente ISO 8601
    const dateString = response.body.date;
    expect(typeof dateString).toBe('string');
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    
    // Verificar que parsea correctamente a Date
    const parsed = new Date(dateString);
    expect(parsed.toISOString()).toBe(dateString);
  });
});