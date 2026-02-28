import { NextResponse } from "next/server";
import { getSessionCookieOptions, COOKIE_NAME } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  const { options } = getSessionCookieOptions();
  res.cookies.set(COOKIE_NAME, "", { ...options, maxAge: 0 });
  return res;
}
