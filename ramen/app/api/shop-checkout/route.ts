import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { product_name, quantity, email } = await req.json();

  // Fetch price from DB — never trust client-sent price
  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, active")
    .eq("name", product_name)
    .eq("active", true)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Produkten hittades inte" }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "sek",
        product_data: { name: product.name },
        unit_amount: product.price * 100,
      },
      quantity: quantity || 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/tack?type=shop&product=${encodeURIComponent(product.name)}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/shop`,
    customer_email: email || undefined,
  });

  return NextResponse.json({ url: session.url });
}
