"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 fixed left-0 top-0 h-screen flex-col border-r border-[#24292E] bg-[#0F0F0F] z-50 py-8">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-semibold text-[#606AF0]">StatusBoard</h1>
          <p className="text-[10px] tracking-[0.2em] font-bold text-[#6A737D] mt-1 uppercase">
            ADMIN PANEL
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isMonitorActive
                ? "text-[#606AF0] font-bold bg-[#2a2a2a]"
                : "text-[#c6c5d7] hover:bg-[#1c1b1b]"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 10h2"/><path d="M15 10h2"/></svg>
            <span className="text-sm font-semibold tracking-wider uppercase">Monitor</span>
          </Link>
          <Link
            href="/admin/incidents"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isIncidentActive
                ? "text-[#606AF0] font-bold bg-[#2a2a2a]"
                : "text-[#c6c5d7] hover:bg-[#1c1b1b]"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <span className="text-sm font-semibold tracking-wider uppercase">Insiden</span>
          </Link>
        </nav>

        <div className="px-4 mt-auto border-t border-[#24292E] pt-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#c6c5d7] hover:text-[#E11D48] hover:bg-[#E11D48]/5 transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            <span className="text-sm font-semibold tracking-wider uppercase">
              {loggingOut ? "..." : "Keluar"}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F0F0F] flex flex-col p-6 md:hidden">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold text-[#606AF0]">StatusBoard</h1>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#c6c5d7] p-2"
              aria-label="Tutup menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <nav className="flex-1 space-y-4">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                isMonitorActive ? "text-[#606AF0] font-bold bg-[#2a2a2a]" : "text-[#c6c5d7]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
              <span className="text-sm font-semibold tracking-wider uppercase">Monitor</span>
            </Link>
            <Link
              href="/admin/incidents"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                isIncidentActive ? "text-[#606AF0] font-bold bg-[#2a2a2a]" : "text-[#c6c5d7]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span className="text-sm font-semibold tracking-wider uppercase">Insiden</span>
            </Link>
          </nav>
          <div className="border-t border-[#24292E] pt-4 mt-auto">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#c6c5d7] hover:text-[#E11D48] hover:bg-[#E11D48]/5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              <span className="text-sm font-semibold tracking-wider uppercase">{loggingOut ? "..." : "Keluar"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 border-b border-[#24292E] bg-[#0F0F0F] flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-[#c6c5d7] p-1 -ml-1 hover:text-[#bec2ff] transition-colors"
              aria-label="Buka menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 className="text-2xl font-semibold text-[#e5e2e1]">
              {isIncidentActive ? "Insiden" : "Monitor"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {isIncidentActive ? (
              <Link
                href="/admin/incidents/new"
                className="bg-[#606AF0] hover:bg-[#5059d0] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                + Buat Insiden
              </Link>
            ) : (
              <Link
                href="/admin/monitors/new"
                className="bg-[#606AF0] hover:bg-[#5059d0] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                + Tambah Monitor
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-[1200px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
