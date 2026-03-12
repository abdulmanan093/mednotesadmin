import { NextRequest, NextResponse } from "next/server";
import { getFromR2 } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  try {
    const response = await getFromR2(key);

    if (!response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const bytes = await response.Body.transformToByteArray();

    return new NextResponse(bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType || "application/pdf",
        "Content-Length": String(bytes.byteLength),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 },
    );
  }
}
