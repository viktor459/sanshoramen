import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "Saknar session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.status !== "complete") return NextResponse.json({ error: "Ej slutförd" }, { status: 400 });

  const m = session.metadata!;
  const { booking_id, booking_code, event_name, fname, email, guests, total_price, timeslot_time } = m;

  // Update booking status to confirmed
  await supabase.from("bookings").update({
    status: "confirmed",
    stripe_setup_intent_id: String(session.setup_intent || ""),
  }).eq("id", booking_id);

  // Add to subscribers
  await supabase.from("subscribers").upsert([{ email }], { onConflict: "email" });

  // Send confirmation email
  try {
    await resend.emails.send({
      from: "Sanshō Ramen <contact@sanshoramen.se>",
      to: email,
      subject: `Bokning bekräftad — ${event_name}`,
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
          <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
          <h1 style="font-size:26px;font-weight:700;margin-bottom:8px;">Bokning bekräftad.</h1>
          <p style="font-size:15px;color:#6B6560;margin-bottom:32px;">Vi ses snart, ${fname}!</p>
          <div style="background:#1D1D1D;color:#F5F1E8;border-radius:12px;padding:28px;margin-bottom:28px;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:8px;">Bokningskod</div>
            <div style="font-size:30px;font-weight:700;letter-spacing:0.1em;">${booking_code}</div>
          </div>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:12px 0;border-bottom:0.5px solid #ccc;color:#6B6560;">Event</td><td style="padding:12px 0;border-bottom:0.5px solid #ccc;font-weight:500;">${event_name}</td></tr>
            ${timeslot_time ? `<tr><td style="padding:12px 0;border-bottom:0.5px solid #ccc;color:#6B6560;">Tid</td><td style="padding:12px 0;border-bottom:0.5px solid #ccc;">${timeslot_time}</td></tr>` : ""}
            <tr><td style="padding:12px 0;border-bottom:0.5px solid #ccc;color:#6B6560;">Gäster</td><td style="padding:12px 0;border-bottom:0.5px solid #ccc;">${guests} person${Number(guests) > 1 ? "er" : ""}</td></tr>
            <tr><td style="padding:12px 0;color:#6B6560;">Totalt</td><td style="padding:12px 0;font-weight:700;">${total_price} kr</td></tr>
          </table>
          <div style="background:#FFF8E7;border-radius:8px;padding:16px 20px;margin-top:28px;">
            <p style="font-size:13px;color:#856F30;line-height:1.6;">⚠️ <strong>Avbokningspolicy:</strong> Vi sparar dina kortuppgifter. Om du inte avbokar senast 48 timmar innan eventet drar vi en no-show-avgift på <strong>250 kr</strong>.</p>
          </div>
          <p style="font-size:13px;color:#6B6560;margin-top:28px;line-height:1.7;">Frågor? Hör av dig på <a href="mailto:contact@sanshoramen.se" style="color:#1D1D1D;">contact@sanshoramen.se</a></p>
        </div>
      `,
    });
  } catch (_) { /* ignore email errors */ }

  return NextResponse.json({ ok: true, booking_code, event_name, fname, email, guests, total_price, timeslot_time });
}
