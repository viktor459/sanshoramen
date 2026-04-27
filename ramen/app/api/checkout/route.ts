import { stripe } from "../../../lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { event_name, price, guests, event_id, timeslot_id, timeslot_time, fname, lname, email, note } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "sek",
        product_data: { name: event_name },
        unit_amount: price * 100,
      },
      quantity: guests,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/tack?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pop-ups`,
    metadata: { event_id, timeslot_id, timeslot_time, fname, lname, email, note, guests },
    customer_email: email,
  });

  return NextResponse.json({ url: session.url });
}