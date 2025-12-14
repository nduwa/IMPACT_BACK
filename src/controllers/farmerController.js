// controllers/FarmerController.js
import { v4 as uuidv4 } from "uuid";
import { Sequelize } from 'sequelize';
import Field_farmer from '../models/rtc_field_farmers.js';
import Groups from '../models/rtc_groups.js';
import Farmers from '../models/rtc_farmers.js';
import Household from '../models/rtc_households.js';
import Station from '../models/rtc_station.js'
import XLSX from "xlsx";

class FarmerControlller {

    static async getAllFarmers(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        try {
            const station = req.user?.__kp_Station;

            const where = {
                ...(station && { _kf_Station: station })
                // No status filtering here — return all
            };

            const { count, rows } = await Field_farmer.findAndCountAll({
                where,
                limit,
                offset,
                order: [['id', 'ASC']],
            });

            res.status(200).json({
                success: true,
                message: "All farmers retrieved successfully!",
                data: rows,
                pagination: {
                    total: count,
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error("Error fetching farmers:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    static async addNewFarmer(req, res) {
        try {
            const input = req.body;

            // Random number ID between 1 and 1,000,000
            const randomId = Math.floor(100000 + Math.random() * 900000);

            // Build Farmer_source with template literals
            const Farmer_source = `${req.user?.station_ID}F${randomId}`;
            // console.log('Sending user:', Farmer_source);
            // console.log('Incoming farmer data:', input);
            // Map incoming field names to DB field names
            const farmerData = {
                source_ID: Farmer_source,
                farmer_name: input.farmer_name,
                Group_ID: input.Group_ID,
                National_ID: input.National_ID,
                Gender: input.Gender,
                phone: input.phone,
                Year_Birth: input.dob, // assuming dob like '1990-01-01'
                Marital_Status: input.marital_status || "Unknown",
                village: input.village,
                cell: input.cell,
                sector: input.sector,
                district: input.district,
                province: input.province,
                Trees: parseInt(input.total_trees) || 0,
                Trees_Producing: parseInt(input.productive_trees) || 0,
                number_of_plots: parseInt(input.number_of_plots) || 1,
                Skills: input.literacy || "Unknown",
                education_level: input.education_level || "Unknown",
                Math_Skills: input.numeracy || "Unknown",
                latitude: input.latitude || "Unknown",
                longitude: input.longitude || "Unknown",
                full_name: req.user?.userName,
                _kf_Station: req.user?.__kp_Station,
                _kf_Supplier: req.user?.supplier,
                CW_Name: req.user?.station_name || "Unknown",
                _kf_Staff: req.user?.__kp_Staff || null,
                _kf_User: req.user?.__kp_User || null,
                user_code: req.user?.user_code || "Unknown",
            };

            // Validation check
            // if (Object.values(farmerData).some(val => val === undefined || val === null || String(val).trim() === '')) {
            //     return res.status(400).json({ message: 'All fields are required.' });
            // }
            // Prevent duplicate
            const exists = await Field_farmer.findOne({ where: { National_ID: farmerData.National_ID } });
            if (exists) {
                return res.status(409).json({ message: 'Farmer with this National ID already exists.' });
            }
            const exist_groups = await Groups.findOne({ where: { ID_GROUP: farmerData.Group_ID } });
            if (!exist_groups) {
                return res.status(409).json({ message: 'Farmer Group is not exists.' });
            }

            const newFarmer = await Field_farmer.create(farmerData);

            return res.status(201).json({
                message: 'Farmer added successfully',
                data: newFarmer
            });

        } catch (error) {
            console.error("Error creating farmer:", error);
            if (error.name === "SequelizeValidationError") {
                console.error("Validation Errors:", error.errors.map(e => e.message));
            }
            res.status(500).json({
                message: 'Internal server error',
                error: error.message
            });
        }
    }
    static async importNewFarmer(req, res) {
        try {
            const farmers = req.body;
            // Random number ID between 1 and 1,000,000
            const randomId = Math.floor(100000 + Math.random() * 900000);

            // Build Farmer_source with template literals
            const farmer_source = `${req.user?.station_ID}F${randomId}`;
            if (!Array.isArray(farmers) || farmers.length === 0) {
                return res.status(400).json({ message: "No farmer data provided." });
            }
            console.log(farmer_source);

            const errors = {
                duplicates: [],
                invalidGroups: [],
                failed: [],
            };
            const successfulFarmers = [];

            for (const input of farmers) {
                const farmerData = {
                    source_ID: farmer_source,
                    farmer_name: input.farmer_name,
                    Group_ID: input.Group_ID,
                    National_ID: input.National_ID,
                    Gender: input.Gender,
                    phone: input.phone,
                    Year_Birth: input.dob,
                    Marital_Status: input.marital_status || "Unknown",
                    village: input.Village,
                    cell: input.Cell,
                    sector: input.Sector,
                    district: input.district,
                    province: input.province,
                    Trees: parseInt(input.total_trees) || 0,
                    Trees_Producing: parseInt(input.productive_trees) || 0,
                    number_of_plots: parseInt(input.number_of_plots) || 1,
                    Skills: input.literacy || "Unknown",
                    education_level: input.education_level || "Unknown",
                    Math_Skills: input.numeracy || "Unknown",
                    latitude: input.latitude || "Unknown",
                    longitude: input.longitude || "Unknown",
                    full_name: req.user?.userName,
                    _kf_Station: req.user?.__kp_Station,
                    _kf_Supplier: req.user?.supplier,
                    CW_Name: req.user?.station_name || "Unknown",
                    _kf_Staff: req.user?.__kp_Staff || null,
                    _kf_User: req.user?.__kp_User || null,
                    user_code: req.user?.user_code || "Unknown",
                };

                const exists = await Field_farmer.findOne({ where: { National_ID: farmerData.National_ID } });
                if (exists) {
                    errors.duplicates.push({
                        National_ID: farmerData.National_ID,
                        farmer_name: farmerData.farmer_name,
                        message: "Farmer with this National ID already exists.",
                    });
                    continue;
                }

                const exist_group = await Groups.findOne({ where: { ID_GROUP: farmerData.Group_ID } });
                if (!exist_group) {
                    errors.invalidGroups.push({
                        Group_ID: farmerData.Group_ID,
                        National_ID: farmerData.National_ID,
                        farmer_name: farmerData.farmer_name,
                        message: "Group does not exist.",
                    });
                    continue;
                }

                try {
                    const created = await Field_farmer.create(farmerData);
                    successfulFarmers.push({
                        National_ID: created.National_ID,
                        farmer_name: created.farmer_name,
                    });
                } catch (creationError) {
                    errors.failed.push({
                        National_ID: farmerData.National_ID,
                        farmer_name: farmerData.farmer_name,
                        message: creationError.message || "Unknown creation error.",
                    });
                }
            }

            return res.status(201).json({
                message: `Import completed: ${successfulFarmers.length} added,
                ${errors.duplicates.length} duplicates, 
                ${errors.invalidGroups.length} invalid group(s),
                ${errors.failed.length} failed.`,
                successCount: successfulFarmers.length,
                errors,
            });

        } catch (error) {
            console.error("Import failed:", error);
            return res.status(500).json({ message: "Failed to import farmers.", error: error.message || error });
        }
    }
    static async getPendingFarmers(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        try {
            const station = req.user?.__kp_Station;

            const where = {
                ...(station && { _kf_Station: station }),
                status: ['new', 'pending'],
            };

            const { count, rows } = await Field_farmer.findAndCountAll({
                where,
                limit,
                offset,
                order: [['id', 'ASC']],
            });

            res.status(200).json({
                success: true,
                message: 'Pending or new farmers retrieved successfully!',
                data: rows,
                pagination: {
                    total: count,
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching pending farmers:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
    static async getApprovedFarmers(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        try {
            const station = req.user?.__kp_Station;

            const where = {
                ...(station && { _kf_Station: station }),
                status: 'approved',
            };

            const { count, rows } = await Field_farmer.findAndCountAll({
                where,
                limit,
                offset,
                order: [['id', 'ASC']],
            });

            res.status(200).json({
                success: true,
                message: 'Approved farmers retrieved successfully!',
                data: rows,
                pagination: {
                    total: count,
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching approved farmers:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
    static async ApproveNewFarmers(req, res) {
        try {
            const { id: farmerId } = req.params;

            const farmer = await Field_farmer.findByPk(farmerId);

            if (!farmer) {
                return res.status(404).json({
                    status: "Failed",
                    message: "Farmer not found",
                });
            }

            if (farmer.status === "Approved") {
                return res.status(400).json({
                    status: "Failed",
                    message: "Farmer is already approved",
                });
            }

            await farmer.update({ status: "Approved" });

            return res.status(200).json({
                status: "success",
                message: "Farmer approved successfully!",
                data: farmer,
            });
        } catch (error) {
            return res.status(500).json({
                status: "Failed",
                error: error.message,
            });
        }
    }
    static async deleteFarmerData(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Field_farmer.destroy({ where: { id } });

            if (!deleted) {
                return res.status(404).json({ status: "Failed", message: "Farmer not found" });
            }

            res.status(200).json({ status: "success", message: "Farmer deleted successfully!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: "Failed", message: "Server error", error: error.message });
        }
    }
    static async FarmerHouseBuilder(farmersData) {
        // ✅ Find the latest farmer by DB id
        const latestFarmer = await Farmers.findOne({ order: [["id", "DESC"]] });
        const startingFarmerId = latestFarmer ? latestFarmer.id + 1 : 1;
        const startingRecordId = latestFarmer ? latestFarmer.recordid + 1 : 1;

        // ✅ Find the highest numeric part of all farmer IDs (ignoring first and last char)
        const allFarmers = await Farmers.findAll({ attributes: ["farmerid"], raw: true });
        let maxFarmerNumber = 0;
        allFarmers.forEach(f => {
            if (f.farmerid && f.farmerid.length > 2) {
                const numericPart = f.farmerid.slice(1, -1);
                const num = parseInt(numericPart, 10);
                if (!isNaN(num) && num > maxFarmerNumber) maxFarmerNumber = num;
            }
        });
        const nextFarmerNumber = maxFarmerNumber + 1;

        // ✅ Find the latest household by DB id
        const latestHousehold = await Household.findOne({ order: [["id", "DESC"]] });
        const startingHouseholdId = latestHousehold ? latestHousehold.id + 1 : 1;
        const startingHouseholdRecordId = latestHousehold ? latestHousehold.recordid + 1 : 1;

        // ✅ Find the highest numeric part of all household IDs (ignoring first character)
        const allHouseholds = await Household.findAll({ attributes: ["householdid"], raw: true });
        let maxHouseholdNumber = 0;
        allHouseholds.forEach(h => {
            if (h.householdid && h.householdid.length > 1) {
                const numericPart = h.householdid.slice(1);
                const num = parseInt(numericPart, 10);
                if (!isNaN(num) && num > maxHouseholdNumber) maxHouseholdNumber = num;
            }
        });
        const nextHouseholdNumber = maxHouseholdNumber + 1;

        // 2️⃣ Pre-fetch all groups to reduce queries
        const groupIds = [...new Set(farmersData.map(f => f.Group_ID).filter(Boolean))];
        const groups = await Groups.findAll({ where: { ID_GROUP: groupIds }, raw: true });
        const groupMap = new Map(groups.map(g => [g.ID_GROUP, g]));

        // 3️⃣ Build Households
        const newHouseholds = farmersData.map((farmer, index) => {
            const group = groupMap.get(farmer.Group_ID);
            const householdId = `H${(nextHouseholdNumber + index).toString().padStart(5, "0")}`;
            const farmerId = farmer.farmerid || `F${(nextFarmerNumber + index).toString().padStart(5, "0")}A`;

            return {
                id: startingHouseholdId + index,
                __kp_Household: uuidv4().toUpperCase(),
                _kf_Group: group?.__kp_Group,
                _kf_Location: group?._kf_Location || "3658935C-18C5-49D0-9AD8-64F763570186",
                _kf_Station: farmer._kf_Station,
                _kf_Supplier: farmer._kf_Supplier,
                Area_Small: farmer.cell || "",
                Area_Smallest: farmer.village || "",
                householdid: householdId,
                z_Farmer_Primary: `${farmerId} ${farmer.farmer_name}`,
                created_at: farmer.created_at || new Date(),
                type: farmer.type || "new",
                farmerid: farmerId,
                group_id: farmer.Group_ID || "",
                STP_Weight: farmer.STP_Weight || 0,
                number_of_plots_with_coffee: farmer.number_of_plots_with_coffee || 0,
                Trees_Producing: farmer.Trees_Producing || 0,
                Trees: farmer.Trees || 0,
                Longitude: farmer.longitude || 0,
                Latitude: farmer.latitude || 0,
                Children: farmer.Children || 0,
                Childen_gender: farmer.Childen_gender || "0",
                Childen_below_18: farmer.Childen_below_18 || "0",
                recordid: startingHouseholdRecordId + index,
                status: "active",
                inspectionId: farmer.inspectionId || "",
                cafeId: 0,
                InspectionStatus: farmer.InspectionStatus || "inactive",
            };
        });

        // 4️⃣ Build Farmers
        const newFarmers = newHouseholds.map((household, index) => {
            const farmer = farmersData[index];
            const group = groupMap.get(farmer.Group_ID);
            const farmerId = farmer.farmerid || `F${(nextFarmerNumber + index).toString().padStart(5, "0")}A`;

            return {
                id: startingFarmerId + index,
                __kp_Farmer: uuidv4().toUpperCase(),
                farmerid: farmerId,
                _kf_Group: group?.__kp_Group,
                _kf_Household: household.__kp_Household,
                _kf_Location: group?._kf_Location || "3658935C-18C5-49D0-9AD8-64F763570186",
                _kf_Supplier: farmer._kf_Supplier,
                _kf_Station: farmer._kf_Station,
                Year_Birth: farmer.Year_Birth || "",
                Gender: farmer.Gender || "",
                Name: farmer.farmer_name || "",
                National_ID_t: farmer.National_ID || "",
                Phone: farmer.Phone || farmer.phone || "",
                Position: farmer.Position || "",
                created_by: farmer.full_name || "system",
                registered_at: farmer.registered_at || new Date(),
                updated_at: farmer.updated_at || new Date(),
                type: farmer.type || "new",
                sync_farmers: 0,
                farmer_source: farmer.source_ID || "",
                uploaded: 0,
                Area_Small: farmer.cell || "",
                Area_Smallest: farmer.village || "",
                Trees: farmer.Trees || 0,
                Trees_Producing: farmer.Trees_Producing || 0,
                number_of_plots_with_coffee: farmer.number_of_plots_with_coffee || 0,
                STP_Weight: farmer.STP_Weight || 0,
                latitude: farmer.latitude || 0,
                longitude: farmer.longitude || 0,
                householdid: household.householdid,
                seasonal_goal: 0,
                recordid: startingRecordId + index,
            };
        });
        // 5️⃣ Check duplicates
        const existingFarmers = await Farmers.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { farmerid: { [Sequelize.Op.in]: newFarmers.map(f => f.farmerid) } },
                    { __kp_Farmer: { [Sequelize.Op.in]: newFarmers.map(f => f.__kp_Farmer) } },
                ],
            },
            attributes: ["farmerid", "__kp_Farmer"],
            raw: true,
        });

        const existingHouseholds = await Household.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { householdid: { [Sequelize.Op.in]: newHouseholds.map(h => h.householdid) } },
                    { __kp_Household: { [Sequelize.Op.in]: newHouseholds.map(h => h.__kp_Household) } },
                    { z_Farmer_Primary: { [Sequelize.Op.in]: newHouseholds.map(h => h.z_Farmer_Primary) } },
                ],
            },
            attributes: ["householdid", "__kp_Household", "z_Farmer_Primary"],
            raw: true,
        });

        const existingFarmerIds = new Set(existingFarmers.map(f => f.farmerid));
        const existingFarmerKeys = new Set(existingFarmers.map(f => f.__kp_Farmer));
        const existingHouseholdIds = new Set(existingHouseholds.map(h => h.householdid));
        const existingHouseholdKeys = new Set(existingHouseholds.map(h => h.__kp_Household));
        const existingZFarmerPrimary = new Set(existingHouseholds.map(h => h.z_Farmer_Primary));

        const filteredFarmers = [];
        const filteredHouseholds = [];
        let farmerDupCount = 0;
        let householdDupCount = 0;
        let totalDupCount = 0;

        for (let i = 0; i < newFarmers.length; i++) {
            const f = newFarmers[i];
            const h = newHouseholds[i];

            const farmerDuplicate = existingFarmerIds.has(f.farmerid) || existingFarmerKeys.has(f.__kp_Farmer);
            const householdDuplicate = existingHouseholdIds.has(h.householdid) ||
                existingHouseholdKeys.has(h.__kp_Household) ||
                existingZFarmerPrimary.has(h.z_Farmer_Primary);

            if (farmerDuplicate || householdDuplicate) {
                totalDupCount++;
                if (farmerDuplicate) farmerDupCount++;
                if (householdDuplicate) householdDupCount++;
                continue;
            }

            filteredFarmers.push(f);
            filteredHouseholds.push(h);
        }

        return {
            newFarmers: filteredFarmers,
            newHouseholds: filteredHouseholds,
            duplicates: {
                total: totalDupCount,
                farmers: farmerDupCount,
                households: householdDupCount,
            },
        };

    }
    static async ProccedApprovedFarmers(req, res) {
        try {
            const approvedFarmers = await Field_farmer.findAll({
                where: { status: "Approved" },
                order: [["id", "ASC"]],
                raw: true,
            });

            if (!approvedFarmers.length) {
                return res.status(404).json({ success: false, message: "No approved farmers found" });
            }

            const { newFarmers, newHouseholds, duplicates } = await FarmerControlller.FarmerHouseBuilder(approvedFarmers);

            if (!newFarmers.length) {
                return res.status(200).json({
                    success: false,
                    message: `All approved farmers were duplicates. Total duplicates: ${duplicates.total} (Farmers: ${duplicates.farmers}, Households: ${duplicates.households})`,
                    duplicates,
                });
            }

            const savedFarmers = await Farmers.bulkCreate(newFarmers, { ignoreDuplicates: true });
            await Household.bulkCreate(newHouseholds, { ignoreDuplicates: true });

            // Update status for uploaded farmers
            if (savedFarmers.length > 0) {
                const savedSources = savedFarmers.map(f => f.farmer_source).filter(Boolean);
                if (savedSources.length > 0) {
                    await Field_farmer.update(
                        { status: "uploaded" },
                        { where: { source_ID: savedSources } }
                    );
                }
            }

            return res.status(200).json({
                success: true,
                message: `Approved farmers processed successfully! Inserted: ${savedFarmers.length}, Duplicates skipped: ${duplicates.total} (Farmers: ${duplicates.farmers}, Households: ${duplicates.households})`,
                saved: savedFarmers.length,
                duplicates,
            });

        } catch (error) {
            console.error("ProccedApprovedFarmers error:", error);
            return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
        }
    }
    static async ImportFarmerExcel(req, res) {
        try {
            const sheetData = req.body?.farmers;

            if (!sheetData || sheetData.length === 0) {
                return res.status(400).json({ success: false, message: "No farmer data provided" });
            }

            const allFarmers = [];

            for (const row of sheetData) {
                const farmerId = row["FarmerName"];
                const stationName = row["StationName"];

                if (!farmerId || !stationName) {
                    console.warn("Skipping row due to missing FarmerID or StationName:", row);
                    continue;
                }

                let group = null;
                const groupId = row["GroupID"];

                if (groupId) {
                    group = await Groups.findOne({ where: { ID_GROUP: groupId } });

                    if (!group) {
                        const station = await Station.findOne({ where: { Name: stationName } });

                        group = await Groups.create({
                            __kp_Group: uuidv4().toUpperCase(),
                            ID_GROUP: groupId.toUpperCase(),
                            Name: row["GroupName"] || "",
                            _kf_Station: station?.__kp_Station,
                            _kf_Location: station?._kf_Location || "3658935C-18C5-49D0-9AD8-64F763570186",
                            _kf_Supplier: station?._kf_Supplier,
                            _kf_Staff: req.user?.__kp_Staff,
                            _kf_User_g: req.user?.__kp_User,
                            _kf_Quality: "",
                            _kf_Type: "",
                            Area_Big: station?.Area_Big,
                            Area_Biggest: station?.Area_Biggest,
                            Area_Medium: station?.Area_Medium,
                            Coordinates: "",
                            Notes: "",
                            Status_Program: 'Active',
                            Year_Started_Program: new Date().getFullYear(),
                            sync_farmers: 0,
                            sync_households: 0,
                            created_by: req.user?.username || "system",
                            approved_by: req.user?.username || "system",
                            approved_at: new Date(),
                            status: "approved",
                            created_at: new Date(),
                            updated_at: new Date(),
                        });
                    }
                }

                allFarmers.push({
                    farmerid: row["FarmerID"],
                    station_name: stationName,
                    farmer_name: row["FarmerName"],
                    Group_ID: group?.ID_GROUP,
                    National_ID: row["NationalID"] || "",
                    Phone: row["Phone"] || "",
                    Gender: row["Gender"] || "",
                    Year_Birth: row["YearofBirth"] || "",
                    Position: row["Position"] || "",
                    cell: row["Cell"] || "",
                    village: row["Village"] || "",
                    Trees: row["Trees"] || 0,
                    Trees_Producing: row["TreesProducing"] || 0,
                    number_of_plots_with_coffee: row["CoffeePlots"] || 0,
                    STP_Weight: row["STPWeight"] || 0,
                    latitude: row["Latitude"] || 0,
                    longitude: row["Longitude"] || 0,
                    type: row["Type"] || "new",
                    created_at: new Date(),
                    updated_at: new Date(),
                    registered_at: new Date(),
                    full_name: req.user?.username || "system",
                    _kf_Station: group?._kf_Station,
                    _kf_Supplier: group?._kf_Supplier,
                });
            }

            const { newFarmers, newHouseholds, duplicates } = await FarmerControlller.FarmerHouseBuilder(allFarmers);

            if (!newFarmers.length) {
                return res.status(200).json({
                    success: false,
                    message: `All imported farmers were duplicates. Total duplicates: ${duplicates.total} (Farmers: ${duplicates.farmers}, Households: ${duplicates.households})`,
                    duplicates,
                });
            }

            const savedFarmers = await Farmers.bulkCreate(newFarmers, { ignoreDuplicates: true });
            await Household.bulkCreate(newHouseholds, { ignoreDuplicates: true });

            return res.status(200).json({
                success: true,
                message: `Farmers imported successfully! Inserted: ${savedFarmers.length}, Duplicates skipped: ${duplicates.total} (Farmers: ${duplicates.farmers}, Households: ${duplicates.households})`,
                saved: savedFarmers.length,
                duplicates,
            });
        } catch (error) {
            console.error("ImportFarmerExcel error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to import farmers. Please check your Excel format.",
                error: error.message,
            });
        }
    }
}


export default FarmerControlller;
