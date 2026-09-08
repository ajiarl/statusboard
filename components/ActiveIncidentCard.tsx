import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Clock,
  Radio,
} from "lucide-react";
import type { IncidentWithUpdates, IncidentStatus } from "@/lib/types/status";

interface ActiveIncidentCardProps {
  incident: IncidentWithUpdates;
}

const LIFECYCLE_STEPS: { key: IncidentStatus; label: string }[] = [
  { key: "investigating", label: "Investigating" },
  { key: "identified", label: "Identified" },
  { key: "monitoring", label: "Monitoring" },
  { key: "resolved", label: "Resolved" },
];

function getStepIndex(status: string): number {
  const s = status.toLowerCase();
  switch (s) {
    case "investigating":
      return 0;
    case "identified":
      return 1;
    case "monitoring":
      return 2;
    case "resolved":
      return 3;
    default:
      return 0;
  }
}

function formatRelativeTime(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}j lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}h lalu`;
}

function formatExactDate(dateInput: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateInput));
}

export function ActiveIncidentCard({ incident }: ActiveIncidentCardProps) {
  const currentStepIdx = getStepIndex(incident.status);
  const severityLower = incident.severity.toLowerCase();

  const isCritical = severityLower === "critical";
  const isMajor = severityLower === "major";

  const cardBorder = isCritical
    ? "border-rose-500/40 shadow-[0_0_30px_-10px_rgba(244,63,94,0.2)]"
    : isMajor
    ? "border-amber-500/40 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]"
    : "border-zinc-800 shadow-sm";

  return (
    <div
      className={`bg-[#121215] border ${cardBorder} rounded-2xl p-5 md:p-6 transition-all duration-200 flex flex-col gap-6`}
    >
      {/* Top Header: Title, Severity, Monitor, Date */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base md:text-lg font-bold text-zinc-100 tracking-tight">
              {incident.title}
            </h3>

            {/* Severity Badge */}
            {isCritical ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                Critical
              </span>
            ) : isMajor ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                Major
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Info className="w-3.5 h-3.5" />
                Minor
              </span>
            )}
          </div>

          {incident.monitorName && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Layanan terdampak:</span>
              <span className="font-semibold text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {incident.monitorName}
              </span>
            </div>
          )}
        </div>

        {/* Start Timestamp */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 sm:text-right shrink-0">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Dimulai {formatRelativeTime(incident.createdAt)}</span>
        </div>
      </div>

      {/* Stepper Visual Progress Lifecycle: Investigating -> Identified -> Monitoring -> Resolved */}
      <div className="bg-[#09090b]/80 border border-zinc-800/80 rounded-xl p-4 md:p-5">
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Lifecycle Progress</span>
          <span className="font-mono text-zinc-500 lowercase">
            tahap: {incident.status}
          </span>
        </div>

        <div className="grid grid-cols-4 items-center relative">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Connecting Line Left (if idx > 0) */}
                {idx > 0 && (
                  <div
                    className={`absolute right-1/2 top-4 -translate-y-1/2 w-full h-0.5 -z-10 ${
                      idx <= currentStepIdx
                        ? isCritical
                          ? "bg-rose-500/50"
                          : "bg-amber-500/50"
                        : "bg-zinc-800"
                    }`}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : isCurrent
                      ? isCritical
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500 ring-4 ring-rose-500/10"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500 ring-4 ring-amber-500/10"
                      : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Radio className="w-4 h-4 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] md:text-xs font-mono mt-2 transition-colors ${
                    isCurrent
                      ? "text-zinc-100 font-semibold"
                      : isCompleted
                      ? "text-zinc-300"
                      : "text-zinc-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Update Timeline */}
      {incident.updates && incident.updates.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Pembaruan Terkini
          </h4>

          <div className="relative border-l-2 border-zinc-800 ml-2.5 pl-4 space-y-4">
            {incident.updates.map((u, i) => {
              const isFirst = i === 0;
              return (
                <div key={i} className="relative group">
                  {/* Timeline bullet dot */}
                  <div
                    className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#121215] ${
                      isFirst
                        ? isCritical
                          ? "bg-rose-400"
                          : "bg-amber-400"
                        : "bg-zinc-600"
                    }`}
                  />

                  {/* Header update (timestamp, relative, status) */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                    <span className="font-semibold text-zinc-300">
                      {formatRelativeTime(u.createdAt)}
                    </span>
                    <span>·</span>
                    <span className="text-zinc-500">
                      {formatExactDate(u.createdAt)}
                    </span>
                    <span>·</span>
                    <span
                      className={`uppercase text-[11px] font-semibold px-1.5 py-0.2 rounded ${
                        isFirst
                          ? isCritical
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  {/* Message body */}
                  <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
                    {u.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
