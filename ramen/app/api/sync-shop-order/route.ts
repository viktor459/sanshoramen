import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { order_id, stripe_session_id } = await req.json();
  if (!stripe_session_id) return NextResponse.json({ error: "Saknar session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(stripe_session_id);
  if (session.payment_status === "paid") {
    await supabase.from("shop_orders")
      .update({ status: "paid", email: session.customer_email || undefined })
      .eq("id", order_id);
    return NextResponse.json({ status: "paid" });
  }

  return NextResponse.json({ status: session.payment_status });
}
