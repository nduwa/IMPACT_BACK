import { Op } from "sequelize";
import Parch_Grade from "../models/rtc_temp_parchment.js";
import Dry from "../models/rtc_drying.js";
import Transaction from "../models/rtc_transaction.js";

class AssignParchmentController {
    static async getAllTransactions(req, res) {
        try {
            const station =  'SR055';

            // Pagination values from frontend
            const page = parseInt(req.query.page) || 1;      // default page 1
            const limit = parseInt(req.query.limit) || 10;   // default 10 items
            const offset = (page - 1) * limit;

            // Year filter
            let year = req.query.year;

            if (!year) {
                const now = new Date();
                year = now.getUTCFullYear().toString().slice(2);
            } else {
                year = year.length === 4 ? year.slice(2) : year;
            }

            let where = {};

            if (station) {
                const searchPattern = `${year}${station}%`;
                where = {
                    cherry_lot_id: {
                        [Op.like]: searchPattern,
                    },
                };
            }

            // Count + Paginated Query
            const { count, rows } = await Transaction.findAndCountAll({
                where,
                order: [["id", "DESC"]],
                limit,
                offset
            });

            return res.status(200).json({
                success: true,
                year,
                currentPage: page,
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                limit,
                data: rows
            });

        } catch (error) {
            console.error("Error fetching transactions:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    static async getAllAssignedParchments(req, res) {
        try {
            const station = req.user?.supplier_ID;
            // User can choose year: req.query.year = "25" or "2025"
            let year = req.query.year;

            // If no year provided → use current year (YY)
            if (!year) {
                const now = new Date();
                year = now.getUTCFullYear().toString().slice(2); // "25"
            } else {
                // Normalize: allow 2025 or 25
                year = year.length === 4 ? year.slice(2) : year;
            }

            let where = {};

            if (station) {
                const searchPattern = `${year}${station}%`;
                where = {
                    cherry_lot_id: {
                        [Op.like]: searchPattern,
                    },
                };
            }

            const assignedParchments = await Parch_Grade.findAll({
                where,
                order: [["id", "DESC"]],
            });

            return res.status(200).json({
                success: true,
                data: assignedParchments,
            });
        } catch (error) {
            console.error("Error fetching assigned parchments:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch assigned parchments",
                error: error.message,
            });
        }
    }

    static async getAllDryings(req, res) {
        try {
            //const station = req.user?.supplier_ID;
             const station =  'SR055';

            // --- YEAR HANDLING ---
            let year = req.query.year;
            if (!year) {
                const now = new Date();
                year = now.getUTCFullYear().toString().slice(2); // default YY
            } else {
                year = year.length === 4 ? year.slice(2) : year; // normalize
            }

            // --- WHERE CLAUSE FOR DRYING ---
            let where = {};
            if (station) {
                const searchPattern = `${year}${station}%`;
                where = {
                    day_lot_number: { [Op.like]: searchPattern }
                };
            }

            // --- FETCH DRYINGS ONLY ---
            const allDryings = await Dry.findAll({
                where,
                order: [["id", "DESC"]],
                raw: true
            });

            // --- RETURN DRYINGS ONLY ---
            return res.status(200).json({
                success: true,
                data: allDryings
            });

        } catch (error) {
            console.error("Error fetching dryings:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch drying data",
                error: error.message
            });
        }
    }


}

export default AssignParchmentController;
