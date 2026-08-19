import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incidents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const all = await db
      .select()
      .from(incidents)
      .orderBy(desc(incidents.createdAt));

    return NextResponse.json(all);
  } catch (error) {
    console.error("GET incidents error:", error);
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

  const { title, severity, monitorId } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (monitorId && !UUID_REGEX.test(monitorId)) {
    return NextResponse.json({ error: "Invalid monitor ID format" }, { status: 400 });
  }

  const validSeverities = ["minor", "major", "critical"];
  const resolvedSeverity =
    severity && validSeverities.includes(severity) ? severity : "minor";

  try {
    const [created] = await db
      .insert(incidents)
      .values({
        title: title.trim(),
        severity: resolvedSeverity,
        monitorId: monitorId || null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST incident error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
