import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const GENERAL = "a0ff9f3b-8238-4e07-b6ab-5e7dbcd6e0c1";
const LUNDS_NATION = "8b1e1750-7e45-47c6-b6be-20efb71f5235";

async function addContact(audienceId: string, email: string, firstName: string, lastName: string) {
  const { data, error } = await resend.contacts.create({ audienceId, email, firstName, lastName, unsubscribed: false });
  return { data, error: error ? String(error) : null };
}

export async function GET() {
  const results: object[] = [];

  // Subscribers (bookers with newsletter consent) — join with bookings for name
  const { data: subscribers } = await supabase.from("subscribers").select("email");
  const { data: bookings } = await supabase.from("bookings").select("fname, lname, email, event_name");

  const bookingMap = new Map<string, { fname: string; lname: string; event_name: string }>();
  for (const b of bookings || []) bookingMap.set(b.email, b);

  for (const s of subscribers || []) {
    const b = bookingMap.get(s.email);
    const audienceId = b?.event_name?.toLowerCase().includes("lunds nation") ? LUNDS_NATION : GENERAL;
    const r = await addContact(audienceId, s.email, b?.fname || "", b?.lname || "");
    results.push({ source: "subscriber", email: s.email, audienceId, ...r });
  }

  // Waitlist
  const { data: waitlist } = await supabase.from("waitlist").select("fname, lname, email, event_name");
  for (const w of waitlist || []) {
    const audienceId = w.event_name?.toLowerCase().includes("lunds nation") ? LUNDS_NATION : GENERAL;
    const r = await addContact(audienceId, w.email, w.fname || "", w.lname || "");
    results.push({ source: "waitlist", email: w.email, audienceId, ...r });
  }

  const errors = results.filter((r: any) => r.error);
  return NextResponse.json({ total: results.length, errors: errors.length, details: results });
}
