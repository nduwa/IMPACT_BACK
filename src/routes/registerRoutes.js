import express from 'express';
import { Routeguard } from '../middleware/auth.js';
import FarmerControlller from '../controllers/farmerController.js';
import GroupController from '../controllers/GroupController.js';

const registerRoutes = express.Router();

registerRoutes.get('/station_groups', Routeguard, GroupController.getStationGroups);
registerRoutes.get('/geodata', GroupController.getGeoJsonData);


registerRoutes.post('/import', Routeguard, FarmerControlller.importNewFarmer);
registerRoutes.post('/create', Routeguard, FarmerControlller.addNewFarmer);
registerRoutes.get('/allFarmers', Routeguard, FarmerControlller.getAllFarmers);
registerRoutes.get('/allPending', Routeguard, FarmerControlller.getPendingFarmers);
registerRoutes.get('/allApproved', Routeguard, FarmerControlller.getApprovedFarmers);
registerRoutes.patch('/approveFarmer/:id', Routeguard, FarmerControlller.ApproveNewFarmers);
registerRoutes.delete('/deleteFarmer/:id', Routeguard, FarmerControlller.deleteFarmerData);

registerRoutes.get('/farmer_procced', Routeguard, FarmerControlller.ProccedApprovedFarmers);
registerRoutes.post('/import_farmer', Routeguard, FarmerControlller.ImportFarmerExcel)

export default registerRoutes;