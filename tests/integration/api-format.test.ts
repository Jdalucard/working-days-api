import { expect, test, describe } from "@jest/globals";
import request from "supertest";
import app from "../../dist/server.js";

describe("API Integration Tests - Date Format", () => {
  test("debe devolver formato ISO 8601 completo con milisegundos", async () => {
    const response = await request(app)
      .get("/api/working-days")
      .query({
        date: "2025-04-10T15:00:00.000Z",
        days: "5",
        hours: "4"
      })
      .expect(200)
      .expect("Content-Type", /json/);

    console.log("Full Response:", JSON.stringify(response.body, null, 2));
    console.log("Date value:", response.body.date);
    console.log("Date length:", response.body.date?.length);
    console.log("Has milliseconds:", response.body.date?.includes('.'));
    
    // Verificar que es formato ISO 8601 con milisegundos
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(response.body.date).toMatch(iso8601Regex);
    expect(response.body.date).toHaveLength(24); 
  });

  test("debe verificar todos los casos del test-api.http", async () => {
    const testCases = [
      {
        name: "Viernes 5 PM + 1 hora = Lunes 9 AM",
        query: { date: "2025-01-10T22:00:00.000Z", hours: "1" }
      },
      {
        name: "Fin de Semana: Sábado 2 PM + 1 hora = Lunes 9 AM",
        query: { date: "2025-01-11T19:00:00.000Z", hours: "1" }
      },
      {
        name: "Combinado: 1 día + 4 horas",
        query: { date: "2025-01-07T20:00:00.000Z", days: "1", hours: "4" }
      },
      {
        name: "Ejemplo de Requisitos: 5 días + 4 horas",
        query: { date: "2025-04-10T15:00:00.000Z", days: "5", hours: "4" }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      const response = await request(app)
        .get("/api/working-days")
        .query(testCase.query)
        .expect(200);

      console.log(`Query: ${JSON.stringify(testCase.query)}`);
      console.log(`Response date: ${response.body.date}`);
      console.log(`Length: ${response.body.date?.length}`);
      
  
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(response.body.date).toMatch(iso8601Regex);
    }
  });
});