import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { USER_PROFILE } from "@/lib/config/profile";

const DOC = "config/userProfile";

export interface EditableProfile {
  name: string;
  school: string;
  major: string;
  gradYear: number;
  gpa: number;
  visaStatus: string;
  euCitizen: boolean;
  targetRoles: string[];
  keywords: string[];
  blacklist: string[];
}

export async function GET() {
  try {
    const db = getDb();
    const doc = await db.doc(DOC).get();
    if (doc.exists) {
      return NextResponse.json(doc.data() as EditableProfile);
    }
  } catch {
    // fall through to defaults
  }
  // Return hardcoded defaults if no overrides saved yet
  return NextResponse.json({
    name: USER_PROFILE.name,
    school: USER_PROFILE.school,
    major: USER_PROFILE.major,
    gradYear: USER_PROFILE.gradYear,
    gpa: USER_PROFILE.gpa,
    visaStatus: USER_PROFILE.visaStatus,
    euCitizen: USER_PROFILE.euCitizen,
    targetRoles: [...USER_PROFILE.targetRoles],
    keywords: [...USER_PROFILE.keywords],
    blacklist: [...USER_PROFILE.blacklist],
  } satisfies EditableProfile);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as EditableProfile | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const db = getDb();
  await db.doc(DOC).set(body);
  return NextResponse.json({ success: true });
}
