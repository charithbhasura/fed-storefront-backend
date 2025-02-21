import express from "express";
import {
    createCheckoutSession,
    handleWebhook,
    retrieveSessionStatus,
  } from "../application/Payment";
  import bodyParser from "body-parser";

export const paymentsRouter = express.Router();

paymentsRouter.route("/webhook").post(bodyParser.raw({ type: "application/json" }), handleWebhook);
paymentsRouter.route("/create-checkout-session").post(createCheckoutSession);
paymentsRouter.route("/session-status").get(retrieveSessionStatus);