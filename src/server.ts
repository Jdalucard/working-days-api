import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import { WorkingDaysController } from "./controllers/workingDaysController.js";
import errorHandler from "./middleware/errorHandler.js";
import { PORT } from "./const/constants.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const workingDaysController = new WorkingDaysController();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Service is healthy" });
});

app.get("/api/working-days", workingDaysController.calculateWorkingDays);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(` Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api/working-days`);
  });
}

export default app;
