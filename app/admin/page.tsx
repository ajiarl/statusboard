"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

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

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string; dot: string }> = {
  up: { bg: "bg-[#28A745]/10", border: "border-[#28A745]/20", text: "text-[#28A745]", label: "Operasional", dot: "bg-[#28A745] animate-pulse" },
  down: { bg: "bg-[#E11D48]/10", border: "border-[#E11D48]/20", text: "text-[#E11D48]", label: "Turun", dot: "bg-[#E11D48]" },
  unknown: { bg: "bg-[#353534]", border: "border-[#454654]", text: "text-[#c6c5d7]", label: "Tidak Diketahui", dot: "bg-[#6A737D]" },
};

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit yang lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  return `${Math.floor(hours / 24)} hari yang lalu`;
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
      setMonitors(data);
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
      <div className="flex items-center justify-center py-20">
        <div className="text-[#6A737D]">Memuat monitor...</div>
      </div>
    );
  }

  return (
    <div>
      {monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#454654] rounded-xl bg-[#171824]/30">
          <p className="text-[#c6c5d7] text-base text-center max-w-md">
            Tidak ada monitor yang ditemukan. Tambahkan monitor baru untuk mulai melacak uptime layanan Anda.
          </p>
          <Link
            href="/admin/monitors/new"
            className="mt-4 bg-[#606AF0] hover:bg-[#5059d0] text-white px-5 py-2 rounded text-sm font-medium transition-colors"
          >
            + Tambah Monitor
          </Link>
        </div>
      ) : (
        <div className="bg-[#171824] border border-[#24292E] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-[#24292E] bg-[#1c1b1b] text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">
            <div className="col-span-3">Nama / URL</div>
            <div className="col-span-2">Metode</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Terakhir Dicek</div>
            <div className="col-span-1 text-center">Aktif</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>

          <div className="divide-y divide-[#24292E]">
            {monitors.map((monitor) => {
              const st = statusConfig[monitor.currentStatus] || statusConfig.unknown;
              const paused = !monitor.isActive;
              return (
                <div
                  key={monitor.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-[#353534]/30 transition-colors group ${paused ? "opacity-60" : ""}`}
                >
                  <div className="md:col-span-3">
                    <div className={`text-base font-semibold text-[#e5e2e1] mb-1 ${paused ? "line-through text-[#6A737D]" : ""}`}>
                      {monitor.name}
                    </div>
                    <div className="font-data-mono text-xs text-[#bec2ff] truncate">
                      {monitor.url}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="px-2 py-1 rounded bg-[#353534] text-[#e5e2e1] font-data-mono text-xs">
                      {monitor.method}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    {paused ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#353534] text-[#c6c5d7] text-xs font-semibold border border-[#454654]">
                        Dijeda
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm ${st.bg} ${st.text} text-xs font-semibold border ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-3 font-data-mono text-[13px] text-[#6A737D]">
                    {timeAgo(monitor.lastCheckedAt)}
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={() => handleToggle(monitor)}
                      disabled={togglingId === monitor.id}
                      className="disabled:opacity-50"
                      title={monitor.isActive ? "Jeda monitor" : "Aktifkan monitor"}
                    >
                      <div className={`toggle-track ${monitor.isActive ? "active" : ""}`} />
                    </button>
                  </div>
                  <div className="md:col-span-1 flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/monitors/${monitor.id}/edit`}
                      className="text-[#c6c5d7] hover:text-[#bec2ff] transition-colors p-1"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </Link>
                    <button
                      onClick={() => setDeleteId(monitor.id)}
                      className="text-[#c6c5d7] hover:text-[#E11D48] transition-colors p-1"
                      title="Hapus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl border border-[#24292E] bg-[#171824] p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Hapus Monitor</h2>
            <p className="text-sm text-[#6A737D] mb-6">
              Apakah Anda yakin? Semua riwayat pengecekan terkait juga akan dihapus.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-ghost py-2 px-4 text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm rounded bg-[#E11D48] text-white hover:bg-[#be123c] transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
