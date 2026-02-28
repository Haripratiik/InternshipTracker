import * as admin from "firebase-admin";
import { getApps, initializeApp, getApp } from "firebase-admin/app";

function getFirebaseApp(): ReturnType<typeof getApp> {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase server config (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
    }
    initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return getApp();
}

export function getFirebaseAuth(): admin.auth.Auth {
  getFirebaseApp();
  return admin.auth();
}

const allowedEmailsRaw = process.env.ALLOWED_EMAIL ?? "";
const allowedEmails = allowedEmailsRaw
  ? allowedEmailsRaw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  : null;

export function isEmailAllowed(email: string): boolean {
  if (!allowedEmails || allowedEmails.length === 0) return true;
  return allowedEmails.includes(email.toLowerCase());
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email: string | null } | null> {
  try {
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const email = (decoded.email ?? null) as string | null;
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}
