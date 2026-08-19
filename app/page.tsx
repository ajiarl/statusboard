import { db } from "@/lib/db";
import { monitors, incidents, incidentUpdates } from "@/lib/db/schema";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { calculateUptime } from "@/lib/uptime";

interface MonitorWithUptime {
  id: string;
  name: string;
  currentStatus: string;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
}

interface IncidentWithUpdates {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  monitorName: string | null;
  updates: { status: string; message: string; createdAt: Date }[];
}

async function getStatusData() {
  try {
    const activeMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.isActive, true));

    const monitorsWithUptime: MonitorWithUptime[] = await Promise.all(
      activeMonitors.map(async (m) => ({
        id: m.id,
        name: m.name,
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

    const mockMonitors: MonitorWithUptime[] = [
      { id: "mock-1", name: "Main Website", currentStatus: "up", uptime24h: 100, uptime7d: 99.95, uptime30d: 99.92 },
      { id: "mock-2", name: "API Server", currentStatus: "up", uptime24h: 99.8, uptime7d: 99.7, uptime30d: 99.5 },
      { id: "mock-3", name: "Auth Service", currentStatus: "down", uptime24h: 95.2, uptime7d: 98.1, uptime30d: 99.0 },
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
          { status: "investigating", message: "We are investigating elevated 5xx error rates on the Auth Service.", createdAt: fiveHoursAgo },
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
        updates: [],
      },
    ];

    return {
      monitors: mockMonitors,
      activeIncidents: mockActiveIncidents,
      resolvedIncidents: mockResolvedIncidents,
    };
  }
}

function getOverallStatus(monitorsList: MonitorWithUptime[]) {
  if (monitorsList.length === 0) return "unknown";
  const hasDown = monitorsList.some((m) => m.currentStatus === "down");
  if (hasDown) return "down";
  const allUp = monitorsList.every((m) => m.currentStatus === "up");
  if (allUp) return "up";
  return "degraded";
}

const bannerConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  up: { bg: "bg-[#1A2E20]", border: "border-[#28A745]/30", text: "text-[#28A745]", label: "Semua Sistem Berjalan Lancar" },
  degraded: { bg: "bg-[#2E2A1A]", border: "border-[#FFBF00]/30", text: "text-[#FFBF00]", label: "Sebagian Sistem Terdegradasi" },
  down: { bg: "bg-[#2E1A1A]", border: "border-[#E11D48]/30", text: "text-[#E11D48]", label: "Gangguan Sistem Utama" },
  unknown: { bg: "bg-[#1c1b1b]", border: "border-[#353534]", text: "text-[#6A737D]", label: "Belum Ada Monitor Dikonfigurasi" },
};

