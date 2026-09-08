"use client";

import React, { useState } from "react";
import type { DailyHeartbeat, HeartbeatStatus } from "@/lib/types/status";

interface HeartbeatBarsProps {
  heartbeats?: DailyHeartbeat[];
  avgLatencyMs?: number | null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getBarColor(status: HeartbeatStatus): string {
  switch (status) {
    case "up":
      return "bg-emerald-500 hover:bg-emerald-400";
    case "degraded":
      return "bg-amber-500 hover:bg-amber-400";
    case "down":
      return "bg-rose-500 hover:bg-rose-400";
    case "none":
    default:
      return "bg-zinc-800 hover:bg-zinc-700";
  }
}

function getStatusBadge(status: HeartbeatStatus, uptimePct: number): { label: string; textClass: string } {
  switch (status) {
    case "up":
      return {
        label: `${uptimePct > 0 ? uptimePct : 100}% Operasional`,
        textClass: "text-emerald-400",
      };
    case "degraded":
      return {
        label: `${uptimePct}% Terdegradasi`,
        textClass: "text-amber-400",
      };
    case "down":
      return {
        label: `${uptimePct}% Gangguan / Down`,
        textClass: "text-rose-400",
      };
    case "none":
    default:
      return {
        label: "Belum Ada Data",
        textClass: "text-zinc-500",
      };
  }
}

export function HeartbeatBars({ heartbeats = [], avgLatencyMs }: HeartbeatBarsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Selalu pastikan ada tepat 90 slot hari
  const bars: DailyHeartbeat[] = React.useMemo(() => {
    if (heartbeats.length >= 90) {
      return heartbeats.slice(-90);
    }
    const missing = 90 - heartbeats.length;
    const padded: DailyHeartbeat[] = [];
    const now = new Date();
    for (let i = missing - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - (89 - i) * 24 * 60 * 60 * 1000);
      padded.push({
        date: d.toISOString().split("T")[0],
        status: "none",
        uptimePct: 0,
        avgLatencyMs: null,
      });
    }
    return [...padded, ...heartbeats];
  }, [heartbeats]);

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* 90 Bars Container */}
      <div className="relative w-full">
        <div className="flex items-center gap-[2px] h-8 w-full py-1">
          {bars.map((bar, idx) => {
            const isHovered = hoveredIdx === idx;
            const statusInfo = getStatusBadge(bar.status, bar.uptimePct);

            // Tentukan alignment tooltip agar tidak overflow container
            let tooltipAlignClass = "left-1/2 -translate-x-1/2";
            if (idx < 12) {
              tooltipAlignClass = "left-0";
            } else if (idx > 77) {
              tooltipAlignClass = "right-0";
            }

            return (
              <div
                key={`${bar.date}-${idx}`}
                className="flex-1 h-full min-w-[2px] relative group flex items-center justify-center cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  className={`w-full h-full rounded-[1.5px] transition-all duration-150 ${getBarColor(
                    bar.status
                  )} ${isHovered ? "scale-y-125 brightness-125 shadow-sm" : ""}`}
                />

                {/* Floating Interactive Tooltip */}
                {isHovered && (
                  <div
                    className={`absolute bottom-full mb-2.5 z-30 pointer-events-none min-w-[150px] p-2.5 rounded-lg bg-zinc-900/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md transition-opacity duration-150 ${tooltipAlignClass}`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs mb-1">
                      <span className="font-medium text-zinc-200">
                        {formatDate(bar.date)}
                      </span>
                      <span className={`font-mono font-semibold ${statusInfo.textClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between border-t border-zinc-800 pt-1">
                      <span>Rata-rata Respon</span>
                      <span className="text-zinc-200">
                        {bar.avgLatencyMs !== null ? `${bar.avgLatencyMs}ms` : "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Labels: 90 days ago, latency avg, Today */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 font-sans">
        <span>90 days ago</span>
        <div className="font-mono text-zinc-400">
          Average response:{" "}
          <span className="text-zinc-200 font-medium">
            {avgLatencyMs !== null && avgLatencyMs !== undefined
              ? `${avgLatencyMs}ms`
              : "—"}
          </span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
}
