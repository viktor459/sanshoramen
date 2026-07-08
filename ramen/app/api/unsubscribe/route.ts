import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const list = searchParams.get("list") || "subscribers"; // "subscribers" or "club"

  if (!token) {
    return new Response("<p>Invalid link.</p>", { headers: { "Content-Type": "text/html" } });
  }

  const table = list === "club" ? "club_members" : "subscribers";
  const { error } = await supabase.from(table).update({ active: false }).eq("unsubscribe_token", token);

  if (error) {
    return new Response(`<html><body style="font-family:sans-serif;padding:60px;text-align:center"><h2>Something went wrong.</h2><p>Please contact us at <a href="mailto:contact@sanshoramen.se">contact@sanshoramen.se</a>.</p></body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  return new Response(`<html><body style="font-family:'Helvetica Neue',sans-serif;background:#F5F1E8;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0"><div style="text-align:center;padding:60px 24px"><img src="https://sanshoramen.se/logotype.png" style="height:24px;margin-bottom:40px"><h1 style="font-size:24px;font-weight:700;margin-bottom:12px">You've been unsubscribed.</h1><p style="color:#6B6560;font-size:15px">You won't receive any more emails from us.</p><p style="color:#6B6560;font-size:13px;margin-top:24px">Changed your mind? <a href="mailto:contact@sanshoramen.se" style="color:#1D1D1D">contact@sanshoramen.se</a></p></div></body></html>`, { headers: { "Content-Type": "text/html" } });
}
