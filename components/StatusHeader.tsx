import React from "react";
import Link from "next/link";
import { Activity, RefreshCw, Shield } from "lucide-react";

interface StatusHeaderProps {
  updatedAtText?: string;
}

export function StatusHeader({ updatedAtText = "Updated recently" }: StatusHeaderProps) {
  return (
    <header className="border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex justify-between items-center w-full px-4 sm:px-6 max-w-5xl mx-auto h-16">
        {/* Brand logo + StatusBoard + Live Badge */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-zinc-100">
              StatusBoard
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </Link>

        {/* Right Info: Updated recently + Admin Portal Link */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden xs:flex items-center gap-1.5 text-xs font-mono text-zinc-500">
            <RefreshCw className="w-3 h-3 text-zinc-600 animate-[spin_10s_linear_infinite]" />
            <span>{updatedAtText}</span>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-850 transition-all shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
