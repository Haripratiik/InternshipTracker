import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/ai/cover-letter";

export async function POST(request: Request) {
  const body = await request.json();
  const { title, company, description } = body as {
    title: string;
    company: string;
    description?: string;
  };
  if (!title || !company) {
    return NextResponse.json(
      { error: "title and company required" },
      { status: 400 }
    );
  }
  try {
    const content = await generateCoverLetter(
      title,
      company,
      description ?? ""
    );
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
