import { stripe } from "../../../lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, fname } = await req.json();
  if (!email?.includes("@")) return NextResponse.json({ error: "Ogiltig e-post" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{
      price: "price_1TrJGh9CwB7hbw2RwGqZ9LLy",
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/tack?type=club&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/#club`,
    metadata: { email, fname: fname || "" },
  });

  return NextResponse.json({ url: session.url });
}
