import express from 'express';
import AccessModulesController from '../controllers/AccessModulesController.js';
import { Routeguard } from '../middleware/auth.js';

const moduleRoutes = express.Router();

moduleRoutes.post('/assign', Routeguard, AccessModulesController.assignWebAccess);
moduleRoutes.get('/access-modules', Routeguard, AccessModulesController.AccessModules);
moduleRoutes.get('/assigned-access/:userId', Routeguard, AccessModulesController.getAssignedAccess);
moduleRoutes.patch('/assign-phone-access/:userId', Routeguard, AccessModulesController.assignPhoneAccess);
moduleRoutes.get('/userAssignedmodules', Routeguard, AccessModulesController.getUserAssignedAccess);

export default moduleRoutes;