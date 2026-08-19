"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetch("/api/monitors")
      .then((r) => r.json())
      .then(setMonitors);
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
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#e5e2e1] mb-2">Buat Insiden Baru</h2>
        <p className="text-base text-[#6A737D]">Laporkan gangguan atau pemeliharaan terjadwal.</p>
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
            <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
              Judul Insiden
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-inset block w-full px-4 py-3 text-base text-[#e5e2e1] rounded-lg"
              placeholder="Deskripsi singkat gangguan"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label htmlFor="severity" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
                Severitas
              </label>
              <div className="relative">
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="input-inset block w-full px-4 py-3 text-base rounded-lg appearance-none pr-10"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Mayor</option>
                  <option value="critical">Kritis</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#c6c5d7]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="monitor" className="text-xs font-semibold uppercase tracking-[0.05em] text-[#e5e2e1]">
                Monitor Terkait
              </label>
              <div className="relative">
                <select
                  id="monitor"
                  value={monitorId}
                  onChange={(e) => setMonitorId(e.target.value)}
                  className="input-inset block w-full px-4 py-3 text-base rounded-lg appearance-none pr-10"
                >
                  <option value="">Tidak ada</option>
                  {monitors.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#c6c5d7]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-4 mt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/incidents")}
              className="btn-ghost py-3 px-6 text-xs font-semibold uppercase tracking-[0.05em] text-center transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-3 px-6 text-xs font-semibold uppercase tracking-[0.05em] transition-opacity text-center disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Membuat..." : "Buat Insiden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
