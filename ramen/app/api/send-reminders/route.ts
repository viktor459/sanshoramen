import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/send-reminders
// Sends reminder emails to all confirmed bookings for events happening in 1-3 days.
// Trigger manually from the admin bookings tab, or visit the URL directly.
export async function GET() {
  const today = new Date();
  const from = new Date(today); from.setDate(today.getDate() + 1);
  const to = new Date(today); to.setDate(today.getDate() + 3);

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, time, location")
    .gte("date", fromStr)
    .lte("date", toStr);

  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Inga event inom 1-3 dagar" });
  }

  const eventIds = events.map(e => e.id);
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, email, fname, guests, vegetarian_count, timeslot_time, booking_code, event_name, event_id")
    .in("event_id", eventIds)
    .eq("status", "confirmed");

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Inga bekräftade bokningar" });
  }

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));
  let sent = 0;

  for (const b of bookings) {
    const ev = eventMap[b.event_id];
    if (!ev) continue;

    const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(ev.date)
      ? new Date(ev.date + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })
      : ev.date;

    const daysUntil = Math.round((new Date(ev.date + "T12:00:00").getTime() - today.getTime()) / 86400000);

    try {
      await resend.emails.send({
        from: "Sanshō Ramen <contact@sanshoramen.se>",
        to: b.email,
        subject: `Påminnelse: ${b.event_name} ${daysUntil === 1 ? "imorgon" : `om ${daysUntil} dagar`}`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
            <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C0392B;margin-bottom:12px;">Påminnelse</p>
            <h1 style="font-size:26px;font-weight:700;margin-bottom:8px;">Vi ses ${daysUntil === 1 ? "imorgon" : `om ${daysUntil} dagar"}`}!</h1>
            <p style="font-size:15px;color:#6B6560;margin-bottom:32px;">Hej ${b.fname}! Här är en påminnelse om din bokning.</p>

            <div style="background:#1D1D1D;color:#F5F1E8;border-radius:12px;padding:24px;margin-bottom:28px;">
              <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Bokningskod</div>
              <div style="font-size:24px;font-weight:700;letter-spacing:0.1em;">${b.booking_code}</div>
            </div>

            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;width:40%;">Event</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;font-weight:600;">${b.event_name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Datum</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;">${formattedDate}</td></tr>
              ${ev.time ? `<tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Tid</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;">${b.timeslot_time || ev.time}</td></tr>` : ""}
              ${ev.location ? `<tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Adress</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;"><a href="https://maps.google.com/maps?q=${encodeURIComponent(ev.location)}" style="color:#1D1D1D;">${ev.location}</a></td></tr>` : ""}
              <tr><td style="padding:10px 0;color:#6B6560;">Gäster</td><td style="padding:10px 0;">${b.guests} person${b.guests > 1 ? "er" : ""}${b.vegetarian_count > 0 ? ` (${b.vegetarian_count} vegetarisk)` : ""}</td></tr>
            </table>

            <div style="background:#FFF8E7;border-radius:8px;padding:16px 20px;margin-top:24px;">
              <p style="font-size:13px;color:#856F30;line-height:1.6;">Kan du inte komma? Avboka senast 48 timmar innan via <a href="mailto:contact@sanshoramen.se" style="color:#856F30;">contact@sanshoramen.se</a> för att undvika no-show-avgift.</p>
            </div>

            <p style="font-size:13px;color:#6B6560;margin-top:28px;line-height:1.7;">Vi ser fram emot att träffa dig!<br /><strong>/ Sanshō Ramen</strong></p>
            <p style="font-size:12px;color:#aaa;margin-top:24px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
          </div>
        `,
      });
      sent++;
    } catch (_) { /* continue on error */ }
  }

  return NextResponse.json({ ok: true, sent });
}
