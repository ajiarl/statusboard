import React from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle2 } from "lucide-react";

export function StatusFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#09090b] mt-auto">
      <div className="w-full py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
        {/* Left Branding */}
        <div className="flex items-center gap-2">
          <span>Powered by</span>
          <span className="text-zinc-200 font-semibold tracking-tight">StatusBoard</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-400">Self-hosted &amp; Open Source</span>
        </div>

        {/* Right Info: Frequency check + GitHub link */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 font-mono">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Automated HTTP checks executed every 5-15 minutes</span>
          </div>

          <span className="text-zinc-700 hidden sm:inline">·</span>

          <Link
            href="https://github.com/ajiarl/statusboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-400"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
