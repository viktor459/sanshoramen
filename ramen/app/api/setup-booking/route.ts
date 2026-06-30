import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { event_name, event_id, timeslot_id, timeslot_time, fname, lname, email, guests, note, price } = await req.json();

  // Generate booking code
  const booking_code = "SR-" + Math.random().toString(36).substring(2, 7).toUpperCase();

  // Save pending booking to DB
  const { data: booking, error } = await supabase.from("bookings").insert([{
    event_id,
    event_name,
    fname,
    lname,
    email,
    guests: Number(guests),
    note,
    total_price: price * Number(guests),
    timeslot_id: timeslot_id || null,
    timeslot_time: timeslot_time || null,
    booking_code,
    status: "pending",
  }]).select("id").single();

  if (error || !booking) {
    return NextResponse.json({ error: "Kunde inte spara bokning" }, { status: 500 });
  }

  // Decrease spots_left
  if (timeslot_id) {
    await supabase.rpc("decrement_timeslot_spots", { slot_id: timeslot_id, n: Number(guests) }).maybeSingle();
  } else {
    await supabase.rpc("decrement_event_spots", { ev_id: event_id, n: Number(guests) }).maybeSingle();
  }

  // Create Stripe Checkout in setup mode (card verification, no charge)
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    currency: "sek",
    payment_method_types: ["card"],
    customer_email: email,
    success_url: `${process.env.NEXT_PUBLIC_URL}/tack?session_id={CHECKOUT_SESSION_ID}&type=booking`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pop-ups`,
    metadata: {
      booking_id: String(booking.id),
      booking_code,
      event_name,
      fname,
      email,
      guests: String(guests),
      total_price: String(price * Number(guests)),
      timeslot_time: timeslot_time || "",
      location: "",
      date: "",
    },
  });

  return NextResponse.json({ url: session.url });
}
