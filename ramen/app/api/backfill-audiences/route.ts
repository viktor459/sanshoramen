import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const NEWSLETTER = "b8414d5f-d16f-4001-bdcd-f6c66912725f";

async function addContact(email: string, firstName: string, lastName: string) {
  const { data, error } = await resend.contacts.create({ audienceId: NEWSLETTER, email, firstName, lastName, unsubscribed: false });
  return { data, error: error ? JSON.stringify(error) : null };
}

export async function GET() {
  const contacts = new Map<string, { firstName: string; lastName: string; source: string }>();
  const add = (email: string | null | undefined, firstName: string, lastName: string, source: string) => {
    const e = email?.trim().toLowerCase();
    if (!e || !e.includes("@")) return;
    const existing = contacts.get(e);
    if (!existing || (!existing.firstName && firstName)) contacts.set(e, { firstName, lastName, source });
  };

  const [{ data: subscribers }, { data: bookings }, { data: waitlist }, { data: luma }, { data: club }, { data: stallet }] = await Promise.all([
    supabase.from("subscribers").select("email"),
    supabase.from("bookings").select("fname, lname, email").neq("status", "pending"),
    supabase.from("waitlist").select("fname, lname, email"),
    supabase.from("luma_members").select("email, name").eq("excluded", false),
    supabase.from("club_members").select("email, fname, lname"),
    supabase.from("stallet_preferences").select("email, name"),
  ]);

  for (const b of bookings || []) add(b.email, b.fname || "", b.lname || "", "booking");
  for (const w of waitlist || []) add(w.email, w.fname || "", w.lname || "", "waitlist");
  for (const l of luma || []) {
    const [firstName, ...rest] = (l.name || "").split(" ");
    add(l.email, firstName || "", rest.join(" "), "luma");
  }
  for (const c of club || []) add(c.email, c.fname || "", c.lname || "", "club");
  for (const s of stallet || []) {
    const [firstName, ...rest] = (s.name || "").split(" ");
    add(s.email, firstName || "", rest.join(" "), "stallet");
  }
  for (const s of subscribers || []) add(s.email, "", "", "subscriber");

  const results: object[] = [];
  for (const [email, c] of contacts) {
    const r = await addContact(email, c.firstName, c.lastName);
    results.push({ source: c.source, email, ...r });
  }

  const errors = results.filter((r: any) => r.error);
  return NextResponse.json({ total: results.length, errors: errors.length, details: results });
}
