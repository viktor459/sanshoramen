import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const NEWSLETTER = "b8414d5f-d16f-4001-bdcd-f6c66912725f";

export async function POST(req: Request) {
  const { event_id, event_name, fname, lname, email, phone, guests, vegetarian_count, note } = await req.json();

  if (!event_id || !email || !fname) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await supabase.from("waitlist").insert([{ event_id, event_name, fname, lname, email, phone, guests, vegetarian_count: vegetarian_count ?? 0, note: note ?? "" }]);

  try {
    await resend.contacts.create({ audienceId: NEWSLETTER, email, firstName: fname, lastName: lname || "", unsubscribed: false });
  } catch (_) { /* ignore */ }

  return NextResponse.json({ ok: true });
}
