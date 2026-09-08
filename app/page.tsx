import Link from "next/link";
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
import { StatusHeroBanner } from "@/components/StatusHeroBanner";
import { MonitorCard } from "@/components/MonitorCard";
import { Activity, ShieldAlert, CheckCircle2 } from "lucide-react";

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
    // TODO: hapus mock fallback ini setelah ganti ke akun Supabase yang benar
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const mockMonitors: MonitorWithHeartbeat[] = [
      {
        id: "mock-1",
        name: "Main Website",
        url: "https://aji.dev",
        currentStatus: "up",
        uptime24h: 100,
        uptime7d: 99.95,
        uptime30d: 99.92,
        avgLatencyMs: 52,
        heartbeats: generateMockHeartbeats("healthy"),
      },
      {
        id: "mock-2",
        name: "API Server",
        url: "https://api.aji.dev/health",
        currentStatus: "up",
        uptime24h: 99.8,
        uptime7d: 99.7,
        uptime30d: 99.5,
        avgLatencyMs: 118,
        heartbeats: generateMockHeartbeats("intermittent"),
      },
      {
        id: "mock-3",
        name: "Auth Service",
        url: "https://auth.aji.dev/health",
        currentStatus: "down",
        uptime24h: 95.2,
        uptime7d: 98.1,
        uptime30d: 99.0,
        avgLatencyMs: 420,
        heartbeats: generateMockHeartbeats("degraded_today"),
      },
    ];

    const mockActiveIncidents: IncidentWithUpdates[] = [
      {
        id: "mock-inc-1",
        title: "Auth Service elevated error rates",
        severity: "major",
        status: "investigating",
        createdAt: fiveHoursAgo,
        resolvedAt: null,
        monitorName: "Auth Service",
        updates: [
          {
            status: "investigating",
            message: "Kami sedang menginvestigasi peningkatan respon error 5xx pada Auth Service.",
            createdAt: fiveHoursAgo,
          },
        ],
      },
    ];

    const mockResolvedIncidents: IncidentWithUpdates[] = [
      {
        id: "mock-inc-2",
        title: "Scheduled database maintenance",
        severity: "minor",
        status: "resolved",
        createdAt: twoDaysAgo,
        resolvedAt: new Date(twoDaysAgo.getTime() + 45 * 60 * 1000),
        monitorName: "API Server",
        updates: [
          {
            status: "resolved",
            message: "Pemeliharaan indeks database selesai. Latensi kembali normal.",
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

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
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
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 max-w-5xl mx-auto h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-100">
                StatusBoard
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-zinc-900/60 transition-all"
            >
              Admin Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area (max-w-5xl, mx-auto, px-4) */}
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
                <div
                  key={inc.id}
                  className="bg-[#121215] border border-rose-500/30 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-base md:text-lg font-semibold text-zinc-100">
                          {inc.title}
                        </h3>
                        <span
                          className={`text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full ${
                            inc.severity === "critical"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : inc.severity === "major"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </div>
                      {inc.monitorName && (
                        <p className="text-xs text-zinc-400">
                          Layanan terkait:{" "}
                          <span className="text-zinc-200 font-medium">
                            {inc.monitorName}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="text-xs font-mono text-zinc-500">
                      Dibuka {formatDate(inc.createdAt)}
                    </div>
                  </div>

                  {inc.updates.length > 0 && (
                    <div className="border-l-2 border-zinc-800 ml-2 pl-4 space-y-3 pt-1">
                      {inc.updates.map((u, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-amber-400 ring-4 ring-[#121215]" />
                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                            <span>{formatDate(u.createdAt)}</span>
                            <span>·</span>
                            <span className="uppercase text-amber-400 font-medium">
                              {u.status}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-300 mt-1">{u.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
        <section className="flex flex-col gap-3 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Riwayat Insiden
            </h2>
            <span className="text-xs text-zinc-500">90 hari terakhir</span>
          </div>

          {resolvedIncidents.length === 0 ? (
            <div className="bg-[#121215] border border-zinc-800/70 rounded-2xl p-6 flex items-center justify-center gap-2.5 text-zinc-400 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tidak ada insiden tercatat dalam 90 hari terakhir.</span>
            </div>
          ) : (
            <div className="relative border-l-2 border-zinc-800 ml-3 pl-5 space-y-4 py-2">
              {resolvedIncidents.map((inc) => (
                <div key={inc.id} className="relative group">
                  <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#09090b]" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm md:text-base font-semibold text-zinc-200">
                        {inc.title}
                      </h4>
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Terselesaikan
                      </span>
                    </div>
                    <time className="font-mono text-xs text-zinc-500">
                      {formatDate(inc.createdAt)}
                    </time>
                    {inc.updates.length > 0 && (
                      <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                        {inc.updates[0].message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b] mt-auto">
        <div className="w-full py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <div>
            Powered by{" "}
            <span className="text-zinc-300 font-medium">StatusBoard</span> ·
            Self-hosted & Open Source
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Pemeriksaan setiap 5 menit</span>
            <span>·</span>
            <Link
              href="https://github.com/ajiarl/statusboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-4"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
