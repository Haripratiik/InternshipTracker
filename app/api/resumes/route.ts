import { NextResponse } from "next/server";
import { getResumes, createResume } from "@/lib/db";

export async function GET() {
  const resumes = await getResumes();
  return NextResponse.json(resumes.map((r) => ({
    id: r.id,
    name: r.name,
    downloadUrl: r.downloadUrl,
    uploadedAt: r.uploadedAt,
  })));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    name?: string;
    storagePath?: string;
    downloadUrl?: string;
  };

  const { name, storagePath, downloadUrl } = body;
  if (!name || !storagePath || !downloadUrl) {
    return NextResponse.json({ error: "name, storagePath, downloadUrl required" }, { status: 400 });
  }

  // Download the PDF from Firebase Storage and extract text
  let extractedText = "";
  try {
    const pdfRes = await fetch(downloadUrl);
    if (pdfRes.ok) {
      const buffer = Buffer.from(await pdfRes.arrayBuffer());
      // pdf-parse has inconsistent ESM/CJS exports; cast to callable
      type PdfParseFn = (buf: Buffer) => Promise<{ text: string }>;
      const pdfModule = await import("pdf-parse") as unknown as { default?: PdfParseFn } | PdfParseFn;
      const pdfParse: PdfParseFn = typeof pdfModule === "function" ? pdfModule : (pdfModule as { default: PdfParseFn }).default;
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text ?? "";
    }
  } catch {
    // Proceed with empty text if extraction fails
  }

  const id = await createResume({
    name,
    storagePath,
    downloadUrl,
    extractedText,
    uploadedAt: new Date(),
  });

  return NextResponse.json({ id, name, downloadUrl, uploadedAt: new Date() });
}
