import { db } from "@/lib/db";
import { monitors, incidents, incidentUpdates } from "@/lib/db/schema";
import { eq, desc, isNull, isNotNull } from "drizzle-orm";
import { calculateUptime, calculateDailyHeartbeats } from "@/lib/uptime";
import type {
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
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface StatusDataResult {
  monitors: MonitorWithHeartbeat[];
  activeIncidents: IncidentWithUpdates[];
  resolvedIncidents: IncidentWithUpdates[];
  isDbOffline: boolean;
}

async function getStatusData(): Promise<StatusDataResult> {
  try {
    const activeMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.isActive, true));

    const monitorsWithUptime: MonitorWithHeartbeat[] = await Promise.all(
      activeMonitors.map(async (m) => {
        const { heartbeats, avgLatencyMs } = await calculateDailyHeartbeats(m.id, 90);
        return {
          id: m.id,
          name: m.name,
          url: m.url ?? undefined,
          currentStatus: m.currentStatus,
          uptime24h: await calculateUptime(m.id, 24),
          uptime7d: await calculateUptime(m.id, 168),
          uptime30d: await calculateUptime(m.id, 720),
          avgLatencyMs,
          heartbeats,
        };
      })
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
      isDbOffline: false,
    };
  } catch {
    // Database offline/unreachable: tampilkan daftar 4 service riil portofolio secara transparan
    const initialRealMonitors: MonitorWithHeartbeat[] = [
      {
        id: "real-1",
        name: "Portfolio Utama",
        url: "https://ajiarlando.my.id",
        currentStatus: "unknown",
        uptime24h: 0,
        uptime7d: 0,
        uptime30d: 0,
        avgLatencyMs: null,
        heartbeats: [],
      },
      {
        id: "real-2",
        name: "Snip URL Shortener",
        url: "https://snipid.my.id",
        currentStatus: "unknown",
        uptime24h: 0,
        uptime7d: 0,
        uptime30d: 0,
        avgLatencyMs: null,
        heartbeats: [],
      },
      {
        id: "real-3",
        name: "JIERjoki Service",
        url: "https://web-joki-tugas.vercel.app",
        currentStatus: "unknown",
        uptime24h: 0,
        uptime7d: 0,
        uptime30d: 0,
        avgLatencyMs: null,
        heartbeats: [],
      },
      {
        id: "real-4",
        name: "KosPedia Palembang",
        url: "https://kospedia-palembang.vercel.app",
        currentStatus: "unknown",
        uptime24h: 0,
        uptime7d: 0,
        uptime30d: 0,
        avgLatencyMs: null,
        heartbeats: [],
      },
    ];

    return {
      monitors: initialRealMonitors,
      activeIncidents: [],
      resolvedIncidents: [],
      isDbOffline: true,
    };
  }
}

function getOverallStatus(
  monitorsList: MonitorWithHeartbeat[],
  isDbOffline: boolean
): OverallSystemStatus {
  if (isDbOffline) return "degraded";
  if (monitorsList.length === 0) return "unknown";
  const hasDown = monitorsList.some((m) => m.currentStatus === "down");
  if (hasDown) return "down";
  const allUp = monitorsList.every((m) => m.currentStatus === "up");
  if (allUp) return "up";
  return "degraded";
}

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const { monitors: monitorsList, activeIncidents, resolvedIncidents, isDbOffline } =
    await getStatusData();

  const overall = getOverallStatus(monitorsList, isDbOffline);
  const downMonitors = monitorsList.filter((m) => m.currentStatus === "down");
  const degradedMonitors = monitorsList.filter((m) => m.currentStatus === "degraded");
  const downServiceName = downMonitors.length > 0 ? downMonitors[0].name : null;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 1. Global Navigation Header */}
      <StatusHeader updatedAtText={isDbOffline ? "Telemetri Offline" : "Live"} />

      {/* 2. Main Content Area */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10 flex flex-col gap-8">
        {/* Transparent Offline Notice if DB is disconnected */}
        {isDbOffline && (
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-amber-200 text-sm">
                Database Telemetri Sedang Tidak Terhubung
              </span>
              <p className="text-amber-300/80 leading-relaxed">
                Koneksi ke Supabase sedang terputus (project mungkin sedang di-pause). Daftar di bawah menampilkan 4 layanan rill portofolio Aji Arlando, namun riwayat uptime 90 hari membutuhkan koneksi database aktif.
              </p>
            </div>
          </div>
        )}

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
