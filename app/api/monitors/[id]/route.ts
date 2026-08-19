import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isPrivateUrl } from "@/lib/ssrf";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  const existing = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = body.name.trim();
  }

  if (body.url !== undefined) {
    if (typeof body.url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    if (isPrivateUrl(body.url)) {
      return NextResponse.json(
        { error: "Private/internal URLs are not allowed" },
        { status: 400 }
      );
    }
    updates.url = body.url;
  }

  if (body.method !== undefined) {
    const validMethods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
    if (!validMethods.includes(body.method)) {
      return NextResponse.json({ error: "Invalid HTTP method" }, { status: 400 });
    }
    updates.method = body.method;
  }

  if (body.expectedStatus !== undefined) {
    if (
      typeof body.expectedStatus !== "number" ||
      body.expectedStatus < 100 ||
      body.expectedStatus >= 600
    ) {
      return NextResponse.json({ error: "Invalid expected status" }, { status: 400 });
    }
    updates.expectedStatus = body.expectedStatus;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });
    }
    updates.isActive = body.isActive;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(monitors)
    .set(updates)
    .where(eq(monitors.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const existing = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  await db.delete(monitors).where(eq(monitors.id, id));

  return NextResponse.json({ success: true });
}
