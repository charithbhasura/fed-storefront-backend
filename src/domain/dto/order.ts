import { z } from "zod";
export const CreateOrderDTO = z.object({
  items: z.array(
    z.object({
      product: z.object({
        _id: z.string().optional(),
        name: z.string(),
        price: z.number(),
        image: z.string(),
        description: z.string(),
      }),
      quantity: z.number().min(1),
    })
  ),
  shippingAddress: z.object({
    line_1: z.string(),
    line_2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip_code: z.string(),
    phone: z.string(),
  }),
}).passthrough(); // Ensures no extra fields are present

// To debug, add this log in your order handler before validation:
// console.log("Incoming order data:", req.body);

// If you continue to get errors, the issue is with the shape of the incoming data.
// Compare the logged data to this schema to find mismatches.