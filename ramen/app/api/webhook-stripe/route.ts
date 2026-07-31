import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const m = session.metadata || {};
    const email = session.customer_email;

    // Shop order
    if (m.order_id && !m.event_id) {
      await supabase.from("shop_orders")
        .update({ status: "paid", email: email || null })
        .eq("stripe_session_id", session.id);

      if (email) {
        await resend.emails.send({
          from: "Sanshō Ramen <contact@sanshoramen.se>",
          to: email,
          subject: `Order confirmed — ${m.product_name}`,
          html: `
            <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#F5F1E8;padding:48px 40px;">
              <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;" />
              <h1 style="font-size:26px;font-weight:700;color:#1D1D1D;margin-bottom:8px;">Thanks for your order!</h1>
              <p style="font-size:15px;color:#6B6560;line-height:1.8;margin-bottom:28px;">Your payment is confirmed.</p>
              <div style="background:#1D1D1D;color:#F5F1E8;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
                <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Your order</div>
                <div style="font-size:18px;font-weight:700;">${m.product_name}</div>
                <div style="font-size:14px;color:#aaa;margin-top:4px;">${m.total_price} kr</div>
              </div>
              <p style="font-size:14px;color:#1D1D1D;line-height:1.7;">Your order will be available for pick-up at our next pop-up. Follow us on Instagram to find out when and where.</p>
              <a href="https://www.instagram.com/sanshoramen" style="display:inline-block;margin-top:16px;background:#1D1D1D;color:#F5F1E8;text-decoration:none;padding:12px 24px;border-radius:100px;font-size:13px;font-weight:500;">@sanshoramen →</a>
              <p style="font-size:12px;color:#aaa;margin-top:40px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne</p>
            </div>
          `,
        }).catch(() => {});
      }
    }

    // Event booking
    if (m.event_id) {
      await supabase.from("bookings")
        .update({ status: "confirmed" })
        .eq("stripe_setup_intent_id", session.payment_intent || session.setup_intent);
    }
  }

  return NextResponse.json({ received: true });
}
