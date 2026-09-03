import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/send-followup
// Sends follow-up/feedback emails to all confirmed bookings for events that happened yesterday.
// Trigger manually from the admin bookings tab the day after an event.
export async function GET() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, date, location")
    .eq("date", dateStr);

  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Inga event igår" });
  }

  const slugByEventId = new Map(events.map(e => [e.id, e.slug]));

  const eventIds = events.map(e => e.id);
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, email, fname, booking_code, event_name, event_id")
    .in("event_id", eventIds)
    .eq("status", "confirmed");

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Inga bekräftade bokningar" });
  }

  let sent = 0;

  for (const b of bookings) {
    const feedbackUrl = `https://sanshoramen.se/review/${slugByEventId.get(b.event_id)}`;
    try {
      await resend.emails.send({
        from: "Sanshō Ramen <contact@sanshoramen.se>",
        to: b.email,
        subject: `Hur var det? — ${b.event_name}`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
            <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
            <h1 style="font-size:26px;font-weight:700;margin-bottom:8px;">Tack för igår, ${b.fname}!</h1>
            <p style="font-size:15px;color:#6B6560;line-height:1.8;margin-bottom:32px;">Vi hoppas att du hade en fantastisk kväll på <strong>${b.event_name}</strong>. Din feedback hjälper oss att bli bättre.</p>

            <p style="font-size:15px;color:#1D1D1D;margin-bottom:20px;font-weight:600;">Hur upplevde du kvällen?</p>

            <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
              <a href="${feedbackUrl}" style="padding:12px 20px;background:#1D1D1D;color:#F5F1E8;text-decoration:none;border-radius:100px;font-size:13px;font-weight:500;">⭐ Lämna feedback</a>
              <a href="https://www.instagram.com/sanshoramen" target="_blank" style="padding:12px 20px;background:transparent;color:#1D1D1D;border:1.5px solid #1D1D1D;text-decoration:none;border-radius:100px;font-size:13px;font-weight:500;">Följ oss på Instagram</a>
            </div>

            <p style="font-size:13px;color:#6B6560;margin-bottom:32px;line-height:1.7;">Håll utkik på Instagram — det är där vi annonserar nästa pop-up.</p>

            <p style="font-size:13px;color:#6B6560;margin-top:28px;line-height:1.7;">Tack för att du var med.<br /><strong>/ Sanshō Ramen</strong></p>
            <p style="font-size:12px;color:#aaa;margin-top:24px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
          </div>
        `,
      });
      sent++;
    } catch (_) { /* continue */ }
  }

  return NextResponse.json({ ok: true, sent });
}
