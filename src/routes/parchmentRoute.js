import express from 'express';
import DeliveryProcessing from '../controllers/DeliveryProcessingController.js';
import { Routeguard } from '../middleware/auth.js';
import ParchmentTransport from '../controllers/ParchmentTransportController.js';
import AssignParchment from '../controllers/AssignParchmentController.js';

const parchmentRoutes = express.Router();
//assign parchment 
parchmentRoutes.get('/assigned', Routeguard, AssignParchment.getAllAssignedParchments);
parchmentRoutes.get('/alldryings', Routeguard, AssignParchment.getAllDryings);
parchmentRoutes.get('/allTransactions',  AssignParchment.getAllTransactions);

// delivery processing
parchmentRoutes.get('/processing', Routeguard, DeliveryProcessing.getDeliveryReports);
parchmentRoutes.post('/process_delivery/:id', Routeguard, DeliveryProcessing.ProcessDelivelies);
parchmentRoutes.get('/post_delivery', Routeguard, DeliveryProcessing.PostDeliveryData);

// parchment transport
parchmentRoutes.get('/deliveries', Routeguard, ParchmentTransport.getDeliveries);
parchmentRoutes.get("/deliveries/:id", Routeguard, ParchmentTransport.getDeliveryDetails);
parchmentRoutes.get("/loading_lots", Routeguard, ParchmentTransport.getLotsOfLoading);
parchmentRoutes.get("/allLots", Routeguard, ParchmentTransport.getAllLots);
parchmentRoutes.post("/deliver_parchment", Routeguard, ParchmentTransport.deliverParchment);

export default parchmentRoutes;