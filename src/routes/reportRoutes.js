import express from "express";
import { Routeguard } from '../middleware/auth.js';
import ReportController from "../controllers/reportController.js"

const reportRoutes = express.Router();

reportRoutes.post("/create", Routeguard, ReportController.createReport);
reportRoutes.get("/activityReport", Routeguard, ReportController.getReports);
reportRoutes.get("/activityReportByID/:id", Routeguard, ReportController.getReportById);
reportRoutes.put("/updateActivityReport/:id", Routeguard, ReportController.updateReport);
reportRoutes.delete("/deleteActivityReport/:id", Routeguard, ReportController.deleteReport);
reportRoutes.get("/export", Routeguard, ReportController.exportReports);

export default reportRoutes;