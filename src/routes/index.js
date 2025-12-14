import { Router } from "express";
import userRoutes from './userRoute.js'
import moduleRoutes from "./moduleRoute.js";
import registerRoutes from "./registerRoutes.js";
import parchmentRoutes from "./parchmentRoute.js";
import reportRoutes from "./reportRoutes.js";


const router = Router();
router.use("/users", userRoutes);
router.use("/modules", moduleRoutes);
router.use('/farmers', registerRoutes);
router.use('/parchment', parchmentRoutes);
router.use('/report', reportRoutes);

export default router;