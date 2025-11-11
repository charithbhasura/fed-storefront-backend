import { NextFunction, Request, Response } from "express";
import Order from "../infrastructure/schemas/Order";
import Product from "../infrastructure/schemas/Product"; 
import stripe from "../infrastructure/stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const FRONTEND_URL = "https://fed-storefront-frontend-charith.netlify.app";

async function fulfillCheckout(sessionId: string) {
  console.log("Fulfilling Checkout Session " + sessionId);

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  if (checkoutSession.payment_status !== "unpaid") {
    // Perform fulfillment of the line items
    const lineItems = checkoutSession.line_items?.data;
    if (lineItems) {
      for (const item of lineItems) {
        const productId = item.price?.id; 
        const product = await Product.findById(productId);

        if (product && product.stockQuantity > 0) {
          product.stockQuantity -= 1; // Reduce the stock by 1
          await product.save();

          const order = new Order({
            sessionId: sessionId,
            itemId: productId,
            quantity: item.quantity,
            status: "fulfilled",
          });
          await order.save();
        } else {
          console.log(`${product} is out of stock`);
        }
      }
    }
    console.log("Fulfillment completed for session " + sessionId);
  }
}

export const handleWebhook = async (
  req: Request, 
  res: Response,
  next: NextFunction
) => {
  const payload = req.body;
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as any;
      await fulfillCheckout(session.id);
      res.status(200).send();
      return;
    }
  } catch (e) {
    const error = e as Error;
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }
};

export const createCheckoutSession = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { items } = req.body; // items from frontend

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: { name: any; price: number; quantity: any; }) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: item.price * 100, // Stripe expects cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${FRONTEND_URL}/shop/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/shop/cancel`,
    });

    res.json({ url: session.url });
    return;
  } catch (error) {
    next(error);
  }
};

export const retrieveSessionStatus = async (
  req: Request, 
  res: Response,
  next: NextFunction
) => {
  const session = await stripe.checkout.sessions.retrieve(
    req.query.session_id as string
  );

  res.send({
    status: session.status,
    customer_email: session.customer_details?.email,
  });
  return;
};

export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};