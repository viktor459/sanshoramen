import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

function verifyTOTP(secret: string, token: string): boolean {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/, "")) {
    const val = base32Chars.indexOf(c);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  const key = Buffer.from(bytes);

  for (const drift of [-1, 0, 1]) {
    const counter = Math.floor(Date.now() / 1000 / 30) + drift;
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));
    const hmac = crypto.createHmac("sha1", key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000)
      .toString()
      .padStart(6, "0");
    if (code === token.trim()) return true;
  }
  return false;
}

function makeSessionToken(): string {
  const ts = Date.now().toString();
  const sig = crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(ts)
    .digest("hex");
  return `${ts}.${sig}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOTP_SECRET || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const { password, totp } = await req.json();

  const validPassword = password === process.env.ADMIN_PASSWORD;
  const validTOTP = verifyTOTP(process.env.ADMIN_TOTP_SECRET, totp);

  if (!validPassword || !validTOTP) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = makeSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