const statusChip: Record<string, { bg: string; border: string; text: string; label: string }> = {
  up: { bg: "bg-[#28A745]/10", border: "border-[#28A745]/20", text: "text-[#28A745]", label: "Operasional" },
  down: { bg: "bg-[#E11D48]/10", border: "border-[#E11D48]/20", text: "text-[#E11D48]", label: "Turun" },
  unknown: { bg: "bg-[#353534]", border: "border-[#454654]", text: "text-[#c6c5d7]", label: "Tidak Diketahui" },
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

function uptimeColor(pct: number) {
  if (pct >= 99.9) return "text-[#28A745]";
  if (pct >= 99) return "text-[#FFBF00]";
  return "text-[#E11D48]";
}

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const { monitors: monitorsList, activeIncidents, resolvedIncidents } =
    await getStatusData();
  const overall = getOverallStatus(monitorsList);
  const banner = bannerConfig[overall];

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] flex flex-col">
      <header className="border-b border-[#24292E] bg-[#131313]">
        <div className="flex justify-between items-center w-full px-6 max-w-[1200px] mx-auto h-16">
          <span className="text-2xl font-semibold text-[#e5e2e1]">StatusBoard</span>
          <nav className="hidden md:flex items-center gap-8">
            <span className="text-[#bec2ff] font-bold border-b-2 border-[#bec2ff] pb-1">Dashboard</span>
          </nav>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-8">
        <div className={`w-full ${banner.bg} border ${banner.border} rounded-lg p-4 flex items-center justify-center gap-3`}>
          <span className={`text-xl font-semibold ${banner.text}`}>{banner.label}</span>
        </div>

        {monitorsList.length > 0 && (
          <section className="flex flex-col gap-4">
            {monitorsList.map((m) => {
              const chip = statusChip[m.currentStatus] || statusChip.unknown;
              return (
                <div
                  key={m.id}
                  className="bg-[#131313] border border-[#24292E] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-semibold text-[#e5e2e1]">{m.name}</h2>
                    <div className={`flex items-center gap-2 ${chip.bg} border ${chip.border} px-3 py-1 rounded-full`}>
                      <div className={`w-2 h-2 rounded-full ${m.currentStatus === "up" ? "bg-[#28A745]" : m.currentStatus === "down" ? "bg-[#E11D48]" : "bg-[#6A737D]"}`} />
                      <span className={`text-xs font-semibold uppercase tracking-[0.05em] ${chip.text}`}>{chip.label}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-2">
                    <div className="bg-[#201f1f] border border-[#24292E] rounded px-2 py-1 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">24j</span>
                      <span className={`font-data-mono ${uptimeColor(m.uptime24h)}`}>{m.uptime24h}%</span>
                    </div>
                    <div className="bg-[#201f1f] border border-[#24292E] rounded px-2 py-1 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">7h</span>
                      <span className={`font-data-mono ${uptimeColor(m.uptime7d)}`}>{m.uptime7d}%</span>
                    </div>
                    <div className="bg-[#201f1f] border border-[#24292E] rounded px-2 py-1 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">30h</span>
                      <span className={`font-data-mono ${uptimeColor(m.uptime30d)}`}>{m.uptime30d}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        <section className="mt-4">
          <h3 className="text-3xl font-bold text-[#e5e2e1] mb-4">Insiden Aktif</h3>
          {activeIncidents.length === 0 ? (
            <div className="bg-[#201f1f] border border-dashed border-[#24292E] rounded-lg p-4 flex items-center justify-center">
              <p className="text-base text-[#6A737D]">Tidak ada insiden aktif saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeIncidents.map((inc) => (
                <div key={inc.id} className="bg-[#131313] border border-[#24292E] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-[#e5e2e1]">{inc.title}</h4>
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                      inc.severity === "critical" ? "bg-[#E11D48]/10 text-[#E11D48]" :
                      inc.severity === "major" ? "bg-orange-500/10 text-orange-500" :
                      "bg-[#FFBF00]/10 text-[#FFBF00]"
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  {inc.monitorName && (
                    <p className="text-sm text-[#6A737D] mb-2">Terkait: {inc.monitorName}</p>
                  )}
                  <p className="text-sm text-[#6A737D] mb-3">
                    Dibuka {formatDate(inc.createdAt)} · Status: {inc.status}
                  </p>
                  {inc.updates.length > 0 && (
                    <div className="border-l border-[#24292E] ml-3 pl-6 space-y-3">
                      {inc.updates.map((u, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[28px] top-1 w-3 h-3 bg-[#FFBF00] rounded-full ring-4 ring-[#131313]" />
                          <time className="font-data-mono text-sm text-[#6A737D]">{formatDate(u.createdAt)} · {u.status}</time>
                          <p className="text-base text-[#c6c5d7] mt-1">{u.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {resolvedIncidents.length > 0 && (
          <section className="mt-4">
            <h3 className="text-3xl font-bold text-[#e5e2e1] mb-4">Riwayat Insiden</h3>
            <div className="relative border-l border-[#24292E] ml-3 pl-6 pb-4 flex flex-col gap-4">
              {resolvedIncidents.map((inc) => (
                <div key={inc.id} className="relative">
                  <div className="absolute -left-[28px] top-1 w-3 h-3 bg-[#28A745] rounded-full ring-4 ring-[#0e0e0e]" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-[#e5e2e1]">{inc.title}</h4>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.05em] bg-[#201f1f] px-2 py-0.5 rounded text-[#6A737D]">
                        Terselesaikan
                      </span>
                    </div>
                    <time className="font-data-mono text-sm text-[#6A737D]">{formatDate(inc.createdAt)}</time>
                    {inc.updates.length > 0 && (
                      <p className="text-base text-[#c6c5d7] mt-2 max-w-2xl">
                        {inc.updates[0].message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[#24292E] bg-[#0e0e0e] mt-auto">
        <div className="w-full py-8 px-6 max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-[#6A737D]">
            &copy; {new Date().getFullYear()} StatusBoard. All systems monitored.
          </div>
        </div>
      </footer>
    </div>
  );
}
