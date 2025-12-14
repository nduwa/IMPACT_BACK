import { fn, col, where } from "sequelize";
import axios from 'axios';
import https from 'https';
import Delivery_reports from "../models/rtc_delivery_reports.js";
import Delivery_Reports_Lots from "../models/rtc_delivery_reports_lots.js";
import Weight_Loaded from '../models/rtc_loaded_weights.js'
import Transaction from "../models/rtc_transaction.js";
import Reading from "../models/rtc_readings.js"
import Supplier from "../models/rtc_supplier.js"
import Farmer from "../models/rtc_farmers.js"
import Season from "../models/rtc_seasons.js"
import Auth from "../database/serverAuth.js";
import Processing from "../models/rtc_deliver_processing.js"
import Parch_Grade from '../models/rtc_temp_parchment.js'

class DeliveryProcessing {
  static async getDeliveryReports(req, res) {
    try {
      const Year = new Date().getFullYear();

      const reports = await Delivery_reports.findAll({
        where: where(fn('YEAR', col('created_at')), Year),
        order: [['created_at', 'DESC']],
      });

      const processed = await Processing.findAll();

      const deliveries = { reports, processed };

      return res.status(200).json({
        success: true,
        message: 'Delivery reports for current year fetched successfully.',
        data: deliveries,
      });
    } catch (error) {
      console.error("Error fetching delivery reports:", error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery reports.',
        error: error.message,
      });
    }
  }

  static async ProcessDelivelies(req, res) {
    try {
      const deliveryId = req.params.id || 3004;

      if (!deliveryId) {
        return res.status(400).json({ success: false, message: "Missing delivery ID." });
      }

      // 1. Fetch delivery lots
      const deliveries = await Delivery_Reports_Lots.findAll({
        where: { delivery_reportid: deliveryId },
        raw: true,
      });

      if (!deliveries.length) {
        return res.status(404).json({ success: false, message: "No lots found for this delivery." });
      }

      // Calculate totals
      const lot_Weight = deliveries.reduce((sum, lot) => sum + (lot.weight || 0), 0);
      const lot_Bags = deliveries.reduce((sum, lot) => sum + (lot.bags_loaded || 0), 0);

      // 2. Fetch all Parch_Grade cherry lot IDs for these parch_lot_IDs
      const parchLotIds = deliveries.map(lot => lot.parch_lot_ID).filter(Boolean);
      console.log("lot_id", parchLotIds);

      let cherryLotIds = [];
      if (parchLotIds.length) {
        const parchGrades = await Parch_Grade.findAll({
          where: { parchment_id: parchLotIds },
          attributes: ["cherry_lot_id"],
          raw: true,
        });
        cherryLotIds = parchGrades.map(pg => pg.cherry_lot_id);
      }
      console.log("cherry_lot_id", cherryLotIds);


      // 3. Fetch loaded weights
      const loaded_we = await Weight_Loaded.findAll({
        where: { rtc_delivery_reports_id: deliveryId },
        raw: true,
      });

      if (!loaded_we.length) {
        return res.status(404).json({ success: false, message: "No loaded weight found for this delivery." });
      }

      const loaded_Weight = loaded_we.reduce((sum, lw) => sum + (lw.weight_loaded || 0), 0);

      // 4. Fetch transactions linked by transaction_id and cherry_lot_id
      const trIds = loaded_we.map(lw => lw.rtc_transaction_id).filter(Boolean);

      const transactions = await Transaction.findAll({
        where: {
          id: trIds,
          cherry_lot_id: cherryLotIds,
        },
        raw: true,
      });


      // 5. Contribution weight (no duplication per lot)
      let contribution_Weight = 0;

      const gradeWeights = {
        A: "parchID_A_Weight",
        B: "parchID_B_Weight",
        C: "parchID_C_Weight",
      };

      const uniqueGrades = [...new Set(deliveries.map(lot => lot.grade))];

      for (const grade of uniqueGrades) {
        const field = gradeWeights[grade];
        if (!field) continue;

        const sum = transactions.reduce((total, tr) => total + (tr[field] || 0), 0);
        contribution_Weight += sum;
      }

      // Optional: total lot weight

      console.log("lot_weight", lot_Weight);
      console.log("loaded_weight", loaded_Weight);
      console.log("contribution", contribution_Weight);


      // 6. Update or create Processing record
      let processingRecord = await Processing.findOne({ where: { deliveryid: deliveryId } });

      if (processingRecord) {
        await processingRecord.update({
          delivery_weight: lot_Weight,
          delivery_bags: lot_Bags,
          loaded_Weight,
          trans_weight: contribution_Weight,
        });
      } else {
        processingRecord = await Processing.create({
          deliveryid: deliveryId,
          delivery_weight: lot_Weight,
          delivery_bags: lot_Bags,
          loaded_Weight,
          trans_weight: contribution_Weight,
          status: 0,
        });
      }

      // 7. Response
      return res.status(200).json({
        success: true,
        message: "Delivery processing updated.",
        delivery_weight: lot_Weight,
        bags_loaded: lot_Bags,
        loaded_weight: loaded_Weight,
        contribution_weight: contribution_Weight,
        cherry_lot_ids: cherryLotIds,
      });
    } catch (error) {
      console.error("Error processing delivery:", error);
      return res.status(500).json({ success: false, message: "Server error while processing delivery." });
    }
  }


  static transactionPayload(delivery, reading, farmer, supplier, delivery_contribution) {
    if (!delivery) return null;

    // Map certification codes to labels
    const certificationMap = {
      CP: "Cafe Practices",
      RF: "Rainforest Alliance",
      NC: "Not Certified",
      FT: "Fair Trade",
      OR: "Organic",
      UTZ: "UTZ",
      BM: "Bird Friendly",
    };

    // Build contribution string like "1750_A_LF-25-SR055-3010,1550_B_LF-25-SR055-3010"
    const contributionString = delivery_contribution
      .map(dc => `${dc.weight}_${dc.type}_${dc.lot}`)
      .join(",");

    return {
      // 💰 Payment and pricing info
      Price_n: delivery.unitprice || 0,
      Tot_pymnt: delivery.cash_paid || 0,
      Currency: "Rwf",

      // 🧾 Delivery details
      Receipt_Nber: delivery.paper_receipt || "",
      FTR: delivery.lotnumber || "",
      Weight_Reading_n: delivery.kilograms || 0,
      Buy_Date: new Date(delivery.transaction_date).toLocaleDateString("en-US") || "",
      Date: new Date(delivery.transaction_date).toLocaleDateString("en-US") || "",

      // 🧍 Farmer & supplier linkage
      _kf_Farmer: farmer?.__kp_Farmer || "",
      _kf_Group: farmer?._kf_Group || "",
      _kf_Household: farmer?._kf_Household || "",
      _kf_Supplier: delivery._kf_Supplier || "",
      _kf_Station: delivery._kf_Station || "",
      _kf_Staff: delivery._kf_Staff || "",
      _kf_User_g: supplier?._kf_User_g || "",

      // 🧾 Reading / Quality / Season references
      _kf_Season: delivery._kf_Season || "",
      _kf_Quality: supplier?._kf_Quality || "",
      _kf_Reading: reading?.__kp_Reading || "",
      _kf_Type: reading?._kf_Type || "",
      _kf_Location: reading?._kf_Location || "",
      _kf_Category: delivery._kf_Category || "8523EB72-0424-4289-B904-2505B9AE3A3C",

      // ☕ Quality and contribution details
      Certifi: certificationMap[delivery.certification] || "",
      Ratio: reading?.Ratio_CP || "",
      Cherry_Lot_ID_t: delivery.cherry_lot_id || "",
      chr_lot: delivery.DayLotNumber || "",
      Primary_kp_log: delivery.__kp_Log,
      Temp_RecID: delivery.id,

      // 📦 Parchment contributions (weights by grade)
      Parch_Contr_A: delivery.parchID_A_Weight || 0,
      Parch_Contr_B: delivery.parchID_B_Weight || 0,
      Parch_Contr_C: delivery.parchID_C_Weight || 0,

      // 📦 Combined contribution string
      Contribution: contributionString || "",

      // 🧍 Farmer info
      Farmer_Names: delivery.farmername || "",
      deliveredBy_gender: delivery.deliveredBy_gender || "",

      // 🌊 Floaters / defects
      Floaters: delivery.bad_kilograms || 0,
      Floaters_UnitP: delivery.bad_unit_price || 0,
    };
  }

  static async PostDeliveryContribution(data, token) {
    try {
      const apiUrl =
        "https://rtc.kizasolutions.com/fmi/data/vLatest/databases/EMS/layouts/DAS__Dashboard/records";

      if (!data?.Delivery || !Array.isArray(data.Delivery) || data.Delivery.length === 0) {
        console.log("⚠️ No delivery data to post.");
        return { success: 0, failed: 0, total: 0, postedData: [] };
      }

      // ✅ Wrap all deliveries inside { Delivery: [...] }
      const payload = {
        fieldData: {
          Json: JSON.stringify({ Delivery: data.Delivery }), // 👈 IMPORTANT
          post_paginated: "",
          global: "",
        },
      };

      console.log("Posting to FileMaker:", JSON.stringify(payload, null, 2));

      await axios.post(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 120000,
      });

      return {
        success: data.Delivery.length,
        failed: 0,
        total: data.Delivery.length,
        postedData: data.Delivery,
      };
    } catch (error) {
      return {
        success: 0,
        failed: data?.Delivery?.length || 0,
        total: data?.Delivery?.length || 0,
        error: "Failed to post delivery contribution",
        details: error.response?.data || error.message,
      };
    }
  }

  static async PostDeliveryData(req, res) {
    try {
      const id = req.params.id || 3010;
      if (!id) {
        return res.status(400).json({ success: false, message: "Missing delivery ID" });
      }

      // 1️⃣ Get active season
      const season = await Season.findOne({ where: { Default: 1 }, raw: true });
      if (!season?.__kp_Season) {
        return res.status(400).json({ success: false, message: "No default season found" });
      }

      // 2️⃣ Get loaded weights
      const loaded_weights = await Weight_Loaded.findAll({
        where: { rtc_delivery_reports_id: id },
        raw: true,
      });
      if (!loaded_weights.length) {
        return res.status(404).json({ success: false, message: "No loaded weights found" });
      }

      // 3️⃣ Get all delivery lots
      const lots = await Delivery_Reports_Lots.findAll({
        where: { delivery_reportid: id },
        raw: true,
      });

      // 4️⃣ Get parchment–cherry mappings
      const parchLotIds = lots.map(l => l.parch_lot_ID).filter(Boolean);
      const parchGrades = await Parch_Grade.findAll({
        where: { parchment_id: parchLotIds },
        attributes: ["cherry_lot_id", "parchment_id"],
        raw: true,
      });

      const cherryLotMap = parchGrades.reduce((acc, pg) => {
        acc[pg.parchment_id] = pg.cherry_lot_id;
        return acc;
      }, {});

      // 5️⃣ Get delivery report info
      const reports = await Delivery_reports.findAll({
        where: { id },
        raw: true,
      });

      let payloads = [];
      let totalContributions = 0;

      // 6️⃣ Loop each loaded weight
      for (const lw of loaded_weights) {
        const transactions = await Transaction.findAll({
          where: { id: lw.rtc_transaction_id },
          raw: true,
        });
        if (!transactions.length) continue;

        const delivery_contribution = [];
        const seen = new Set();

        // Prepare per-grade parchment contribution counters
        let parchContrA = 0;
        let parchContrB = 0;
        let parchContrC = 0;

        for (const lot of lots) {
          const cherry_lot_id = cherryLotMap[lot.parch_lot_ID] || null;

          const matchingTransactions = transactions.filter(
            tr => tr.cherry_lot_id === cherry_lot_id
          );
          if (!matchingTransactions.length) continue;

          for (const report of reports) {
            const key = `${lw.weight_loaded}_${lot.grade}_${report.deliveryid}_${lw.rtc_transaction_id}`;
            if (seen.has(key)) continue;

            // Build delivery contribution
            delivery_contribution.push({
              weight: lw.weight_loaded || 0,
              type: lot.grade || "",
              lot: report.deliveryid || "",
              parch_lot_ID: lot.parch_lot_ID,
              cherry_lot_id,
            });

            // Assign to correct grade weight
            if (lot.grade === "A") parchContrA += lw.weight_loaded || 0;
            else if (lot.grade === "B") parchContrB += lw.weight_loaded || 0;
            else if (lot.grade === "C") parchContrC += lw.weight_loaded || 0;

            seen.add(key);
          }
        }

        totalContributions += delivery_contribution.length;

        // 7️⃣ Build payloads for each transaction
        for (const tr of transactions) {
          const [reading, farmer, supplier] = await Promise.all([
            Reading.findOne({
              where: { _kf_Season: tr._kf_Season, _kf_Supplier: tr._kf_Supplier },
              raw: true,
            }),
            Farmer.findOne({ where: { farmerid: tr.farmerid }, raw: true }),
            Supplier.findOne({ where: { __kp_Supplier: tr._kf_Supplier }, raw: true }),
          ]);

          // Attach computed parchment weights
          const deliveryWithWeights = {
            ...tr,
            parchID_A_Weight: parchContrA,
            parchID_B_Weight: parchContrB,
            parchID_C_Weight: parchContrC,
          };

          const payload = DeliveryProcessing.transactionPayload(
            deliveryWithWeights,
            reading || {},
            farmer || {},
            supplier || {},
            delivery_contribution
          );

          payloads.push(payload);
        }
      }

      if (!payloads.length) {
        return res.status(404).json({ success: false, message: "No related transactions found" });
      }

      // 8️⃣ Post to FileMaker
      const token = await Auth.getBearerToken();
      const groupedData = { Delivery: payloads };
      const result = await DeliveryProcessing.PostDeliveryContribution(groupedData, token);

      // 9️⃣ Update local processing status
      await Processing.update({ status: 1 }, { where: { deliveryid: id } });

      // 🔟 Respond to frontend
      return res.status(200).json({
        success: true,
        message: `Delivery ${id} submitted successfully with ${totalContributions} contributions.`,
        contributionCount: totalContributions,
        recordsPosted: result.success,
        failedRecords: result.failed,
        data: groupedData,
      });
    } catch (error) {
      console.error("Error submitting delivery:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

}

export default DeliveryProcessing;
