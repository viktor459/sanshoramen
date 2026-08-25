import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/send-checkout-reminder
// Meant to be hit by a cron every few minutes (see vercel.json). Finds pending
// bookings whose Stripe checkout was started 5+ minutes ago but never finished,
// and nudges them back to the SAME checkout session (it stays valid for 60 min,
// see setup-booking) instead of making them start a new booking.
export async function GET(req: Request) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = Date.now();
  const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString();
  const sixtyMinAgo = new Date(now - 60 * 60 * 1000).toISOString();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_id, fname, lname, email, guests, timeslot_time, booking_code, event_name, total_price, stripe_checkout_url")
    .eq("status", "pending")
    .eq("checkout_reminder_sent", false)
    .not("stripe_checkout_url", "is", null)
    .lte("created_at", fiveMinAgo)
    .gt("created_at", sixtyMinAgo); // session already dead past this — no point sending a dead link

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Inga bokningar att påminna" });
  }

  let sent = 0;

  for (const b of bookings) {
    // Flag it if someone with the same name already has a confirmed booking for this event
    const { data: existingConfirmed } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", b.event_id)
      .eq("status", "confirmed")
      .ilike("fname", b.fname)
      .ilike("lname", b.lname || "")
      .neq("id", b.id)
      .maybeSingle();

    try {
      await resend.emails.send({
        from: "Sanshō Ramen <contact@sanshoramen.se>",
        to: b.email,
        subject: `Glöm inte att slutföra din bokning — ${b.event_name}`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
            <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C0392B;margin-bottom:12px;">Din plats är inte säkrad än</p>
            <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Nästan klart, ${b.fname}!</h1>
            <p style="font-size:15px;color:#6B6560;margin-bottom:28px;">Din bokning för <strong>${b.event_name}</strong> väntar på att slutföras. Din plats hålls i <strong>60 minuter</strong> från att du började — efter det släpps den.</p>

            ${existingConfirmed ? `<div style="background:#EAF3DE;border:1.5px solid #8FBF5C;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="font-size:13px;color:#3B6D11;line-height:1.6;margin:0;">Vi ser att det redan finns en <strong>bekräftad</strong> bokning under namnet ${b.fname} ${b.lname || ""} för det här eventet. Om det är du kan du bortse från detta mejl.</p>
            </div>` : ""}

            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:28px;">
              <tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;width:40%;">Event</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;font-weight:600;">${b.event_name}</td></tr>
              ${b.timeslot_time ? `<tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Tid</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;">${b.timeslot_time}</td></tr>` : ""}
              <tr><td style="padding:10px 0;color:#6B6560;">Gäster</td><td style="padding:10px 0;">${b.guests} person${b.guests > 1 ? "er" : ""}</td></tr>
            </table>

            <a href="${b.stripe_checkout_url}" style="display:inline-block;background:#1D1D1D;color:#F5F1E8;text-decoration:none;padding:14px 28px;border-radius:100px;font-size:14px;font-weight:600;">Fortsätt din bokning →</a>

            <p style="font-size:13px;color:#6B6560;margin-top:28px;line-height:1.7;">Frågor? Hör av dig på <a href="mailto:contact@sanshoramen.se" style="color:#1D1D1D;">contact@sanshoramen.se</a></p>
            <p style="font-size:12px;color:#aaa;margin-top:24px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
          </div>
        `,
      });
      await supabase.from("bookings").update({ checkout_reminder_sent: true }).eq("id", b.id);
      sent++;
    } catch (_) { /* continue on error */ }
  }

  return NextResponse.json({ ok: true, sent });
}
