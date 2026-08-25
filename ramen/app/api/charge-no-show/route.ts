import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

const NO_SHOW_FEE_SEK = 250;

export async function POST(req: Request) {
  const { booking_id } = await req.json();
  if (!booking_id) return NextResponse.json({ error: "Saknar booking_id" }, { status: 400 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, booking_code, fname, lname, email, stripe_customer_id, stripe_setup_intent_id, no_show_charged_at")
    .eq("id", booking_id)
    .single();

  if (error || !booking) return NextResponse.json({ error: "Bokning hittades inte" }, { status: 404 });
  if (booking.no_show_charged_at) return NextResponse.json({ error: "No-show-avgift redan dragen för denna bokning" }, { status: 400 });
  if (!booking.stripe_setup_intent_id) return NextResponse.json({ error: "Inget sparat kort för denna bokning" }, { status: 400 });

  const setupIntent = await stripe.setupIntents.retrieve(booking.stripe_setup_intent_id);
  const paymentMethod = setupIntent.payment_method;
  const customer = booking.stripe_customer_id || setupIntent.customer;

  if (!paymentMethod || !customer) {
    return NextResponse.json({ error: "Kunde inte hitta sparad betalningsmetod" }, { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: NO_SHOW_FEE_SEK * 100,
      currency: "sek",
      customer: String(customer),
      payment_method: String(paymentMethod),
      off_session: true,
      confirm: true,
      description: `No-show-avgift — ${booking.booking_code}`,
      metadata: { booking_id: String(booking.id), booking_code: booking.booking_code, type: "no_show_fee" },
    });

    await supabase.from("bookings").update({ no_show_charged_at: new Date().toISOString() }).eq("id", booking_id);

    return NextResponse.json({ ok: true, payment_intent_id: paymentIntent.id, status: paymentIntent.status });
  } catch (e: any) {
    const message = e?.raw?.message || e?.message || "Kortdebitering misslyckades";
    return NextResponse.json({ error: message }, { status: 402 });
  }
}
