import { NextRequest, NextResponse } from "next/server";

async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/g, "")) {
    const val = base32Chars.indexOf(c);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }

  const key = await crypto.subtle.importKey(
    "raw", bytes,
    { name: "HMAC", hash: "SHA-1" },
    false, ["sign"]
  );

  for (const drift of [-1, 0, 1]) {
    const counter = Math.floor(Date.now() / 1000 / 30) + drift;
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setUint32(4, counter, false);
    const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]
    ) % 1_000_000;
    if (code.toString().padStart(6, "0") === token.trim()) return true;
  }
  return false;
}

async function makeSessionToken(): Promise<string> {
  const ts = Date.now().toString();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(process.env.ADMIN_SESSION_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(ts));
  const sig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${ts}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOTP_SECRET || !process.env.ADMIN_SESSION_SECRET) {
      console.error("admin-login: missing env vars");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const { password, totp } = await req.json();

    const validPassword = password === process.env.ADMIN_PASSWORD;
    const validTOTP = await verifyTOTP(process.env.ADMIN_TOTP_SECRET, totp);

    if (!validPassword || !validTOTP) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await makeSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e) {
    console.error("admin-login crash:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
