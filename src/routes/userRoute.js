import express from "express";
import UserController from "../controllers/userController.js";
import { Routeguard } from '../middleware/auth.js';
const userRoute = express.Router();

userRoute.patch("/updatePassword/:userId", Routeguard, UserController.updateCredentials);
userRoute.patch("/toggle/:userId", Routeguard, UserController.UserActivation);
userRoute.get("/allUsers",Routeguard, UserController.getAllUsers);
userRoute.post("/login", UserController.loginUser);

export default userRoute;