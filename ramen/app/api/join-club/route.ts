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
      price_data: {
        currency: "sek",
        recurring: { interval: "month" },
        product_data: {
          name: "Sanshō Ramen Club",
          description: "Early access to all pop-up bookings + private events",
        },
        unit_amount: 9900, // 99 SEK in öre
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/tack?type=club&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/#club`,
    metadata: { email, fname: fname || "" },
  });

  return NextResponse.json({ url: session.url });
}
