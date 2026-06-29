import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Ogiltig e-post" }, { status: 400 });
  }

  const { error } = await supabase.from("subscribers").insert([{ email }]);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Du är redan anmäld!" }, { status: 400 });
    }
    return NextResponse.json({ error: "Något gick fel" }, { status: 500 });
  }

  await resend.emails.send({
    from: "Sanshō Ramen <hej@sanshoramen.se>",
    to: email,
    subject: "Välkommen till Sanshō Ramen",
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; background: #F5F1E8; padding: 48px 40px;">
        <img src="https://sanshoramen.se/logotype.png" style="height: 28px; margin-bottom: 40px;" />
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 12px;">Du är inne!</h1>
        <p style="font-size: 15px; color: #6B6560; line-height: 1.7;">Du får nu först veta när vi släpper nya pop-ups. Vi ses snart. 🍜</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
