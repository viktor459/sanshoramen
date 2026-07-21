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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "Saknar session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.status !== "complete") return NextResponse.json({ error: "Ej slutförd" }, { status: 400 });

  const m = session.metadata!;
  const { booking_id, booking_code, event_name, fname, email, guests, total_price, timeslot_time, date, location, event_time, vegetarian_count, newsletter_consent } = m;

  await supabase.from("bookings").update({
    status: "confirmed",
    stripe_setup_intent_id: String(session.setup_intent || ""),
  }).eq("id", booking_id);

  let unsubscribeToken: string | null = null;
  if (newsletter_consent === "1") {
    const { data: sub } = await supabase.from("subscribers").upsert([{ email }], { onConflict: "email" }).select("unsubscribe_token").single();
    unsubscribeToken = sub?.unsubscribe_token ?? null;
    try {
      const audienceId = event_name.toLowerCase().includes("lunds nation")
        ? "8b1e1750-7e45-47c6-b6be-20efb71f5235"
        : "a0ff9f3b-8238-4e07-b6ab-5e7dbcd6e0c1";
      await resend.contacts.create({
        audienceId,
        email,
        firstName: fname,
        lastName: m.lname || "",
        unsubscribed: false,
      });
    } catch (_) { /* ignore */ }
  }

  const formattedDate = formatDate(date);
  const gcalLink = calendarUrl(event_name, date, location, event_time);
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
            ${event_time ? `<tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Tid</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;">${timeslot_time || event_time}</td></tr>` : ""}
            ${location ? `<tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Adress</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;"><a href="https://maps.google.com/maps?q=${encodeURIComponent(location)}" style="color:#1D1D1D;">${location}</a></td></tr>` : ""}
            <tr><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;color:#6B6560;">Gäster</td><td style="padding:12px 0;border-bottom:0.5px solid #DDD8CE;">${guests} person${Number(guests) > 1 ? "er" : ""}${vegCount > 0 ? ` (${vegCount} vegetarisk)` : ""}</td></tr>
            <tr><td style="padding:12px 0;color:#6B6560;">Totalt</td><td style="padding:12px 0;font-weight:700;">${Number(total_price) > 0 ? `${total_price} kr` : "Gratis"}</td></tr>
          </table>

          ${gcalLink ? `<a href="${gcalLink}" style="display:inline-block;margin-top:24px;padding:12px 22px;background:#F5F1E8;border:1.5px solid #1D1D1D;border-radius:100px;text-decoration:none;color:#1D1D1D;font-size:13px;font-weight:500;">+ Lägg till i Google Kalender</a>` : ""}

          <div style="background:#FFF8E7;border-radius:8px;padding:16px 20px;margin-top:28px;">
            <p style="font-size:13px;color:#856F30;line-height:1.6;">⚠️ <strong>Avbokningspolicy:</strong> Vi sparar dina kortuppgifter. Om du inte avbokar senast 48 timmar innan eventet drar vi en no-show-avgift på <strong>250 kr</strong>. Avboka via <a href="mailto:contact@sanshoramen.se" style="color:#856F30;">contact@sanshoramen.se</a>.</p>
          </div>

          <p style="font-size:13px;color:#6B6560;margin-top:28px;line-height:1.7;">Frågor? Hör av dig på <a href="mailto:contact@sanshoramen.se" style="color:#1D1D1D;">contact@sanshoramen.se</a></p>
          <p style="font-size:12px;color:#aaa;margin-top:24px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne${unsubscribeToken ? ` · <a href="${process.env.NEXT_PUBLIC_URL}/api/unsubscribe?token=${unsubscribeToken}" style="color:#aaa;">Unsubscribe</a>` : ""}</p>
        </div>
      `,
    });
  } catch (_) { /* ignore email errors */ }

  return NextResponse.json({ ok: true, booking_code, event_name, fname, email, guests, total_price, timeslot_time });
}
