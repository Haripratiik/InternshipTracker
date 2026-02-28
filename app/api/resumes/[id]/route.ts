import { NextResponse } from "next/server";
import { getResumeById, deleteResume } from "@/lib/db";
import { getStorage } from "firebase-admin/storage";
import { getDb } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resume = await getResumeById(id);
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  // Delete from Firebase Storage
  try {
    getDb(); // ensures firebase admin is initialized
    const bucket = getStorage().bucket();
    await bucket.file(resume.storagePath).delete();
  } catch {
    // Continue even if storage deletion fails
  }

  await deleteResume(id);
  return NextResponse.json({ success: true });
}
