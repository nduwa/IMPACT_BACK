import { v4 as uuidv4 } from "uuid";
import ActivityReport from "../models/rtc_temp_activity_report.js";
import { Parser } from 'json2csv';

class ReportController {
    static async createReport(req, res) {
        try {
            
            if (!req.user) {
                return res.status(401).json({ success: false, message: "User not authenticated" });
            }

            const shadeVarieties = [
                "grevelia",
                "leucaena",  
                "markhamia",
                "umuhumuro",
                "croton",
                "acacia",
                "polyscias",
                "caliandra",
            ];

            const mappedShade = {};
            shadeVarieties.forEach((variety) => {
                const modelKey = variety.charAt(0).toUpperCase() + variety.slice(1);
                mappedShade[modelKey] = req.body[variety] || "0";
            });

            const reportData = {
                ...req.body,
                ...mappedShade,
                farmers: req.body.farmers || "0",
                women: req.body.women || "0",
                men: req.body.men || "0",
                distributedKgs: req.body.distributedKgs || "0",
                coffee: req.body.coffee || "0",
                shade: req.body.shade || "0",
                __kp_Report: uuidv4().toUpperCase(),
                full_name: req.user.userName,
                _kf_Station: req.user.__kp_Station,
                _kf_Supplier: req.user.supplier,
                CW_Name: req.user.station_name,
                _kf_Staff: req.user.__kp_Staff,
                _kf_User: req.user.__kp_User,
                date: req.body.date ? new Date(req.body.date) : new Date(),
            };

            console.log("Creating activity report with data:", reportData);

            const report = await ActivityReport.create(reportData);

            res.status(201).json({ success: true, message: "Report created successfully", data: report });
        } catch (error) {
            console.error("Error creating report:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create report",
                error: error.message || error,
            });
        }
    }
    // Get all activity reports
    static async getReports(req, res) {
        try {
            const whereClause = {};

            // If user has a specific station assigned, filter by it
            if (req.user.__kp_Station) {
                whereClause._kf_Station = req.user.__kp_Station;
            }

            // Otherwise, show all reports
            const reports = await ActivityReport.findAll({
                where: whereClause,
                order: [['date', 'DESC']]
            });

            res.status(200).json(reports);
        } catch (error) {
            console.error("Error fetching activity reports:", error);
            res.status(500).json({ message: "Failed to fetch reports" });
        }
    }

    // Get single report by ID
    static async getReportById(req, res) {
        try {
            const { id } = req.params;
            const report = await ActivityReport.findByPk(id);

            if (!report) {
                return res.status(404).json({ message: "Report not found" });
            }

            res.status(200).json(report);
        } catch (error) {
            console.error("Error fetching report:", error);
            res.status(500).json({ message: "Failed to fetch report", error });
        }
    }

    // Update report by ID
    static async updateReport(req, res) {
        try {
            const { id } = req.params;
            const [updated] = await ActivityReport.update(req.body, {
                where: { id },
            });

            if (!updated) {
                return res.status(404).json({ message: "Report not found" });
            }

            const updatedReport = await ActivityReport.findByPk(id);
            res.status(200).json(updatedReport);
        } catch (error) {
            console.error("Error updating report:", error);
            res.status(500).json({ message: "Failed to update report", error });
        }
    }

    // Delete report by ID
    static async deleteReport(req, res) {
        try {
            const { id } = req.params;
            const deleted = await ActivityReport.destroy({ where: { id } });

            if (!deleted) {
                return res.status(404).json({ message: "Report not found" });
            }

            res.status(200).json({ success: true, message: "Report deleted successfully", id });
        } catch (error) {
            console.error("Error deleting report:", error);
            res.status(500).json({ message: "Failed to delete report", error });
        }
    }
    static async exportReports(req, res) {
        try {
            const reports = await ActivityReport.findAll();

            // If filtering by station
            const userStation = req.user?._kf_Station;
            const filteredReports = userStation
                ? reports.filter(r => r._kf_Station === userStation)
                : reports;

            const fields = [
                "date", "CW_Name", "type", "description", "farmers", "women",
                "men", "distributedKgs", "coffee", "shade", "grevelia",
                "leucaena", "markhamia", "umuhumuro", "croton", "acacia", "polyscias", "caliandra",
            ];
            const parser = new Parser({ fields });
            const csv = parser.parse(filteredReports);

            res.header("Content-Type", "text/csv");
            res.attachment("activity_reports.csv");
            return res.send(csv);
        } catch (error) {
            console.error("Error exporting reports:", error);
            res.status(500).json({ message: "Failed to export reports", error });
        }
    }




}

export default ReportController;
