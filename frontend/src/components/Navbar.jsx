import React from 'react';
import { Camera, Sparkles, BarChart2, ShieldCheck } from 'lucide-react';

export function Navbar({ onOpenEvaluation, isBackendConnected, currentBoard, onSelectSample }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Camera className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">BoardSnap</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Banana Hacks 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Snap a whiteboard. Get clean notes, redrawn diagram, and a quiz.
            </p>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          {/* Backend Connection Indicator */}
          <div 
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isBackendConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isBackendConnected ? "Connected to Express + Vision Service" : "Client-side pipeline simulation active"}
          >
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isBackendConnected ? 'Pipeline: Live API' : 'Pipeline: Demo Simulation'}</span>
          </div>

          {/* Evaluation Numbers Modal Button */}
          <button
            onClick={onOpenEvaluation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Benchmark & Evaluation</span>
            <span className="sm:hidden">Metrics</span>
          </button>

          {/* Team Tag */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">Team:</span> Ammar, Muavia, Moyeon, Awais
          </div>
        </div>
      </div>
    </header>
  );
}
