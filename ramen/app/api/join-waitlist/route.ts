import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const GENERAL = "a0ff9f3b-8238-4e07-b6ab-5e7dbcd6e0c1";
const LUNDS_NATION = "8b1e1750-7e45-47c6-b6be-20efb71f5235";

export async function POST(req: Request) {
  const { event_id, event_name, fname, lname, email, phone, guests, vegetarian_count, note } = await req.json();

  if (!event_id || !email || !fname) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await supabase.from("waitlist").insert([{ event_id, event_name, fname, lname, email, phone, guests, vegetarian_count: vegetarian_count ?? 0, note: note ?? "" }]);

  const audienceId = event_name?.toLowerCase().includes("lunds nation") ? LUNDS_NATION : GENERAL;
  try {
    await resend.contacts.create({ audienceId, email, firstName: fname, lastName: lname || "", unsubscribed: false });
  } catch (_) { /* ignore */ }

  return NextResponse.json({ ok: true });
}
