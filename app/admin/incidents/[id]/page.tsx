"use client";

import { useState, useEffect, useCallback, FormEvent, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Loader2,
  Clock,
  RefreshCw,
  Send,
} from "lucide-react";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface IncidentUpdate {
  id: string;
  status: string;
  message: string;
  createdAt: string;
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
  { bg: string; border: string; text: string; label: string; dot: string }
> = {
  investigating: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    label: "Diselidiki",
    dot: "bg-amber-500",
  },
  identified: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    label: "Teridentifikasi",
    dot: "bg-orange-500",
  },
  monitoring: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    label: "Dipantau",
    dot: "bg-blue-500",
  },
  resolved: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    label: "Terselesaikan",
    dot: "bg-emerald-500",
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

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
  const { id } = use(params);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState("investigating");
  const [updateMessage, setUpdateMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [incRes, updatesRes] = await Promise.all([
        fetch("/api/incidents"),
        fetch(`/api/incidents/${id}/updates`),
      ]);

      if (!incRes.ok) {
        throw new Error("HTTP error: " + incRes.status);
      }

      const allIncidents = await incRes.json();
      const inc = allIncidents.find((i: Incident) => i.id === id);

      if (!inc) {
        setFetchError("Insiden tidak ditemukan");
        return;
      }

      setIncident(inc);
      setFetchError("");

      if (updatesRes.ok) {
        const updatesData = await updatesRes.json();
        setUpdates(Array.isArray(updatesData) ? updatesData : []);
      }
    } catch (err) {
      console.error("fetchData error:", err);
      setFetchError("Gagal memuat detail insiden. Pastikan database aktif.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [incRes, updatesRes] = await Promise.all([
          fetch("/api/incidents"),
          fetch(`/api/incidents/${id}/updates`),
        ]);

        if (ignore) return;
        if (!incRes.ok) {
          throw new Error("HTTP error: " + incRes.status);
        }

        const allIncidents = await incRes.json();
        const inc = allIncidents.find((i: Incident) => i.id === id);

        if (!inc) {
          setFetchError("Insiden tidak ditemukan");
          return;
        }

        setIncident(inc);
        setFetchError("");

        if (updatesRes.ok) {
          const updatesData = await updatesRes.json();
          setUpdates(Array.isArray(updatesData) ? updatesData : []);
        }
      } catch (err) {
        console.error("fetchData error:", err);
        if (!ignore) {
          setFetchError("Gagal memuat detail insiden. Pastikan database aktif.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleAddUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/incidents/${id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updateStatus, message: updateMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menambah update");
        setIsSubmitting(false);
        return;
      }

      setUpdateMessage("");
      await fetchData();
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      await fetchData();
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-3xl space-y-6">
        <div className="h-4 bg-zinc-800 rounded w-1/4" />
        <div className="h-8 bg-zinc-800 rounded w-1/2" />
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 h-48" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-3xl bg-[#121215] border border-[#27272a] rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-[#f4f4f5]">
          Error Memuat Data
        </h2>
        <p className="text-sm text-zinc-400">{fetchError}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
          <Link
            href="/admin/incidents"
            className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700/60"
          >
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">Insiden tidak ditemukan.</p>
        <Link
          href="/admin/incidents"
          className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
        >
          Kembali ke daftar insiden
        </Link>
      </div>
    );
  }

  const sev = severityChip[incident.severity] || severityChip.minor;
  const st = statusChip[incident.status] || statusChip.investigating;
  const isResolved = incident.status === "resolved";

  return (
    <div className="max-w-3xl space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Insiden</span>
        </Link>
      </div>

      {/* Incident Header Card */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f5]">
              {incident.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sev.bg} ${sev.text} border ${sev.border}`}
              >
                {sev.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text} border ${st.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <span className="font-mono text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                {formatDateMono(incident.createdAt)}
              </span>
              {incident.resolvedAt && (
                <span className="font-mono text-xs text-emerald-400/80 flex items-center gap-1">
                  ✓ Selesai {formatDateMono(incident.resolvedAt)}
                </span>
              )}
            </div>
          </div>

          {!isResolved && (
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0 shadow-sm"
            >
              {isResolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyelesaikan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tandai Selesai</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Timeline Pembaruan ({updates.length})
          </h2>
        </div>

        {updates.length === 0 ? (
          <div className="bg-[#121215] border border-dashed border-[#27272a] rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">
              Belum ada catatan pembaruan untuk insiden ini.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#27272a]">
            {updates.map((u) => {
              const uSt = statusChip[u.status] || statusChip.investigating;
              return (
                <div key={u.id} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-[#09090b] ${uSt.dot}`}
                  />
                  {/* Card Update */}
                  <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 md:p-5 shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${uSt.bg} ${uSt.text} border ${uSt.border}`}
                      >
                        {uSt.label}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">
                        {formatDateMono(u.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {u.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Update Form */}
      {!isResolved && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 md:p-8 shadow-sm space-y-5">
          <div className="border-b border-[#27272a] pb-4">
            <h2 className="text-base font-semibold text-[#f4f4f5]">
              Tambah Catatan Pembaruan
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Posting pembaruan status terkini untuk ditampilkan kepada pengunjung publik.
            </p>
          </div>

          <form onSubmit={handleAddUpdate} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="updateStatus"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
              >
                Status Terkini
              </label>
              <div className="relative">
                <select
                  id="updateStatus"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors appearance-none pr-10"
                >
                  <option value="investigating">Diselidiki (Sedang menganalisis akar masalah)</option>
                  <option value="identified">Teridentifikasi (Penyebab telah ditemukan)</option>
                  <option value="monitoring">Dipantau (Perbaikan diterapkan, pemantauan kestabilan)</option>
                  <option value="resolved">Terselesaikan (Layanan pulih sepenuhnya)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="updateMessage"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
              >
                Pesan Pembaruan
              </label>
              <textarea
                id="updateMessage"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                required
                rows={3}
                className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors resize-none leading-relaxed"
                placeholder="Deskripsikan perkembangan penanganan, investigasi, atau mitigasi yang sedang dilakukan..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !updateMessage.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Update...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Pembaruan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
