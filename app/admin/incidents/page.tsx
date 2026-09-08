"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Plus,
  ChevronRight,
  Clock,
} from "lucide-react";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

const severityChip: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  minor: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    label: "Minor",
  },
  major: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    label: "Mayor",
  },
  critical: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    label: "Kritis",
  },
};

const statusChip: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  investigating: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    label: "Diselidiki",
  },
  identified: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    label: "Teridentifikasi",
  },
  monitoring: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    label: "Dipantau",
  },
  resolved: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    label: "Terselesaikan",
  },
};

function formatDateMono(d: string) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch("/api/incidents");
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#121215] border border-[#27272a] rounded-xl p-6 h-24"
            />
          ))}
        </div>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden divide-y divide-[#27272a]">
          <div className="h-12 bg-zinc-900/50" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 h-16 bg-zinc-900/20" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = incidents.filter((i) => i.status !== "resolved").length;
  const investigatingCount = incidents.filter(
    (i) => i.status === "investigating"
  ).length;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121215] border border-[#27272a] p-5 rounded-xl flex items-center gap-4">
          <div className="w-11 h-11 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
              Insiden Aktif
            </p>
            <h3 className="text-2xl font-bold font-mono text-[#f4f4f5] mt-0.5">
              {activeCount}
            </h3>
          </div>
        </div>

        <div className="bg-[#121215] border border-[#27272a] p-5 rounded-xl flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
              Tahap Investigasi
            </p>
            <h3 className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
              {investigatingCount}
            </h3>
          </div>
        </div>

        <div className="bg-[#121215] border border-[#27272a] p-5 rounded-xl flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
              Total Insiden
            </p>
            <h3 className="text-2xl font-bold font-mono text-[#f4f4f5] mt-0.5">
              {incidents.length}
            </h3>
          </div>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#27272a] rounded-xl bg-[#121215]/50 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-[#f4f4f5] mb-1">
            Semua Sistem Beroperasi Normal
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-5">
            Tidak ada insiden atau pemeliharaan yang tercatat di database saat ini.
          </p>
          <Link
            href="/admin/incidents/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Insiden Baru</span>
          </Link>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-[#27272a]">
                  <th className="px-6 py-3.5 text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                    Judul Insiden
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                    Severitas
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                    Status Lifecycle
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400 hidden md:table-cell">
                    Waktu Dibuat
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400 text-right">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {incidents.map((inc) => {
                  const sev = severityChip[inc.severity] || severityChip.minor;
                  const st = statusChip[inc.status] || statusChip.investigating;
                  return (
                    <tr
                      key={inc.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/incidents/${inc.id}`}
                          className="text-sm font-medium text-[#f4f4f5] hover:text-emerald-400 transition-colors block"
                        >
                          {inc.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sev.bg} ${sev.text} border ${sev.border}`}
                        >
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text} border ${st.border}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400 hidden md:table-cell">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {formatDateMono(inc.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/incidents/${inc.id}`}
                          className="inline-flex items-center p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-md transition-colors"
                          title="Buka Timeline & Kelola Insiden"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
