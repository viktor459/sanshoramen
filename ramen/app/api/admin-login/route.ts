import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, totp } = body;

    const envPassword = process.env.ADMIN_PASSWORD ?? "NOT_SET";
    const envTotp = process.env.ADMIN_TOTP_SECRET ?? "NOT_SET";
    const envSession = process.env.ADMIN_SESSION_SECRET ?? "NOT_SET";

    console.log("ENV CHECK:", {
      hasPassword: envPassword !== "NOT_SET",
      hasTotp: envTotp !== "NOT_SET",
      hasSession: envSession !== "NOT_SET",
    });

    if (envPassword === "NOT_SET" || envTotp === "NOT_SET" || envSession === "NOT_SET") {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    const validPassword = password === envPassword;
    console.log("Password valid:", validPassword);

    // Simple TOTP test — just check env connection first
    return NextResponse.json({
      validPassword,
      totpReceived: totp,
      debug: true,
    }, { status: 200 });

  } catch (e: unknown) {
    console.error("CRASH:", String(e));
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
