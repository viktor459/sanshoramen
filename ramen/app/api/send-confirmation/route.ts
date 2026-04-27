import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { fname, email, event_name, date, location, time, guests, total_price, booking_code } = await req.json();

  await resend.emails.send({
    from: "Sanshō Ramen <contact@sanshoramen.se>",
    to: email,
    subject: `Bokningsbekräftelse — ${event_name}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; background: #F5F1E8; padding: 48px 40px;">
        <img src="https://sanshoramen.se/logotype.png" style="height: 28px; margin-bottom: 40px;" />
        <h1 style="font-size: 28px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">Bokning bekräftad.</h1>
        <p style="font-size: 16px; color: #6B6560; margin-bottom: 40px;">Vi ses snart, ${fname}!</p>
        <div style="background: #1D1D1D; color: #F5F1E8; border-radius: 12px; padding: 32px; margin-bottom: 32px;">
          <div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #aaa; margin-bottom: 8px;">Bokningskod</div>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 0.1em;">${booking_code}</div>
        </div>
        <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
          <tr><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc; color: #6B6560;">Event</td><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc; font-weight: 500;">${event_name}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc; color: #6B6560;">Datum</td><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc;">${date}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc; color: #6B6560;">Tid</td><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc;">${time || "Se event"}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc; color: #6B6560;">Plats</td><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc;">${location}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc; color: #6B6560;">Gäster</td><td style="padding: 12px 0; border-bottom: 0.5px solid #ccc;">${guests} person${guests > 1 ? "er" : ""}</td></tr>
          <tr><td style="padding: 12px 0; color: #6B6560;">Totalt</td><td style="padding: 12px 0; font-weight: 700;">${total_price} kr</td></tr>
        </table>
        <p style="font-size: 14px; color: #6B6560; margin-top: 40px; line-height: 1.7;">Frågor? Hör av dig på <a href="mailto:contact@sanshoramen.se" style="color: #1D1D1D;">contact@sanshoramen.se</a></p>
        <p style="font-size: 12px; color: #aaa; margin-top: 24px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
  
}
