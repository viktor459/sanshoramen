import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const formatDate = (dateStr: string) => {
  if (!dateStr) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  return dateStr;
};

const calendarUrl = (event_name: string, date: string, location: string, event_time: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = date.replace(/-/g, "");
  const start = event_time ? `${d}T${event_time.replace(":", "")}00` : `${d}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Sanshō Ramen — ${event_name}`,
    dates: `${start}/${start}`,
    location,
    details: "Din bokning hos Sanshō Ramen. Se bokningsbekräftelsen för mer info.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export async function POST(req: Request) {
  const { event_name, event_id, timeslot_id, timeslot_time, fname, lname, email, phone, guests, note, price, vegetarian_count, date, location, time } = await req.json();

  // Fetch event to check require_card
  const { data: event } = await supabase.from("events").select("require_card").eq("id", event_id).single();
  const requireCard = event?.require_card !== false; // default true if missing

  const booking_code = "SR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  const total_price = price ? price * Number(guests) : 0;

  const { data: booking, error } = await supabase.from("bookings").insert([{
    event_id,
    event_name,
    fname,
    lname,
    email,
    phone: phone || null,
    guests: Number(guests),
    note,
    vegetarian_count: Number(vegetarian_count ?? 0),
    total_price,
    timeslot_id: timeslot_id || null,
    timeslot_time: timeslot_time || null,
    booking_code,
    status: requireCard ? "pending" : "confirmed",
  }]).select("id").single();

  if (error || !booking) {
    return NextResponse.json({ error: "Kunde inte spara bokning" }, { status: 500 });
  }

  if (timeslot_id) {
    await supabase.rpc("decrement_timeslot_spots", { slot_id: timeslot_id, n: Number(guests) }).maybeSingle();
  } else {
    await supabase.rpc("decrement_event_spots", { ev_id: event_id, n: Number(guests) }).maybeSingle();
  }

  if (!requireCard) {
    // No card required — confirm immediately and send email
    await supabase.from("subscribers").upsert([{ email }], { onConflict: "email" });
    const formattedDate = formatDate(date);
    const gcalLink = calendarUrl(event_name, date || "", location || "", time || "");
    const vegCount = Number(vegetarian_count ?? 0);

    try {
      await resend.emails.send({
        from: "Sanshō Ramen <contact@sanshoramen.se>",
        to: email,
        subject: `Bokning bekräftad — ${event_name}`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
            <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
            <h1 style="font-size:26px;font-weight:700;margin-bottom:8px;letter-spacing:0.04em;">Bokning bekräftad.</h1>
            <p style="font-size:15px;color:#6B6560;margin-bottom:32px;">Vi ses snart, ${fname}!</p>

            <div style="background:#1D1D1D;color:#F5F1E8;border-radius:12px;padding:28px;margin-bottom:28px;">
              <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:8px;">Bokningskod</div>
              <div style="font-size:30px;font-weight:700;letter-spacing:0.1em;">${booking_code}</div>
            </div>

            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;width:40%;">Event</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;font-weight:600;">${event_name}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Datum</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;">${formattedDate || date}</td></tr>
              ${time ? `<tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Tid</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;">${timeslot_time || time}</td></tr>` : ""}
              ${location ? `<tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Adress</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;"><a href="https://maps.google.com/maps?q=${encodeURIComponent(location)}" style="color:#1D1D1D;">${location}</a></td></tr>` : ""}
              <tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Gäster</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;">${guests} person${Number(guests) > 1 ? "er" : ""}${vegCount > 0 ? ` (${vegCount} vegetarisk)` : ""}</td></tr>
              <tr><td style="padding:12px 0;color:#6B6560;">Totalt</td><td style="padding:12px 0;font-weight:700;">${total_price > 0 ? `${total_price} kr` : "Betalas på plats"}</td></tr>
            </table>

            ${gcalLink ? `<a href="${gcalLink}" style="display:inline-block;margin-top:24px;padding:12px 22px;background:#F5F1E8;border:1.5px solid #1D1D1D;border-radius:100px;text-decoration:none;color:#1D1D1D;font-size:13px;font-weight:500;">+ Lägg till i Google Kalender</a>` : ""}

            <p style="font-size:13px;color:#6B6560;margin-top:28px;line-height:1.7;">Frågor? Hör av dig på <a href="mailto:contact@sanshoramen.se" style="color:#1D1D1D;">contact@sanshoramen.se</a></p>
            <p style="font-size:12px;color:#aaa;margin-top:24px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
          </div>
        `,
      });
    } catch (_) { /* ignore email errors */ }

    const redirectParams = new URLSearchParams({
      type: "booking",
      booking_code,
      fname,
      event_name,
      guests: String(guests),
    });
    return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_URL}/tack?${redirectParams.toString()}` });
  }

  // Card required — create Stripe setup session
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
      phone: phone || "",
      guests: String(guests),
      vegetarian_count: String(vegetarian_count ?? 0),
      total_price: String(total_price),
      timeslot_time: timeslot_time || "",
      date: date || "",
      location: location || "",
      event_time: time || "",
    },
  });

  return NextResponse.json({ url: session.url });
}
