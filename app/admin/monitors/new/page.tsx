"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

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
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#e5e2e1] mb-2">Tambah Monitor Baru</h2>
        <p className="text-base text-[#6A737D]">Konfigurasi endpoint untuk dipantau secara berkala.</p>
      </div>

      <div className="card-level-1 rounded-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div
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
              placeholder="Masukkan nama layanan"
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
              placeholder="https://api.contoh.com"
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
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
