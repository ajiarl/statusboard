"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

const severityChip: Record<string, { bg: string; border: string; text: string }> = {
  minor: { bg: "bg-[#FFBF00]/10", border: "border-[#FFBF00]/20", text: "text-[#FFBF00]" },
  major: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-500" },
  critical: { bg: "bg-[#E11D48]/10", border: "border-[#E11D48]/20", text: "text-[#E11D48]" },
};

const statusChip: Record<string, { bg: string; border: string; text: string; label: string }> = {
  investigating: { bg: "bg-[#FFBF00]/10", border: "border-[#FFBF00]/20", text: "text-[#FFBF00]", label: "Diselidiki" },
  identified: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-500", label: "Teridentifikasi" },
  monitoring: { bg: "bg-[#FFBF00]/10", border: "border-[#FFBF00]/20", text: "text-[#FFBF00]", label: "Dipantau" },
  resolved: { bg: "bg-[#28A745]/10", border: "border-[#28A745]/20", text: "text-[#28A745]", label: "Terselesaikan" },
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
      setIncidents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#6A737D]">Memuat insiden...</div>
      </div>
    );
  }

  const activeCount = incidents.filter((i) => i.status !== "resolved").length;
  const investigatingCount = incidents.filter((i) => i.status === "investigating").length;

  return (
    <div>
      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#454654] rounded-xl bg-[#171824]/30">
          <p className="text-[#c6c5d7] text-base">Tidak ada insiden yang tercatat.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#171824] border border-[#24292E] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1c1b1b] border-b border-[#24292E]">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">Judul Insiden</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">Severitas</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D]">Tanggal Dibuat</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24292E]">
                  {incidents.map((inc) => {
                    const sev = severityChip[inc.severity] || severityChip.minor;
                    const st = statusChip[inc.status] || statusChip.investigating;
                    return (
                      <tr key={inc.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-5 text-base text-[#e5e2e1]">{inc.title}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${sev.bg} ${sev.text} border ${sev.border}`}>
                            {inc.severity === "critical" ? "Kritis" : inc.severity === "major" ? "Mayor" : "Minor"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.bg} ${st.text} border ${st.border}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-data-mono text-[#c6c5d7]">{formatDateMono(inc.createdAt)}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/incidents/${inc.id}`}
                              className="text-[#c6c5d7] hover:text-[#bec2ff] transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#171824] border border-[#24292E] p-6 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E11D48]/10 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D] mb-1">Insiden Aktif</p>
                <h3 className="text-2xl font-semibold text-[#e5e2e1]">{activeCount}</h3>
              </div>
            </div>
            <div className="bg-[#171824] border border-[#24292E] p-6 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFBF00]/10 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFBF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D] mb-1">Diselidiki</p>
                <h3 className="text-2xl font-semibold text-[#e5e2e1]">{investigatingCount}</h3>
              </div>
            </div>
            <div className="bg-[#171824] border border-[#24292E] p-6 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#28A745]/10 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28A745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D] mb-1">Total Insiden</p>
                <h3 className="text-2xl font-semibold text-[#e5e2e1]">{incidents.length}</h3>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
