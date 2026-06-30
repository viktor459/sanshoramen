import { stripe } from "../../../lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { product_name, price, quantity, email } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "sek",
        product_data: { name: product_name },
        unit_amount: price * 100,
      },
      quantity: quantity || 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/tack?type=shop&product=${encodeURIComponent(product_name)}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/shop`,
    customer_email: email || undefined,
  });

  return NextResponse.json({ url: session.url });
}
