import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import * as controller from "./wallets.controller.js";

export const walletsRouter = Router();

walletsRouter.use(protect);
walletsRouter.get("/me", controller.getMyWallet);
walletsRouter.get("/me/transactions", controller.listMyTransactions);
