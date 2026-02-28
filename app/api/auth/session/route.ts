import { NextResponse } from "next/server";
import { verifySessionToken, createSessionToken, getSessionCookieOptions, COOKIE_NAME } from "@/lib/session";
import { verifyFirebaseIdToken, isEmailAllowed } from "@/lib/auth-server";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie");
  const match = cookie?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = match?.[1];

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: { email: session.email } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const idToken = typeof body.idToken === "string" ? body.idToken : body.token;

  if (!idToken) {
    return NextResponse.json({ error: "idToken required" }, { status: 400 });
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!isEmailAllowed(decoded.email ?? "")) {
    return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
  }

  const token = await createSessionToken({
    email: decoded.email ?? "",
    uid: decoded.uid,
  });
  const { options } = getSessionCookieOptions();

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, options);
  return res;
}
