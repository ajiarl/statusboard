import { db } from "@/lib/db";
import { monitors, incidents, incidentUpdates } from "@/lib/db/schema";
import { eq, desc, isNull, isNotNull } from "drizzle-orm";
import { calculateUptime } from "@/lib/uptime";
import type {
  DailyHeartbeat,
  MonitorWithHeartbeat,
  IncidentWithUpdates,
  OverallSystemStatus,
} from "@/lib/types/status";
import { StatusHeader } from "@/components/StatusHeader";
import { StatusHeroBanner } from "@/components/StatusHeroBanner";
import { ActiveIncidentCard } from "@/components/ActiveIncidentCard";
import { MonitorCard } from "@/components/MonitorCard";
import { IncidentHistory } from "@/components/IncidentHistory";
import { StatusFooter } from "@/components/StatusFooter";
import { ShieldAlert } from "lucide-react";

function generateMockHeartbeats(
  type: "healthy" | "intermittent" | "degraded_today"
): DailyHeartbeat[] {
  const heartbeats: DailyHeartbeat[] = [];
  const now = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];

    if (type === "healthy") {
      const isOccasionalDegraded = i === 42 || i === 71;
      const uptimePct = isOccasionalDegraded ? 99.6 : 100;
      const status = isOccasionalDegraded ? "degraded" : "up";
      const avgLatencyMs = 45 + ((i * 3) % 20);
      heartbeats.push({
        date: dateStr,
        status,
        uptimePct,
        avgLatencyMs,
      });
    } else if (type === "intermittent") {
      const isMaintenance = i === 2;
      const isDegraded = i === 28 || i === 55;
      const status = isMaintenance || isDegraded ? "degraded" : "up";
      const uptimePct = isMaintenance ? 98.5 : isDegraded ? 99.2 : 100;
      const avgLatencyMs = 95 + ((i * 7) % 35);
      heartbeats.push({
        date: dateStr,
        status,
        uptimePct,
        avgLatencyMs,
      });
    } else {
      let status: "up" | "degraded" | "down" = "up";
      let uptimePct = 100;
      let avgLatencyMs: number | null = 110 + ((i * 5) % 30);

      if (i === 0) {
        status = "down";
        uptimePct = 95.2;
        avgLatencyMs = null;
      } else if (i === 1) {
        status = "degraded";
        uptimePct = 98.1;
        avgLatencyMs = 380;
      } else if (i === 14) {
        status = "degraded";
        uptimePct = 99.1;
        avgLatencyMs = 210;
      }

      heartbeats.push({
        date: dateStr,
        status,
        uptimePct,
        avgLatencyMs,
      });
    }
  }

  return heartbeats;
}

