import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "internship_tracker_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("SESSION_SECRET or NEXTAUTH_SECRET required for session cookie");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  email: string;
  uid: string;
  exp: number;
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return new SignJWT({ ...payload, exp })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = payload.email as string;
    const uid = payload.uid as string;
    const exp = Number(payload.exp);
    if (!email || !uid || !exp) return null;
    return { email, uid, exp };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: MAX_AGE,
      path: "/",
    },
  };
}

export { COOKIE_NAME };
