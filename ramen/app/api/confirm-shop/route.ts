import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "Saknar session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Ej betald" }, { status: 400 });
  }

  const m = session.metadata!;
  await supabase.from("shop_orders")
    .update({ status: "paid", email: session.customer_email || m.email })
    .eq("stripe_session_id", session_id);

  return NextResponse.json({ ok: true, product_name: m.product_name, total_price: m.total_price });
}
