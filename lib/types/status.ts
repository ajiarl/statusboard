/**
 * StatusBoard Type Definitions
 * Sesuai spesifikasi Refined Infrastructure Dark Mode (docs/REDESIGN_BRIEF.md)
 */

export type MonitorStatus = "up" | "degraded" | "down" | "unknown" | "inactive";

export type HeartbeatStatus = "up" | "degraded" | "down" | "none";

export interface DailyHeartbeat {
  date: string; // Format: YYYY-MM-DD
  status: HeartbeatStatus;
  uptimePct: number; // Persentase uptime, contoh: 100, 99.8
  avgLatencyMs: number | null; // Rata-rata response time (ms), null jika downtime/tanpa data
  totalChecks?: number;
  failedChecks?: number;
}

export interface MonitorWithUptime {
  id: string;
  name: string;
  url?: string;
  currentStatus: string;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
}

export interface MonitorWithHeartbeat extends MonitorWithUptime {
  avgLatencyMs?: number | null;
  heartbeats?: DailyHeartbeat[];
}

export type IncidentSeverity = "minor" | "major" | "critical";

export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface IncidentUpdate {
  id?: string;
  status: string;
  message: string;
  createdAt: Date;
}

export interface IncidentWithUpdates {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  monitorName: string | null;
  updates: {
    status: string;
    message: string;
    createdAt: Date;
  }[];
}

export type OverallSystemStatus = "up" | "degraded" | "down" | "unknown";

export interface StatusPageData {
  monitors: MonitorWithHeartbeat[];
  activeIncidents: IncidentWithUpdates[];
  resolvedIncidents: IncidentWithUpdates[];
}
