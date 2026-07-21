import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const GENERAL = "a0ff9f3b-8238-4e07-b6ab-5e7dbcd6e0c1";
const LUNDS_NATION = "8b1e1750-7e45-47c6-b6be-20efb71f5235";

export async function GET() {
  let added = 0;
  const errors: string[] = [];

  // Backfill subscribers (bookers who gave newsletter consent)
  // Join with bookings to get name and event
  const { data: bookings } = await supabase
    .from("bookings")
    .select("fname, lname, email, event_name");

  // Use subscribers table as source of truth for consent
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email");

  const consentEmails = new Set((subscribers || []).map((s: { email: string }) => s.email));

  for (const b of bookings || []) {
    if (!consentEmails.has(b.email)) continue;
    const audienceId = b.event_name?.toLowerCase().includes("lunds nation") ? LUNDS_NATION : GENERAL;
    try {
      await resend.contacts.create({
        audienceId,
        email: b.email,
        firstName: b.fname || "",
        lastName: b.lname || "",
        unsubscribed: false,
      });
      added++;
    } catch (e: unknown) {
      errors.push(`booking ${b.email}: ${e}`);
    }
  }

  // Backfill waitlist — all entries go to relevant audience
  const { data: waitlist } = await supabase
    .from("waitlist")
    .select("fname, lname, email, event_name");

  for (const w of waitlist || []) {
    const audienceId = w.event_name?.toLowerCase().includes("lunds nation") ? LUNDS_NATION : GENERAL;
    try {
      await resend.contacts.create({
        audienceId,
        email: w.email,
        firstName: w.fname || "",
        lastName: w.lname || "",
        unsubscribed: false,
      });
      added++;
    } catch (e: unknown) {
      errors.push(`waitlist ${w.email}: ${e}`);
    }
  }

  return NextResponse.json({ added, errors });
}
