"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      router.push(data.redirectTo || "/admin/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const isMonitorActive =
    pathname === "/admin" || pathname.startsWith("/admin/monitors");
  const isIncidentActive = pathname.startsWith("/admin/incidents");

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 fixed left-0 top-0 h-screen flex-col border-r border-[#27272a] bg-[#121215] z-50 py-6">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-[#f4f4f5]">
              StatusBoard
            </h1>
          </div>
          <p className="text-[10px] tracking-[0.2em] font-semibold text-zinc-500 mt-1 uppercase font-mono">
            ADMIN PANEL
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 px-3">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all ${
              isMonitorActive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Monitors</span>
          </Link>
          <Link
            href="/admin/incidents"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all ${
              isIncidentActive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Incidents</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-[#27272a]/60">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all border border-transparent group"
            >
              <span className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                <span>Lihat Status Page</span>
              </span>
            </Link>
          </div>
        </nav>

        <div className="px-3 mt-auto border-t border-[#27272a] pt-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{loggingOut ? "Memproses..." : "Keluar"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col p-6 md:hidden">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-lg font-bold text-[#f4f4f5]">StatusBoard</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-400 hover:text-zinc-100 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-2">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                isMonitorActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Monitors</span>
            </Link>
            <Link
              href="/admin/incidents"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                isIncidentActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Incidents</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Lihat Status Page</span>
            </Link>
          </nav>
          <div className="border-t border-[#27272a] pt-4 mt-auto">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{loggingOut ? "Memproses..." : "Keluar"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-zinc-400 p-1.5 -ml-1.5 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-lg transition-colors"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]">
              {isIncidentActive ? "Insiden" : "Monitor"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-lg border border-[#27272a] hover:border-zinc-700 bg-[#121215] transition-colors"
              title="Buka status page publik di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Status Page</span>
            </Link>
            {isIncidentActive ? (
              <Link
                href="/admin/incidents/new"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Insiden</span>
              </Link>
            ) : (
              <Link
                href="/admin/monitors/new"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Monitor</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-[1200px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
