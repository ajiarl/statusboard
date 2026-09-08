"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Activity,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  ExternalLink,
} from "lucide-react";

interface Monitor {
  id: string;
  name: string;
  url: string;
  method: string;
  expectedStatus: number;
  isActive: boolean;
  currentStatus: string;
  consecutiveFailures: number;
  lastCheckedAt: string | null;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { bg: string; border: string; text: string; label: string; dot: string }
> = {
  up: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    label: "Operasional",
    dot: "bg-emerald-400 animate-pulse",
  },
  down: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    label: "Down",
    dot: "bg-rose-400 animate-pulse",
  },
  unknown: {
    bg: "bg-zinc-800/60",
    border: "border-zinc-700/50",
    text: "text-zinc-400",
    label: "Tidak Diketahui",
    dot: "bg-zinc-500",
  },
};

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m yang lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j yang lalu`;
  return `${Math.floor(hours / 24)}h yang lalu`;
}

export default function AdminPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await fetch("/api/monitors");
      const data = await res.json();
      setMonitors(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const handleToggle = async (monitor: Monitor) => {
    setTogglingId(monitor.id);
    try {
      await fetch(`/api/monitors/${monitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !monitor.isActive }),
      });
      await fetchMonitors();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await fetchMonitors();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {/* Skeleton stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[#121215] border border-[#27272a] rounded-xl p-4 h-20"
            />
          ))}
        </div>
        {/* Skeleton table */}
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden divide-y divide-[#27272a]">
          <div className="h-12 bg-zinc-900/50" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 h-16 bg-zinc-900/20" />
          ))}
        </div>
      </div>
    );
  }

  const totalCount = monitors.length;
  const upCount = monitors.filter((m) => m.isActive && m.currentStatus === "up").length;
  const downCount = monitors.filter((m) => m.isActive && m.currentStatus === "down").length;
  const pausedCount = monitors.filter((m) => !m.isActive).length;

  return (
    <div className="space-y-6">
      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Total Monitor
            </p>
            <p className="text-2xl font-bold text-[#f4f4f5] mt-1 font-mono">
              {totalCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Operasional
            </p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {upCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Mengalami Gangguan
            </p>
            <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">
              {downCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Dijeda
            </p>
            <p className="text-2xl font-bold text-zinc-400 mt-1 font-mono">
              {pausedCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-400">
            <PauseCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#27272a] rounded-xl bg-[#121215]/50 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#f4f4f5] mb-1">
            Belum ada monitor terdaftar
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-5">
            Tambahkan monitor baru untuk mulai melacak uptime dan latensi layanan Anda secara real-time.
          </p>
          <Link
            href="/admin/monitors/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Monitor Pertama</span>
          </Link>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-[#27272a] bg-zinc-900/50 text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400">
            <div className="col-span-4">Layanan / Endpoint</div>
            <div className="col-span-2">Metode</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Pengecekan Terakhir</div>
            <div className="col-span-1 text-center">Aktif</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#27272a]">
            {monitors.map((monitor) => {
              const st =
                statusConfig[monitor.currentStatus] || statusConfig.unknown;
              const paused = !monitor.isActive;

              return (
                <div
                  key={monitor.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-800/30 transition-colors group ${
                    paused ? "opacity-65" : ""
                  }`}
                >
                  {/* Name & URL */}
                  <div className="md:col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium text-[#f4f4f5] truncate ${
                          paused ? "line-through text-zinc-500" : ""
                        }`}
                      >
                        {monitor.name}
                      </span>
                    </div>
                    <a
                      href={monitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate max-w-full mt-0.5"
                    >
                      <span className="truncate">{monitor.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>

                  {/* Method */}
                  <div className="md:col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 font-mono text-xs">
                      {monitor.method}
                      <span className="text-zinc-500 ml-1.5 text-[10px]">
                        :{monitor.expectedStatus}
                      </span>
                    </span>
                  </div>

                  {/* Status chip */}
                  <div className="md:col-span-2 flex items-center">
                    {paused ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                        Dijeda
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${st.bg} ${st.text} text-xs font-medium border ${st.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    )}
                  </div>

                  {/* Last checked */}
                  <div className="md:col-span-2 font-mono text-xs text-zinc-400">
                    {timeAgo(monitor.lastCheckedAt)}
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="md:col-span-1 flex justify-start md:justify-center items-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(monitor)}
                      disabled={togglingId === monitor.id}
                      role="switch"
                      aria-checked={monitor.isActive}
                      aria-label={
                        monitor.isActive ? "Jeda monitor" : "Aktifkan monitor"
                      }
                      title={
                        monitor.isActive ? "Jeda monitor" : "Aktifkan monitor"
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 ${
                        monitor.isActive
                          ? "bg-emerald-600"
                          : "bg-zinc-800 border-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          monitor.isActive
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex justify-end items-center gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/monitors/${monitor.id}/edit`}
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-md transition-colors"
                      title="Edit Monitor"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteId(monitor.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                      title="Hapus Monitor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="rounded-xl border border-[#27272a] bg-[#121215] p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="delete-modal-title"
                  className="text-base font-semibold text-[#f4f4f5]"
                >
                  Hapus Monitor
                </h2>
                <p className="text-xs text-zinc-400">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-300">
              Apakah Anda yakin ingin menghapus monitor ini? Seluruh riwayat pengecekan (uptime & latency checks) terkait juga akan dihapus.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
