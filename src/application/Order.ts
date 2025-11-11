import { NextFunction, Request, Response } from "express";
import ValidationError from "../domain/errors/validation.error";
import Order from "../infrastructure/schemas/Order";
import Product from "../infrastructure/schemas/Product";
import Address from "../infrastructure/schemas/Address";
import { CreateOrderDTO } from "../domain/dto/order";
import mongoose from "mongoose";

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Incoming order data:", JSON.stringify(req.body, null, 2));

    const result = CreateOrderDTO.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Invalid order data");
    }

    //Validate product stock and adjust inventory
    for (const item of result.data.items) {
      const product = await Product.findById(item.product._id).session(session);

      if (!product) {
        throw new ValidationError(`Product ${item.product._id} not found`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`
        );
      }

      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stockQuantity: -item.quantity } },
        { session }
      );
    }

    //Clerk user or local fallback for dev mode
    const userId =
      req.auth?.userId ||
      (process.env.NODE_ENV === "development" ? "local-test-user" : null);

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    //Save shipping address
    const [address] = await Address.create(
      [{ ...result.data.shippingAddress }],
      { session }
    );

    //Create order
    const [createdOrder] = await Order.create(
      [
        {
          userId,
          items: result.data.items,
          addressId: address._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    console.log("Order created successfully:", createdOrder._id);
    return res.status(201).json({
      message: "Order created successfully",
      order: createdOrder,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Order creation failed:", error.message);
    return res.status(400).json({
      message: error.message || "Order creation failed",
    });
  } finally {
    session.endSession();
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    // Updated population logic
    const orders = await Order.findById(id)
      .populate({ path: "addressId", model: "Address" })
      .populate({ path: "items.product", model: "Product" }); 

    if (!orders) {
      throw new ValidationError("Order not found");
    }
    res.status(200).json(orders);
    return;
  } catch (error) {
    next(error);
  }
};