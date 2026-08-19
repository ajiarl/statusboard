import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incidents, incidentUpdates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const updates = await db
    .select()
    .from(incidentUpdates)
    .where(eq(incidentUpdates.incidentId, id))
    .orderBy(desc(incidentUpdates.createdAt));

  return NextResponse.json(updates);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { status, message } = body;

  const existing = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const validStatuses = ["investigating", "identified", "monitoring", "resolved"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(incidentUpdates)
    .values({
      incidentId: id,
      status,
      message: message.trim(),
    })
    .returning();

  const incidentUpdate: Record<string, unknown> = { status };
  if (status === "resolved") {
    incidentUpdate.resolvedAt = new Date();
  }
  await db.update(incidents).set(incidentUpdate).where(eq(incidents.id, id));

  return NextResponse.json(created, { status: 201 });
}
