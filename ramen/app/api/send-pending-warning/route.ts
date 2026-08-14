import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/send-pending-warning
// Sends a warning email to all pending bookings telling them their spot
// is not confirmed and will be released within 24 hours.
export async function GET() {
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, email, fname, guests, timeslot_time, booking_code, event_name, event_id, total_price")
    .eq("status", "pending");

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "Inga pending-bokningar" });
  }

  let sent = 0;

  for (const b of bookings) {
    try {
      await resend.emails.send({
        from: "Sanshō Ramen <contact@sanshoramen.se>",
        to: b.email,
        subject: `Din plats är inte bekräftad — ${b.event_name}`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
            <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C0392B;margin-bottom:12px;">Viktig information</p>
            <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Din bokning är inte klar</h1>
            <p style="font-size:15px;color:#6B6560;margin-bottom:28px;">Hej ${b.fname}! Vi märker att din bokning för <strong>${b.event_name}</strong> inte slutfördes. Din plats är <strong>inte reserverad</strong> förrän betalningen är klar.</p>

            <div style="background:#FEF3C7;border:1.5px solid #F59E0B;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
              <p style="font-size:14px;color:#92400E;line-height:1.7;margin:0;">
                Din plats kommer att släppas inom <strong>24 timmar</strong> om bokningen inte slutförs.
                ${b.total_price > 0 ? "Gå tillbaka till eventsidan och genomför betalningen för att säkra din plats." : "Gå tillbaka till eventsidan och spara ditt kort för att säkra din plats."}
              </p>
            </div>

            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:28px;">
              <tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;width:40%;">Event</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;font-weight:600;">${b.event_name}</td></tr>
              ${b.timeslot_time ? `<tr><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Tid</td><td style="padding:10px 0;border-bottom:0.5px solid #DDD8CE;">${b.timeslot_time}</td></tr>` : ""}
              <tr><td style="padding:10px 0;color:#6B6560;">Gäster</td><td style="padding:10px 0;">${b.guests} person${b.guests > 1 ? "er" : ""}</td></tr>
            </table>

            <a href="${process.env.NEXT_PUBLIC_URL}/pop-ups" style="display:inline-block;background:#1D1D1D;color:#F5F1E8;text-decoration:none;padding:14px 28px;border-radius:100px;font-size:14px;font-weight:600;">Slutför bokning →</a>

            <p style="font-size:13px;color:#6B6560;margin-top:28px;line-height:1.7;">Frågor? Hör av dig på <a href="mailto:contact@sanshoramen.se" style="color:#1D1D1D;">contact@sanshoramen.se</a></p>
            <p style="font-size:12px;color:#aaa;margin-top:24px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
          </div>
        `,
      });
      sent++;
    } catch (_) { /* continue on error */ }
  }

  return NextResponse.json({ ok: true, sent });
}
