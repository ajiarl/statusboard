import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitors } from "@/lib/db/schema";
import { isPrivateUrl } from "@/lib/ssrf";

export async function GET() {
  const allMonitors = await db.select().from(monitors);
  return NextResponse.json(allMonitors);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, url, method, expectedStatus } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (isPrivateUrl(url)) {
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
}
