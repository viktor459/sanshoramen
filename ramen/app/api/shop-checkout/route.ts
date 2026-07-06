import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { product_name, quantity, email } = await req.json();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, active")
    .eq("name", product_name)
    .eq("active", true)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Produkten hittades inte" }, { status: 404 });
  }

  const qty = quantity || 1;

  // Create pending order
  const { data: order } = await supabase.from("shop_orders").insert([{
    product_name: product.name,
    quantity: qty,
    total_price: product.price * qty,
    email: email || null,
    status: "pending",
  }]).select("id").single();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "sek",
        product_data: { name: product.name },
        unit_amount: product.price * 100,
      },
      quantity: qty,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/tack?type=shop&product=${encodeURIComponent(product.name)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/shop`,
    customer_email: email || undefined,
    metadata: {
      order_id: order ? String(order.id) : "",
      product_name: product.name,
      quantity: String(qty),
      total_price: String(product.price * qty),
    },
  });

  // Save session id on order
  if (order) {
    await supabase.from("shop_orders").update({ stripe_session_id: session.id }).eq("id", order.id);
  }

  return NextResponse.json({ url: session.url });
}
