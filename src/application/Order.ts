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
    const result = CreateOrderDTO.safeParse(req.body);
//    console.log("Incoming order data:", req.body);
    if (!result.success) {
      throw new ValidationError("Invalid order data");
    }

    for (const item of result.data.items) {
      // console.log("Looking up product with ID:", item.product?._id);
      const product = await Product.findById(item.product._id).session(session);
      // console.log("Fetched product from DB:", product);
      
      if (!product) {
        throw new ValidationError(`Product ${item.product._id} not found`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}`
        );
      }

      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stockQuantity: -item.quantity } },
        { session }
      );
    }

    const userId = req.auth?.userId;

    const address = await Address.create([{
      ...result.data.shippingAddress,
    }], { session });

    const [createdOrder] = await Order.create([{
      userId: userId,
      items: result.data.items,
      addressId: address[0]._id,
    }], { session });

    await session.commitTransaction();
    res.status(201).json(createdOrder); // <-- Return the created order!
    return;

  } catch (error) {
    await session.abortTransaction();
    next(error);
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
      .populate({ path: "items.product", model: "Product" }); // <-- Correct

    if (!orders) {
      throw new ValidationError("Order not found");
    }
    res.status(200).json(orders);
    return;
  } catch (error) {
    next(error);
  }
};