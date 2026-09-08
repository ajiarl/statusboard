import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { OverallSystemStatus } from "@/lib/types/status";

interface StatusHeroBannerProps {
  status: OverallSystemStatus;
  totalMonitors: number;
  downMonitorsCount?: number;
  degradedMonitorsCount?: number;
  downServiceName?: string | null;
}

export function StatusHeroBanner({
  status,
  totalMonitors,
  downMonitorsCount = 0,
  degradedMonitorsCount = 0,
  downServiceName,
}: StatusHeroBannerProps) {
  if (status === "up") {
    return (
      <div className="w-full bg-[#121215] border border-emerald-500/25 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] relative overflow-hidden transition-all duration-200">
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">
                  All Systems Operational
                </h1>
              </div>
              <p className="text-sm md:text-base text-zinc-400">
                Semua {totalMonitors} layanan beroperasi normal tanpa kendala.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            100% Healthy
          </div>
        </div>
      </div>
    );
  }

  if (status === "degraded") {
    return (
      <div className="w-full bg-[#121215] border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)] relative overflow-hidden transition-all duration-200">
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">
                  Degraded System Performance
                </h1>
              </div>
              <p className="text-sm md:text-base text-zinc-400">
                {degradedMonitorsCount > 0 ? degradedMonitorsCount : 1} dari {totalMonitors} layanan mengalami penurunan respon atau kendala berkala.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Degraded
          </div>
        </div>
      </div>
    );
  }

  if (status === "down") {
    return (
      <div className="w-full bg-[#121215] border border-rose-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_35px_-10px_rgba(244,63,94,0.2)] relative overflow-hidden transition-all duration-200">
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <XCircle className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">
                  Major System Outage
                </h1>
              </div>
              <p className="text-sm md:text-base text-zinc-400">
                Gangguan terdeteksi pada {downMonitorsCount > 0 ? downMonitorsCount : 1} layanan
                {downServiceName ? ` (${downServiceName})` : ""}. Tim sedang menangani masalah ini.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Outage
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#121215] border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-zinc-800/80 text-zinc-400 shrink-0">
          <HelpCircle className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100 mb-1">
            Belum Ada Monitor Dikonfigurasi
          </h1>
          <p className="text-sm md:text-base text-zinc-400">
            Sistem belum memonitor endpoint aktif. Silakan tambahkan monitor melalui portal admin.
          </p>
        </div>
      </div>
    </div>
  );
}
