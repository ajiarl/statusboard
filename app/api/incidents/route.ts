import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incidents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select()
    .from(incidents)
    .orderBy(desc(incidents.createdAt));

  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, severity, monitorId } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const validSeverities = ["minor", "major", "critical"];
  const resolvedSeverity =
    severity && validSeverities.includes(severity) ? severity : "minor";

  const [created] = await db
    .insert(incidents)
    .values({
      title: title.trim(),
      severity: resolvedSeverity,
      monitorId: monitorId || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
