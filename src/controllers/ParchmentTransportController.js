import { Op } from "sequelize";
import Delivery_reports from "../models/rtc_delivery_reports.js";
import Delivery_Reports_Lots from "../models/rtc_delivery_reports_lots.js";
import loaded_weights from "../models/rtc_loaded_weights.js";
import Parch_Grade from "../models/rtc_temp_parchment.js";
import Transaction from "../models/rtc_transaction.js";

class ParchmentTransportController {

  static async getDeliveries(req, res) {
    try {
      // const station = req.user?.supplier_ID;
      const station = req.user?.supplier_ID; // for testing
      const now = new Date();
      const year = now.getUTCFullYear().toString().slice(-2);

      let where = {};

      if (station) {
        // Match all deliveries like LF-25-SR055-... (for example)
        const searchPattern = `LF-${year}-${station}-%`;
        where = {
          deliveryid: {
            [Op.like]: searchPattern,
          },
        };
      }

      const allDeliveryReports = await Delivery_reports.findAll({
        where,
        order: [["id", "DESC"]],
      });

      if (!allDeliveryReports || allDeliveryReports.length === 0) {
        return res.status(404).json({
          status: "fail",
          message: "No delivery reports found.",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "All delivery reports retrieved successfully.",
        data: allDeliveryReports,
      });
    } catch (error) {
      console.error("Something went wrong:", error.message);
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // ✅ Fetch single delivery with lots and loaded weights
  static async getDeliveryDetails(req, res) {
    try {
      const { id } = req.params;

      // Fetch delivery report
      const delivery = await Delivery_reports.findOne({
        where: { id },
      });

      if (!delivery) {
        return res.status(404).json({ status: "fail", message: "Delivery not found" });
      }

      // Fetch related lots
      const lots = await Delivery_Reports_Lots.findAll({
        where: { delivery_reportid: id },
      });

      // Fetch loaded weights
      const weights = await loaded_weights.findAll({
        where: { rtc_delivery_reports_id: id },
      });

      // Combine all data
      const deliveryDetails = {
        ...delivery.toJSON(),
        lots,
        loaded_weights: weights,
      };

      return res.status(200).json({ status: "success", data: deliveryDetails });

    } catch (error) {
      console.error("Error fetching delivery details:", error);
      return res.status(500).json({ status: "fail", message: error.message });
    }
  }

  static async getLotsOfLoading(req, res) {
    try {
      // Get station from logged-in user (use fixed one for testing)
      const supplier = req.user?.supplier_ID; // fallback for testing
      console.log('supplier', supplier);

      const now = new Date();
      const year = now.getUTCFullYear().toString().slice(-2);

      // Build search pattern: e.g., "25SR055%"
      const searchPattern = `${year}${supplier}%`;

      const where = {
        cherry_lot_id: { [Op.like]: searchPattern },
      };

      // Fetch all matching parchment lots
      const allParchment = await Parch_Grade.findAll({
        where,
        order: [["id", "DESC"]],
      });

      if (!allParchment || allParchment.length === 0) {
        return res.status(404).json({
          status: "fail",
          message: `No parchment lots found for station ${supplier}.`,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Parchment lots retrieved successfully.",
        data: allParchment,
      });
    } catch (error) {
      console.error(" Error in getLotsOfLoading:", error);
      return res.status(500).json({
        status: "fail",
        message: "Internal server error.",
        error: error.message,
      });
    }
  }

  static async getAllLots(req, res) {
    try {
      const supplier = req.user?.supplier_ID;
      const now = new Date();
      const year = now.getUTCFullYear().toString().slice(-2);
      const searchPattern = `${year}${supplier}%`;

      const lots = await Delivery_Reports_Lots.findAll({
        where: {
          parch_lot_ID: { [Op.like]: searchPattern },
        },
        order: [["id", "DESC"]],
      });

      if (!lots.length) {
        return res.status(404).json({
          status: "fail",
          message: "No delivery lots found.",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "All delivery lots retrieved successfully.",
        data: lots,
      });
    } catch (error) {
      console.error("Error in getAllLots:", error);
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // post delivery loading
  static async deliverParchment(req, res) {
    try {
      const now = new Date();
      const year = now.getUTCFullYear().toString().slice(-2);
      const supplier = req.user?.supplier_ID;
      const UserID = req.user?.userid;

      const {
        tally_sheet_no,
        plate_no,
        bags,
        weight,
        loader,
        inspected,
        accountant,
        driver_name,
        driver_licence,
        parchments,
        expected_delivery_date,
      } = req.body;

      // Validate input
      if (!parchments || !Array.isArray(parchments) || parchments.length === 0) {
        return res.status(400).json({ status: "fail", message: "No parchment lots provided." });
      }

      if (!tally_sheet_no || !loader) {
        return res.status(400).json({ status: "fail", message: "Missing required fields: tally_sheet_no or loader", });
      }

      // Get next delivery report id
      const maxId = (await Delivery_reports.max("id")) + 1 || 1;

      // LOOP THROUGH ALL PAR HMENT LOTS
      for (const lot of parchments) {
        const { parchment_id, weight: lot_weight, bags, bags_left } = lot;

        if (!parchment_id || !lot_weight || !bags) {
          return res.status(400).json({
            status: "fail",
            message:
              "Missing required fields in one of the parchment lots: parchment_id, weight, bags",
          });
        }

        // Extract grade from last character
        const grade = parchment_id.trim().slice(-1).toUpperCase();

        // Find parchment
        const parchment = await Parch_Grade.findOne({
          where: { parchment_id },
        });

        if (!parchment) {
          return res.status(404).json({
            status: "fail",
            message: `No parchment found for ID ${parchment_id}`,
          });
        }

        const parchweight = parchment.parch_weight;

        // Already loaded weight
        const existingDeliveries = await Delivery_Reports_Lots.findAll({
          where: { parch_lot_ID: parchment_id },
        });

        const totalLoadedWeight = existingDeliveries.reduce((sum, r) => sum + r.weight, 0);

        const remainingWeight = parchweight - totalLoadedWeight;

        if (lot_weight > remainingWeight) {
          return res.status(400).json({
            status: "fail",
            message: `Parchment lot ${parchment_id} exceeds available weight (${remainingWeight} kg left)`,
          });
        }

        // FIND RELATED TRANSACTIONS
        const transactions = await Transaction.findAll({
          where: {
            [Op.or]: [
              { parchID_A: parchment_id },
              { parchID_B: parchment_id },
              { parchID_C: parchment_id },
            ],
          },
        });

        // LOOP TRANSACTIONS
        for (const transaction of transactions) {
          // GET LAST LOADED WEIGHT FOR THIS TRANSACTION
          const lastLoad = await loaded_weights.findOne({
            where: { rtc_transaction_id: transaction.id },
            order: [["id", "DESC"]],
          });

          let prevWeightLeft = 0;

          if (lastLoad) {
            prevWeightLeft = parseFloat(lastLoad.weight_left);
          } else {
            // first time loading from transaction → use original transaction weights
            if (transaction.parchID_A === parchment_id) {
              prevWeightLeft = parseFloat(transaction.parchID_A_Weight);
            } else if (transaction.parchID_B === parchment_id) {
              prevWeightLeft = parseFloat(transaction.parchID_B_Weight);
            } else if (transaction.parchID_C === parchment_id) {
              prevWeightLeft = parseFloat(transaction.parchID_C_Weight);
            }
          }

          // proportional weight
          const weight_loaded = (lot_weight * parseFloat(prevWeightLeft)) / parchweight;

          const weight_left = prevWeightLeft - weight_loaded;

          // INSERT LOADED WEIGHT ENTRY
          await loaded_weights.create({
            created_by: UserID,
            rtc_delivery_reports_id: maxId,
            rtc_transaction_id: transaction.id,
            weight_loaded,
            weight_left,
            total_weight_left: weight_left,
            status: 0,
          });

          // UPDATE TRANSACTION STATUS
          await Transaction.update(
            { loaded: 1, state: "in-transit" },
            { where: { id: transaction.id } }
          );
        }

        // INSERT LOT DELIVERY RECORD
        await Delivery_Reports_Lots.create({
          created_by: UserID,
          rtc_transactionid: transactions.length > 0 ? transactions[0].id : 0,
          weight: lot_weight,
          bags_loaded: bags,
          bags_of_parchment_left: bags_left || 0,
          final_bags_of_parchment_left: bags_left || 0,
          final_weight_left: remainingWeight - lot_weight,
          status: 0,
          delivery_reportid: maxId,
          parch_lot_ID: parchment_id,
          grade,
        });
      }

      // CREATE MAIN DELIVERY REPORT
      const newDeliveryReport = await Delivery_reports.create({
        id: maxId,
        created_at: now,
        created_by: UserID,
        deliveryid: `LF-${year}-${supplier}-${maxId}`,
        tally_sheet_no, bags,
        truck_plate: plate_no,
        loading_date: now,
        expected_delivery_date: expected_delivery_date || now,
        grade: parchments[0].parchment_id.trim().slice(-1).toUpperCase(),
        weight,
        status: "in-transit",
        close: 0,
        closed_by: 0,
        closed_at: "",
        loaded_by: loader,
        inspected_by: inspected,
        accountant_by: accountant,
        driver_name,
        driver_licence_or_national_id: driver_licence,
      });

      return res.status(201).json({
        status: "success",
        message: "Parchment delivery report created successfully.",
        data: newDeliveryReport,
      });
    } catch (error) {
      console.error("Error in deliverParchment:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create parchment delivery report.",
        error: error.message,
      });
    }
  }





}
export default ParchmentTransportController;