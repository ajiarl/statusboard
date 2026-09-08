"use client";

import { useState, useEffect, useCallback, FormEvent, use } from "react";
import { useRouter } from "next/navigation";

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

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState("investigating");
  const [updateMessage, setUpdateMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    try {
      await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-3xl space-y-8">
        <div className="space-y-3">
          <div className="h-8 bg-[#353534] rounded w-1/2" />
          <div className="flex items-center gap-3">
            <div className="h-6 bg-[#353534] rounded-full w-24" />
            <div className="h-4 bg-[#353534] rounded w-1/3" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-[#353534] rounded w-16" />
          <div className="border-l border-[#24292E] ml-3 pl-6 space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-[#353534] rounded-full w-20" />
                  <div className="h-4 bg-[#353534] rounded w-28" />
                </div>
                <div className="h-4 bg-[#353534] rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-3xl card-level-1 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#E11D48]">Error Memuat Data</h2>
        <p className="text-sm text-[#6A737D]">{fetchError}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="btn-primary px-5 py-2 text-sm font-semibold transition-opacity"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => router.push("/admin/incidents")}
            className="btn-ghost px-5 py-2 text-sm transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-20">
        <p className="text-[#6A737D]">Insiden tidak ditemukan.</p>
        <button onClick={() => router.push("/admin/incidents")} className="mt-4 text-sm text-[#606AF0] hover:underline">
          Kembali ke daftar insiden
        </button>
      </div>
    );
  }

  const st = statusChip[incident.status] || statusChip.investigating;
  const isResolved = incident.status === "resolved";

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/admin/incidents")}
        className="text-sm text-[#6A737D] hover:text-[#c6c5d7] mb-6 transition-colors flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Kembali ke insiden
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e2e1]">{incident.title}</h1>
          <div className="flex items-center gap-3 mt-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.bg} ${st.text} border ${st.border}`}>
              {st.label}
            </span>
            <span className="text-sm text-[#6A737D]">
              {incident.severity === "critical" ? "Kritis" : incident.severity === "major" ? "Mayor" : "Minor"}
              {" · "}Dibuka {formatDateMono(incident.createdAt)}
              {incident.resolvedAt && ` · Diselesaikan ${formatDateMono(incident.resolvedAt)}`}
            </span>
          </div>
        </div>
        {!isResolved && (
          <button
            onClick={handleResolve}
            disabled={isSubmitting}
            className="bg-[#28A745] hover:bg-[#218838] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            Tandai Selesai
          </button>
        )}
      </div>

      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D] mb-4">Timeline</h2>
        {updates.length === 0 ? (
          <div className="bg-[#201f1f] border border-dashed border-[#24292E] rounded-lg p-4 flex items-center justify-center">
            <p className="text-sm text-[#6A737D]">Belum ada update.</p>
          </div>
        ) : (
          <div className="border-l border-[#24292E] ml-3 pl-6 space-y-6">
            {updates.map((u) => {
              const uSt = statusChip[u.status] || statusChip.investigating;
              return (
                <div key={u.id} className="relative">
                  <div className={`absolute -left-[28px] top-1 w-3 h-3 rounded-full ring-4 ring-[#0F0F0F] ${
                    u.status === "resolved" ? "bg-[#28A745]" :
                    u.status === "identified" ? "bg-orange-500" :
                    "bg-[#FFBF00]"
                  }`} />
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${uSt.bg} ${uSt.text} border ${uSt.border}`}>
                      {uSt.label}
                    </span>
                    <span className="font-data-mono text-sm text-[#6A737D]">{formatDateMono(u.createdAt)}</span>
                  </div>
                  <p className="text-base text-[#c6c5d7] mt-1">{u.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!isResolved && (
        <section className="card-level-1 rounded-xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6A737D] mb-4">Tambah Update</h2>
          <form onSubmit={handleAddUpdate} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(225, 29, 72, 0.1)",
                  border: "1px solid rgba(225, 29, 72, 0.2)",
                  color: "#E11D48",
                }}
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="updateStatus" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
                Status
              </label>
              <div className="relative">
                <select
                  id="updateStatus"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="input-inset block w-full px-4 py-3 text-base rounded-lg appearance-none pr-10"
                >
                  <option value="investigating">Diselidiki</option>
                  <option value="identified">Teridentifikasi</option>
                  <option value="monitoring">Dipantau</option>
                  <option value="resolved">Terselesaikan</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#c6c5d7]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="updateMessage" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
                Pesan
              </label>
              <textarea
                id="updateMessage"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                required
                rows={3}
                className="input-inset block w-full px-4 py-3 text-base rounded-lg resize-none"
                placeholder="Jelaskan situasi saat ini..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-3 px-6 text-xs font-semibold uppercase tracking-[0.05em] transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Update"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
