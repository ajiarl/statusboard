"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, AlertCircle, Loader2 } from "lucide-react";

export default function NewMonitorPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, method, expectedStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuat monitor");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Monitor</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f5]">
          Tambah Monitor Baru
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Konfigurasi endpoint HTTP(S) untuk dipantau secara berkala melalui scheduler.
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
              htmlFor="name"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
            >
              Nama Layanan / Project
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              placeholder="e.g. Snip URL Shortener, SiMagang API"
            />
            <p className="text-[11px] text-zinc-500 font-mono">
              Label yang akan ditampilkan pada status page publik.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="url"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
            >
              URL Endpoint
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
              placeholder="https://api.yourdomain.com/health"
            />
            <p className="text-[11px] text-zinc-500 font-mono">
              URL publik yang valid. Localhost dan private IP address diblokir (SSRF protection).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label
                htmlFor="method"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
              >
                Metode HTTP
              </label>
              <div className="relative">
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono appearance-none pr-10"
                >
                  <option value="GET">GET</option>
                  <option value="HEAD">HEAD</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="expectedStatus"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
              >
                Expected Status Code
              </label>
              <input
                type="number"
                id="expectedStatus"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                min={100}
                max={599}
                required
                className="block w-full px-3.5 py-2.5 text-sm text-[#f4f4f5] bg-zinc-900/80 border border-[#27272a] rounded-lg focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
              />
              <p className="text-[11px] text-zinc-500 font-mono">
                Standard HTTP code (default: 200).
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <Link
              href="/admin"
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
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Monitor</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
