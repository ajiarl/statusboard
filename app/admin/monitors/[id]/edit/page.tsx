"use client";

import { useState, useEffect, FormEvent, use } from "react";
import { useRouter } from "next/navigation";

interface EditMonitorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMonitorPage({ params }: EditMonitorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/monitors");
        if (!res.ok) {
          throw new Error("HTTP error " + res.status);
        }
        const monitors = await res.json();
        const monitor = monitors.find((m: { id: string }) => m.id === id);
        if (monitor) {
          setName(monitor.name);
          setUrl(monitor.url);
          setMethod(monitor.method);
          setExpectedStatus(monitor.expectedStatus);
        } else {
          setError("Monitor tidak ditemukan");
        }
      } catch (err) {
        console.error("Load monitor error:", err);
        setError("Gagal memuat data monitor. Pastikan database aktif.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, retryTrigger]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, method, expectedStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal memperbarui monitor");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-[#353534] rounded w-1/4" />
          <div className="h-4 bg-[#353534] rounded w-1/3" />
        </div>
        <div className="bg-[#171824] border border-[#24292E] rounded-xl p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-[#353534] rounded w-20" />
            <div className="h-12 bg-[#201f1f] rounded-lg border border-[#24292E]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-[#353534] rounded w-12" />
            <div className="h-12 bg-[#201f1f] rounded-lg border border-[#24292E]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="h-4 bg-[#353534] rounded w-24" />
              <div className="h-12 bg-[#201f1f] rounded-lg border border-[#24292E]" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[#353534] rounded w-28" />
              <div className="h-12 bg-[#201f1f] rounded-lg border border-[#24292E]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="max-w-3xl card-level-1 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#E11D48]">Error Memuat Data</h2>
        <p className="text-sm text-[#6A737D]">{error}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              setRetryTrigger((prev) => prev + 1);
            }}
            className="btn-primary px-5 py-2 text-sm font-semibold transition-opacity"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="btn-ghost px-5 py-2 text-sm transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#e5e2e1] mb-2">Edit Monitor</h2>
        <p className="text-base text-[#6A737D]">Perbarui konfigurasi endpoint yang dipantau.</p>
      </div>

      <div className="card-level-1 rounded-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
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
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
              Nama Monitor
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-inset block w-full px-4 py-3 text-base text-[#e5e2e1] rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="url" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
              URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="input-inset block w-full px-4 py-3 font-data-mono rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label htmlFor="method" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
                Metode HTTP
              </label>
              <div className="relative">
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="input-inset block w-full px-4 py-3 font-data-mono rounded-lg appearance-none pr-10"
                >
                  <option value="GET">GET</option>
                  <option value="HEAD">HEAD</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#c6c5d7]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="expectedStatus" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
                Expected Status
              </label>
              <input
                type="number"
                id="expectedStatus"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                min={100}
                max={599}
                className="input-inset block w-full px-4 py-3 font-data-mono rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-4 mt-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="btn-ghost py-3 px-6 text-xs font-semibold uppercase tracking-[0.05em] text-center transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-3 px-6 text-xs font-semibold uppercase tracking-[0.05em] transition-opacity text-center disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
