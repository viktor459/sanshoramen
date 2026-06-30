import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

function isValidSession(token: string): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const ts = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(ts).digest("hex");
  if (sig !== expected) return false;
  const age = Date.now() - parseInt(ts, 10);
  return age < 8 * 60 * 60 * 1000; // 8 hours
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get("admin_session")?.value ?? "";
    if (!isValidSession(token)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
