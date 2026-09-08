import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isPrivateUrl } from "@/lib/ssrf";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  try {
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
      if (await isPrivateUrl(body.url)) {
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
  } catch (error) {
    console.error("PATCH monitor error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
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
  } catch (error) {
    console.error("DELETE monitor error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
