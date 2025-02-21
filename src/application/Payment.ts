import { NextFunction, Request, Response } from "express";
import Order from "../infrastructure/schemas/Order";
import stripe from "../infrastructure/stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const FRONTEND_URL = process.env.FRONTEND_URL as string;

async function fulfillCheckout(sessionId: string) {
  // Set your secret key. Remember to switch to your live secret key in production.
  // See your keys here: https://dashboard.stripe.com/apikeys
  console.log("Fulfilling Checkout Session " + sessionId);

  // TODO: Make this function safe to run multiple times,
  // even concurrently, with the same session ID

  // TODO: Make sure fulfillment hasn't already been
  // peformed for this Checkout Session

  // Retrieve the Checkout Session from the API with line_items expanded
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  // Check the Checkout Session's payment_status property
  // to determine if fulfillment should be peformed
  if (checkoutSession.payment_status !== "unpaid") {
    // TODO: Perform fulfillment of the line items
    // TODO: Record/save fulfillment status for this
    // Checkout Session
  }
}

export const handleWebhook = async (req: Request, res: Response) => {
  const payload = req.body;
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      console.log(event);
      res.status(200).send();
      return;
    }
  } catch (err) {
    // @ts-ignore
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: [
      {
        price: "price_1Qt1arJjbWEvglIU4ZKpMw3f",
        quantity: 1,
      },
    ],
    mode: "payment",
    return_url: `${FRONTEND_URL}/shop/complete?session_id={CHECKOUT_SESSION_ID}`,
  });

  res.send({ clientSecret: session.client_secret });
};

export const retrieveSessionStatus = async (req: Request, res: Response) => {
  const session = await stripe.checkout.sessions.retrieve(
    req.query.session_id as string
  );

  res.send({
    status: session.status,
    customer_email: session.customer_details?.email,
  });
};