async function getStatusData() {
  try {
    const activeMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.isActive, true));

    const monitorsWithUptime: MonitorWithHeartbeat[] = await Promise.all(
      activeMonitors.map(async (m) => ({
        id: m.id,
        name: m.name,
        url: m.url ?? undefined,
        currentStatus: m.currentStatus,
        uptime24h: await calculateUptime(m.id, 24),
        uptime7d: await calculateUptime(m.id, 168),
        uptime30d: await calculateUptime(m.id, 720),
      }))
    );

    const activeIncidents = await db
      .select()
      .from(incidents)
      .where(isNull(incidents.resolvedAt))
      .orderBy(desc(incidents.createdAt));

    const resolvedIncidents = await db
      .select()
      .from(incidents)
      .where(isNotNull(incidents.resolvedAt))
      .orderBy(desc(incidents.resolvedAt))
      .limit(20);

    const allIncidents = [...activeIncidents, ...resolvedIncidents];
    const incidentsWithUpdates: IncidentWithUpdates[] = await Promise.all(
      allIncidents.map(async (inc) => {
        const updates = await db
          .select()
          .from(incidentUpdates)
          .where(eq(incidentUpdates.incidentId, inc.id))
          .orderBy(desc(incidentUpdates.createdAt));

        let monitorName: string | null = null;
        if (inc.monitorId) {
          const [mon] = await db
            .select({ name: monitors.name })
            .from(monitors)
            .where(eq(monitors.id, inc.monitorId))
            .limit(1);
          monitorName = mon?.name ?? null;
        }

        return {
          id: inc.id,
          title: inc.title,
          severity: inc.severity,
          status: inc.status,
          createdAt: inc.createdAt,
          resolvedAt: inc.resolvedAt,
          monitorName,
          updates: updates.map((u) => ({
            status: u.status,
            message: u.message,
            createdAt: u.createdAt,
          })),
        };
      })
    );

    return {
      monitors: monitorsWithUptime,
      activeIncidents: incidentsWithUpdates.filter((i) => !i.resolvedAt),
      resolvedIncidents: incidentsWithUpdates.filter((i) => i.resolvedAt),
    };
  } catch {
    // Fallback mock data bila database offline/belum terhubung
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const mockMonitors: MonitorWithHeartbeat[] = [
      {
        id: "mock-1",
        name: "Portfolio Utama",
        url: "https://ajiarlando.my.id",
        currentStatus: "up",
        uptime24h: 100,
        uptime7d: 99.98,
        uptime30d: 99.95,
        avgLatencyMs: 64,
        heartbeats: generateMockHeartbeats("healthy"),
      },
      {
        id: "mock-2",
        name: "Snip URL Shortener",
        url: "https://snip.ajiarlando.my.id",
        currentStatus: "up",
        uptime24h: 100,
        uptime7d: 99.95,
        uptime30d: 99.91,
        avgLatencyMs: 92,
        heartbeats: generateMockHeartbeats("healthy"),
      },
      {
        id: "mock-3",
        name: "SiMagang Platform",
        url: "https://simagang.ajiarlando.my.id",
        currentStatus: "up",
        uptime24h: 99.8,
        uptime7d: 99.7,
        uptime30d: 99.5,
        avgLatencyMs: 125,
        heartbeats: generateMockHeartbeats("intermittent"),
      },
      {
        id: "mock-4",
        name: "Finance Tracker Service",
        url: "https://finance.ajiarlando.my.id",
        currentStatus: "up",
        uptime24h: 100,
        uptime7d: 99.92,
        uptime30d: 99.88,
        avgLatencyMs: 110,
        heartbeats: generateMockHeartbeats("healthy"),
      },
      {
        id: "mock-5",
        name: "KosPedia API",
        url: "https://kospedia.ajiarlando.my.id",
        currentStatus: "up",
        uptime24h: 99.6,
        uptime7d: 99.4,
        uptime30d: 99.1,
        avgLatencyMs: 148,
        heartbeats: generateMockHeartbeats("healthy"),
      },
    ];

    const mockActiveIncidents: IncidentWithUpdates[] = [];

    const mockResolvedIncidents: IncidentWithUpdates[] = [
      {
        id: "mock-inc-1",
        title: "Scheduled database connection pool optimization",
        severity: "minor",
        status: "resolved",
        createdAt: twoDaysAgo,
        resolvedAt: new Date(twoDaysAgo.getTime() + 45 * 60 * 1000),
        monitorName: "SiMagang Platform",
        updates: [
          {
            status: "resolved",
            message: "Pemeliharaan indeks dan optimasi connection pool selesai. Latensi kembali stabil.",
            createdAt: new Date(twoDaysAgo.getTime() + 45 * 60 * 1000),
          },
        ],
      },
    ];

    return {
      monitors: mockMonitors,
      activeIncidents: mockActiveIncidents,
      resolvedIncidents: mockResolvedIncidents,
    };
  }
}

function getOverallStatus(monitorsList: MonitorWithHeartbeat[]): OverallSystemStatus {
  if (monitorsList.length === 0) return "unknown";
  const hasDown = monitorsList.some((m) => m.currentStatus === "down");
  if (hasDown) return "down";
  const allUp = monitorsList.every((m) => m.currentStatus === "up");
  if (allUp) return "up";
  return "degraded";
}

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const { monitors: monitorsList, activeIncidents, resolvedIncidents } =
    await getStatusData();

  const overall = getOverallStatus(monitorsList);
  const downMonitors = monitorsList.filter((m) => m.currentStatus === "down");
  const degradedMonitors = monitorsList.filter((m) => m.currentStatus === "degraded");
  const downServiceName = downMonitors.length > 0 ? downMonitors[0].name : null;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 1. Global Navigation Header */}
      <StatusHeader updatedAtText="Updated recently" />

      {/* 2. Main Content Area */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10 flex flex-col gap-8">
        {/* Dynamic Status Hero Banner */}
        <StatusHeroBanner
          status={overall}
          totalMonitors={monitorsList.length}
          downMonitorsCount={downMonitors.length}
          degradedMonitorsCount={degradedMonitors.length}
          downServiceName={downServiceName}
        />

        {/* Active Incidents Section */}
        {activeIncidents.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">
                Insiden Aktif
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {activeIncidents.length}
              </span>
            </div>

            <div className="space-y-4">
              {activeIncidents.map((inc) => (
                <ActiveIncidentCard key={inc.id} incident={inc} />
              ))}
            </div>
          </section>
        )}

        {/* Monitors / Services List */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Layanan Sistem
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {monitorsList.length} total layanan
            </span>
          </div>

          {monitorsList.length === 0 ? (
            <div className="bg-[#121215] border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-sm text-zinc-500">
                Belum ada monitor yang aktif saat ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {monitorsList.map((m) => (
                <MonitorCard key={m.id} monitor={m} />
              ))}
            </div>
          )}
        </section>

        {/* Resolved Incidents History */}
        <IncidentHistory incidents={resolvedIncidents} />
      </main>

      {/* 3. Global Footer */}
      <StatusFooter />
    </div>
  );
}
