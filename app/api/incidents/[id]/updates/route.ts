import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incidents, incidentUpdates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const existing = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const updates = await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, id))
      .orderBy(desc(incidentUpdates.createdAt));

    return NextResponse.json(updates);
  } catch (error) {
    console.error("GET incident updates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, message } = body;

  try {
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
  } catch (error) {
    console.error("POST incident update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
