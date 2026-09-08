import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitors } from "@/lib/db/schema";
import { isPrivateUrl } from "@/lib/ssrf";

export async function GET() {
  try {
    const allMonitors = await db.select().from(monitors);
    return NextResponse.json(allMonitors);
  } catch (error) {
    console.error("GET monitors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, url, method, expectedStatus } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (await isPrivateUrl(url)) {
    return NextResponse.json(
      { error: "Private/internal URLs are not allowed" },
      { status: 400 }
    );
  }

  const validMethods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
  const resolvedMethod = method && validMethods.includes(method) ? method : "GET";
  const resolvedExpectedStatus =
    typeof expectedStatus === "number" && expectedStatus >= 100 && expectedStatus < 600
      ? expectedStatus
      : 200;

  try {
    const [created] = await db
      .insert(monitors)
      .values({
        name: name.trim(),
        url,
        method: resolvedMethod,
        expectedStatus: resolvedExpectedStatus,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST monitor database error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
