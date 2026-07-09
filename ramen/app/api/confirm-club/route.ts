import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.status !== "complete") return NextResponse.json({ error: "Not complete" }, { status: 400 });

  const { email, fname } = session.metadata!;

  const { data: member } = await supabase
    .from("club_members")
    .upsert([{ email, fname }], { onConflict: "email" })
    .select("unsubscribe_token")
    .single();

  const unsubscribeToken = member?.unsubscribe_token ?? null;

  try {
    await resend.emails.send({
      from: "Sanshō Ramen <contact@sanshoramen.se>",
      to: email,
      subject: "Välkommen till Sanshō Ramen Club ★",
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#1D1D1D;padding:48px 40px;">
          <img src="https://sanshoramen.se/logotype.png" style="height:26px;margin-bottom:40px;filter:invert(1);" />
          <div style="display:inline-block;background:#C0392B;color:#fff;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;padding:6px 14px;border-radius:99px;margin-bottom:28px;">★ Sanshō Ramen Club</div>
          <h1 style="font-size:28px;font-weight:700;color:#F5F1E8;margin-bottom:12px;line-height:1.2;">Välkommen till the inner circle${fname ? `, ${fname}` : ""}.</h1>
          <p style="font-size:15px;color:#999;line-height:1.8;margin-bottom:32px;">Du är nu med i Sanshō Ramen Club och får tidig tillgång till alla pop-ups — 48 timmar innan de annonseras publikt.</p>
          <div style="border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:32px;">
            <p style="font-size:13px;color:#C0392B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px;">Dina fördelar</p>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;align-items:flex-start;gap:12px;"><span style="color:#C0392B;font-size:16px;">★</span><span style="font-size:14px;color:#ccc;line-height:1.5;">Early access till alla pop-up-bokningar, 48h innan publikt</span></div>
              <div style="display:flex;align-items:flex-start;gap:12px;"><span style="color:#C0392B;font-size:16px;">★</span><span style="font-size:14px;color:#ccc;line-height:1.5;">Inbjudningar till privata, club-only-event</span></div>
              <div style="display:flex;align-items:flex-start;gap:12px;"><span style="color:#C0392B;font-size:16px;">★</span><span style="font-size:14px;color:#ccc;line-height:1.5;">Behind-the-scenes från köket</span></div>
            </div>
          </div>
          <a href="https://sanshoramen.se/pop-ups" style="display:inline-block;padding:14px 28px;background:#C0392B;color:#fff;text-decoration:none;border-radius:100px;font-size:14px;font-weight:500;">Se kommande events →</a>
          <p style="font-size:12px;color:#555;margin-top:40px;">© ${new Date().getFullYear()} Sanshō Ramen · Skåne${unsubscribeToken ? ` · <a href="${process.env.NEXT_PUBLIC_URL}/api/unsubscribe?token=${unsubscribeToken}&list=club" style="color:#555;">Unsubscribe</a>` : ""}</p>
        </div>
      `,
    });
  } catch (_) { /* ignore */ }

  return NextResponse.json({ ok: true, fname });
}
