import React from "react";
import { CheckCircle2, CheckCircle, Clock } from "lucide-react";
import type { IncidentWithUpdates } from "@/lib/types/status";

interface IncidentHistoryProps {
  incidents: IncidentWithUpdates[];
}

function formatDate(dateInput: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateInput));
}

function calculateDuration(start: Date | string, end: Date | string | null): string | null {
  if (!end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return null;

  const diffMins = Math.round(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins} menit`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
}

export function IncidentHistory({ incidents }: IncidentHistoryProps) {
  return (
    <section className="flex flex-col gap-4 pt-6 border-t border-zinc-800/80">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            Riwayat Insiden
          </h2>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          90 hari terakhir
        </span>
      </div>

      {/* Empty State vs Timeline List */}
      {incidents.length === 0 ? (
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex items-center justify-center gap-3.5 text-zinc-400 text-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-zinc-200">
              No incidents reported in the past 90 days.
            </span>
            <span className="text-zinc-500 text-xs">
              Semua sistem beroperasi normal tanpa insiden.
            </span>
          </div>
        </div>
      ) : (
        <div className="relative border-l-2 border-zinc-800 ml-3.5 pl-6 space-y-6 py-2">
          {incidents.map((inc) => {
            const duration = calculateDuration(inc.createdAt, inc.resolvedAt);

            return (
              <div key={inc.id} className="relative group">
                {/* Timeline Circle */}
                <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-[#09090b] transition-transform group-hover:scale-110" />

                <div className="flex flex-col gap-2 bg-[#121215]/60 hover:bg-[#121215] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 md:p-5 transition-all">
                  {/* Top line: Title & Badges */}
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm md:text-base font-semibold text-zinc-100 tracking-tight">
                        {inc.title}
                      </h3>

                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Resolved
                      </span>

                      {inc.severity && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                          {inc.severity}
                        </span>
                      )}
                    </div>

                    {/* Resolved Date / Duration */}
                    <div className="text-xs font-mono text-zinc-500">
                      {inc.resolvedAt ? (
                        <span>Terselesaikan: {formatDate(inc.resolvedAt)}</span>
                      ) : (
                        <span>{formatDate(inc.createdAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Metadata: Monitor & Duration */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    {inc.monitorName && (
                      <span className="text-zinc-400">
                        Layanan:{" "}
                        <span className="text-zinc-200 font-medium">
                          {inc.monitorName}
                        </span>
                      </span>
                    )}

                    {duration && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="font-mono text-zinc-400">
                          Durasi penanganan:{" "}
                          <span className="text-zinc-200">{duration}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Updates or Resolution Message */}
                  {inc.updates && inc.updates.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 mt-1">
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {inc.updates[0].message}
                      </p>
                      {inc.updates.length > 1 && (
                        <p className="text-xs font-mono text-zinc-500 mt-1.5">
                          +{inc.updates.length - 1} pembaruan investigasi lainnya
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
