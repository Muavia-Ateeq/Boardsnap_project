import React from 'react';
import { AlertOctagon, Camera, RefreshCcw, HelpCircle, ArrowRight } from 'lucide-react';

export function QualityRejectModal({ board, onRetake, onTryClearSample }) {
  if (!board || board.isQualityPass) return null;

  return (
    <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
            <AlertOctagon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-rose-950">Photo Rejected: Quality Check Failed</h3>
              <span className="text-xs bg-rose-200/80 text-rose-800 font-mono font-bold px-2 py-0.5 rounded-full">
                Score: {(board.quality * 100).toFixed(0)}% (Min: 65%)
              </span>
            </div>
            <p className="text-xs text-rose-700 mt-0.5">
              The autonomous quality gate stopped the pipeline early to prevent low-accuracy hallucinations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRetake}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Camera className="w-4 h-4" />
            <span>Retake Photo</span>
          </button>
          {onTryClearSample && (
            <button
              onClick={onTryClearSample}
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <span>Load Clear Sample</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Failure Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-rose-200">
        <div className="bg-white/80 rounded-xl p-3.5 border border-rose-200 text-xs">
          <div className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
            <span>Diagnostic Failure Reason</span>
          </div>
          <p className="text-rose-800 leading-relaxed font-mono text-[11px]">
            {board.rejectionReason || "Laplacian variance indicates heavy blur or severe camera defocus. Specular reflections from overhead lighting exceed 40% surface area."}
          </p>
          <div className="mt-2 text-[11px] text-rose-600">
            <strong>Metrics:</strong> {board.metrics?.perspectiveCorrection} &bull; {board.metrics?.glareSuppressed}
          </div>
        </div>

        <div className="bg-white/80 rounded-xl p-3.5 border border-rose-200 text-xs">
          <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>How to get a clean scan</span>
          </div>
          <ul className="text-slate-600 space-y-1 text-[11px]">
            <li>&bull; Stand perpendicular to the board to reduce extreme perspective distortion.</li>
            <li>&bull; Turn off camera flash to eliminate specular white glare over marker text.</li>
            <li>&bull; Use bold dark markers (black or blue) for maximum OCR word recall.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
