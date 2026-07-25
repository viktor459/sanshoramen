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
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Ej betald" }, { status: 400 });
  }

  const m = session.metadata!;
  const email = session.customer_email || m.email;

  await supabase.from("shop_orders")
    .update({ status: "paid", email })
    .eq("stripe_session_id", session_id);

  if (email) {
    try {
      await resend.emails.send({
        from: "Sanshō Ramen <contact@sanshoramen.se>",
        to: email,
        subject: `Order confirmed — ${m.product_name}`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
            <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
            <h1 style="font-size:26px;font-weight:700;color:#1D1D1D;margin-bottom:8px;line-height:1.2;">Thanks for your order!</h1>
            <p style="font-size:15px;color:#6B6560;line-height:1.8;margin-bottom:28px;">
              We've received your order and your payment is confirmed.
            </p>
            <div style="background:#1D1D1D;color:#F5F1E8;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
              <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Your order</div>
              <div style="font-size:18px;font-weight:700;">${m.product_name}</div>
              <div style="font-size:14px;color:#aaa;margin-top:4px;">${m.total_price} kr</div>
            </div>
            <div style="background:#fff;border:1.5px solid #E8E3D8;border-radius:12px;padding:24px 28px;margin-bottom:32px;">
              <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:12px;">Pick-up</div>
              <p style="font-size:14px;color:#1D1D1D;line-height:1.7;margin:0;">
                Your order will be available for pick-up at our <strong>next pop-up</strong>.
                Follow us on Instagram to find out when and where the next one is happening.
              </p>
              <a href="https://www.instagram.com/sanshoramen" style="display:inline-block;margin-top:16px;background:#1D1D1D;color:#F5F1E8;text-decoration:none;padding:12px 24px;border-radius:100px;font-size:13px;font-weight:500;">
                @sanshoramen on Instagram →
              </a>
            </div>
            <p style="font-size:12px;color:#aaa;margin-top:32px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
          </div>
        `,
      });
    } catch (_) { /* ignore */ }
  }

  return NextResponse.json({ ok: true, product_name: m.product_name, total_price: m.total_price });
}
