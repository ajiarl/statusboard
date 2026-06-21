import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const monitors = pgTable("monitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").notNull().default("GET"),
  expectedStatus: integer("expected_status").notNull().default(200),
  isActive: boolean("is_active").notNull().default(true),
  currentStatus: text("current_status").notNull().default("unknown"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const checks = pgTable("checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  statusCode: integer("status_code"),
  responseTimeMs: integer("response_time_ms"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id").references(() => monitors.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  severity: text("severity").notNull().default("minor"),
  status: text("status").notNull().default("investigating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const incidentUpdates = pgTable("incident_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: uuid("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
