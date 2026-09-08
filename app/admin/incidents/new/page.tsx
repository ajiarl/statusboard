"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, AlertCircle, Loader2 } from "lucide-react";

interface Monitor {
  id: string;
  name: string;
}

export default function NewIncidentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [monitorId, setMonitorId] = useState("");
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMonitors, setLoadingMonitors] = useState(true);

  useEffect(() => {
    fetch("/api/monitors")
      .then((r) => {
        if (!r.ok) {
          throw new Error("HTTP error " + r.status);
        }
        return r.json();
      })
      .then((data) => {
        setMonitors(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Fetch monitors error:", err);
        setError("Gagal memuat daftar monitor. Pastikan database aktif.");
      })
      .finally(() => {
        setLoadingMonitors(false);
      });
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          severity,
          monitorId: monitorId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuat insiden");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin/incidents");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Insiden</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f5]">
          Buat Insiden Baru
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Laporkan kendala, degradasi performa, atau pemeliharaan sistem ke publik.
        </p>
      </div>

      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              htmlFor="title"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
            >
              Judul Insiden
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              placeholder="e.g. Latensi tinggi pada database Supabase, API down"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label
                htmlFor="severity"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
              >
                Tingkat Severitas
              </label>
              <div className="relative">
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors appearance-none pr-10"
                >
                  <option value="minor">Minor (Gangguan kecil/parsial)</option>
                  <option value="major">Mayor (Layanan terganggu)</option>
                  <option value="critical">Kritis (Layanan mati total)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="monitor"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
              >
                Layanan Terkait (Opsional)
              </label>
              <div className="relative">
                <select
                  id="monitor"
                  value={monitorId}
                  onChange={(e) => setMonitorId(e.target.value)}
                  disabled={loadingMonitors}
                  className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors appearance-none pr-10 disabled:opacity-50"
                >
                  {loadingMonitors ? (
                    <option>Memuat daftar monitor...</option>
                  ) : (
                    <>
                      <option value="">Tidak terhubung ke monitor tertentu</option>
                      {monitors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <Link
              href="/admin/incidents"
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded-lg transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Insiden...</span>
                </>
              ) : (
                <span>Buat Insiden</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
