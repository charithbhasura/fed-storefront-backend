import express from "express";
import "dotenv/config";
import globalErrorHandlingMiddleware from "./api/middleware/global-error-handling-middleware";
import cors from "cors";
import { connectDB } from "./infrastructure/db";
import { clerkMiddleware } from "@clerk/express";
import { productRouter } from "./api/product";
import { categoryRouter } from "./api/category";
import { orderRouter } from "./api/order";
import { paymentsRouter } from "./api/payment";
import {shopRouter} from "./api/Shop";
import { handleWebhook } from "./application/Payment";
import bodyParser from "body-parser";


const app = express();
app.use(express.json()); // For parsing JSON requests
app.use(clerkMiddleware());
// app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(cors({ origin: "https://fed-storefront-frontend-charith.netlify.app" }));

// Use CORS middleware with more comprehensive configuration
// app.use(cors({
//     origin: 'http://localhost:5173',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true, // Allow cookies to be sent
//     allowedHeaders: 'Content-Type,Authorization',
//   }));


app.post(
    "/api/stripe/webhook",
    bodyParser.raw({ type: "application/json" }),
    handleWebhook
  );
  
  app.use(express.json()); // For parsing JSON requests


app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/shop",shopRouter);

app.use(globalErrorHandlingMiddleware);

connectDB();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));