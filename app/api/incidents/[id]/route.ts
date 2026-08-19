import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incidents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  const existing = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    updates.title = body.title.trim();
  }

  if (body.severity !== undefined) {
    const validSeverities = ["minor", "major", "critical"];
    if (!validSeverities.includes(body.severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }
    updates.severity = body.severity;
  }

  if (body.status !== undefined) {
    const validStatuses = ["investigating", "identified", "monitoring", "resolved"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
    if (body.status === "resolved") {
      updates.resolvedAt = new Date();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(incidents)
    .set(updates)
    .where(eq(incidents.id, id))
    .returning();

  return NextResponse.json(updated);
}
