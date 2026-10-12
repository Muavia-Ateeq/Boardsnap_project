import React from 'react';
import { AlertOctagon, Camera, RefreshCcw, HelpCircle, ArrowRight } from 'lucide-react';

export function QualityRejectModal({ board, onRetake, onTryClearSample }) {
  if (!board || board.isQualityPass) return null;

  return (
    <div className="retro-card p-6 mb-8 bg-rose-50 border-2 border-ink">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-ripe text-white border-2 border-ink flex items-center justify-center shrink-0 shadow-retro-sm">
            <AlertOctagon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-ink font-mono">Photo Rejected: Quality Check Failed</h3>
              <span className="text-xs bg-ripe text-white font-mono font-bold px-2 py-0.5 rounded border border-ink shadow-retro-sm">
                Score: {(board.quality * 100).toFixed(0)}% (Min: 40%)
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 font-medium">
              The autonomous quality gate stopped the pipeline early to prevent low-accuracy hallucinations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRetake}
            className="retro-btn px-4 py-2 rounded-xl bg-ripe hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Retake Photo</span>
          </button>
          {onTryClearSample && (
            <button
              onClick={onTryClearSample}
              className="retro-btn px-4 py-2 rounded-xl bg-banana-300 hover:bg-banana-400 text-ink font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Load Clear Sample</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-ink/10">
        <div className="bg-white rounded-xl p-4 border-2 border-ink shadow-retro-sm text-xs font-mono">
          <div className="font-extrabold text-ripe mb-1">
            Diagnostic Failure Reason:
          </div>
          <p className="text-ink leading-relaxed">
            {board.rejectionReason || "Laplacian variance indicates heavy blur or severe camera defocus. Specular reflections from overhead lighting exceed 40% surface area."}
          </p>
          <div className="mt-2 text-[11px] text-ink-muted">
            <strong>Metrics:</strong> {board.metrics?.perspectiveCorrection} &bull; {board.metrics?.glareSuppressed}
          </div>
        </div>

        <div className="bg-cream-100 rounded-xl p-4 border-2 border-ink shadow-retro-sm text-xs">
          <div className="font-bold text-ink mb-1 flex items-center gap-1.5 font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-ink" />
            <span>How to get a clean scan:</span>
          </div>
          <ul className="text-ink-muted space-y-1 text-[11px] font-medium">
            <li>&bull; Stand perpendicular to the board to reduce extreme perspective distortion.</li>
            <li>&bull; Turn off camera flash to eliminate specular white glare over marker text.</li>
            <li>&bull; Use bold dark markers (black or blue) for maximum OCR word recall.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
