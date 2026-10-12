import React from 'react';
import { Camera, Sparkles, BarChart2, ShieldCheck } from 'lucide-react';

export function Navbar({ onOpenEvaluation, isBackendConnected, currentBoard, onSelectSample }) {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFBF0]/95 backdrop-blur-md border-b-2 border-ink shadow-retro-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Retro Banana Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-banana-400 border-2 border-ink flex items-center justify-center text-ink shadow-retro-sm font-bold text-lg select-none">
            🍌
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-ink font-mono">BoardSnap</span>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-banana-400 text-ink border-[1.5px] border-ink shadow-retro-sm">
                Banana Hacks '26
              </span>
            </div>
            <p className="text-xs text-ink-muted hidden sm:block font-medium">
              Snap a whiteboard. Get clean notes, redrawn diagram, and a quiz.
            </p>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          {/* Live vs Mock Mode Badge */}
          <div 
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border-[1.5px] border-ink shadow-retro-sm ${
              isBackendConnected 
                ? 'bg-vine-100 text-vine-600' 
                : 'bg-banana-200 text-ink'
            }`}
          >
            <span className={`w-2 h-2 rounded-full border border-ink ${isBackendConnected ? 'bg-vine-500 animate-pulse' : 'bg-banana-500'}`} />
            <span>{isBackendConnected ? 'API: LIVE' : 'API: DEMO MODE'}</span>
          </div>

          {/* Benchmark / Evaluation Modal Button */}
          <button
            onClick={onOpenEvaluation}
            className="retro-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-banana-100 text-ink cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-ink" />
            <span className="hidden sm:inline">How It Works</span>
            <span className="sm:hidden">Project Info</span>
          </button>

          {/* Team Tag */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-ink bg-banana-100 px-2.5 py-1 rounded-lg border-[1.5px] border-ink shadow-retro-sm">
            <span className="font-bold">Team:</span> Ammar, Muavia, Moyeon, Awais
          </div>
        </div>
      </div>
    </header>
  );
}
