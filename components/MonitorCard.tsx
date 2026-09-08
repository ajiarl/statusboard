import React from "react";
import { Globe, ArrowUpRight } from "lucide-react";
import type { MonitorWithHeartbeat } from "@/lib/types/status";
import { HeartbeatBars } from "./HeartbeatBars";

interface MonitorCardProps {
  monitor: MonitorWithHeartbeat;
}

function uptimeColor(pct: number): string {
  if (pct >= 99.9) return "text-emerald-400";
  if (pct >= 99.0) return "text-amber-400";
  return "text-rose-400";
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const isUp = monitor.currentStatus === "up";
  const isDegraded = monitor.currentStatus === "degraded";
  const isDown = monitor.currentStatus === "down";

  return (
    <div className="bg-[#121215] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 md:p-6 transition-all duration-200 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg md:text-xl font-semibold text-zinc-100 tracking-tight">
            {monitor.name}
          </h2>
          {monitor.url && (
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-400 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition-colors max-w-[260px] truncate group"
              title={monitor.url}
            >
              <Globe className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-400 shrink-0" />
              <span className="truncate">{monitor.url.replace(/^https?:\/\//, "")}</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          )}
        </div>

        {/* Status Badge with Live Pulse Dot */}
        <div>
          {isUp ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Operasional</span>
            </div>
          ) : isDegraded ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Terdegradasi</span>
            </div>
          ) : isDown ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>Gangguan / Down</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Tidak Diketahui</span>
            </div>
          )}
        </div>
      </div>

      {/* 90-Day Heartbeat Bars */}
      <div className="w-full">
        <HeartbeatBars
          heartbeats={monitor.heartbeats}
          avgLatencyMs={monitor.avgLatencyMs}
        />
      </div>

      {/* Footer Metrics (24h, 7d, 30d) in font-mono */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
        <span className="text-zinc-500 font-sans">Riwayat Uptime</span>
        <div className="flex items-center gap-4 sm:gap-6 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">24j:</span>
            <span className={`font-semibold ${uptimeColor(monitor.uptime24h)}`}>
              {monitor.uptime24h.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">7h:</span>
            <span className={`font-semibold ${uptimeColor(monitor.uptime7d)}`}>
              {monitor.uptime7d.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">30h:</span>
            <span className={`font-semibold ${uptimeColor(monitor.uptime30d)}`}>
              {monitor.uptime30d.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
