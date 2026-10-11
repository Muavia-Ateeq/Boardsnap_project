import React, { useState } from 'react';
import { Layers, Eye, Sliders, CheckCircle, Crosshair, Sparkles, Maximize2 } from 'lucide-react';

export function ImageComparison({ board }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('sideBySide');
  const [showRegions, setShowRegions] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  if (!board) return null;

  const regions = board.regions || [];

  return (
    <div className="retro-card p-6 mb-8 bg-white">
      {/* Header with Retro Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b-2 border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-ink font-mono">Whiteboard Cleanup & AI Regions</h3>
            <span className="text-xs bg-banana-300 text-ink font-mono font-bold px-2.5 py-0.5 rounded-md border border-ink shadow-retro-sm">
              OpenCV + PyTorch
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 font-medium">
            Skewed raw camera photo vs. perspective-corrected, glare-filtered output with recognized regions.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Regions */}
          <button
            onClick={() => setShowRegions(!showRegions)}
            className={`retro-btn px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer ${
              showRegions
                ? 'bg-banana-400 text-ink'
                : 'bg-white text-ink hover:bg-cream-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-ink" />
            <span>{showRegions ? 'Hide AI Boxes' : 'Show AI Boxes'}</span>
            <span className="text-[10px] bg-white px-1 rounded border border-ink ml-0.5">{regions.length}</span>
          </button>

          {/* Toggle View Mode */}
          <div className="flex bg-cream-200 p-0.5 rounded-lg border-2 border-ink text-xs font-mono font-bold">
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'sideBySide' ? 'bg-white shadow-retro-sm text-ink border border-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'slider' ? 'bg-white shadow-retro-sm text-ink border border-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Slider
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      {board.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-cream-100 p-3 rounded-xl border-2 border-ink text-xs font-mono shadow-retro-sm">
          <div>
            <div className="text-[10px] text-ink-muted uppercase font-bold">Perspective Skew</div>
            <div className="font-extrabold text-ink">{board.metrics.perspectiveCorrection}</div>
          </div>
          <div>
            <div className="text-[10px] text-ink-muted uppercase font-bold">Contrast Boost</div>
            <div className="font-extrabold text-vine-600">{board.metrics.contrastBoost}</div>
          </div>
          <div>
            <div className="text-[10px] text-ink-muted uppercase font-bold">Specular Filter</div>
            <div className="font-extrabold text-ink">{board.metrics.glareSuppressed}</div>
          </div>
          <div>
            <div className="text-[10px] text-ink-muted uppercase font-bold">Handwriting Recall</div>
            <div className="font-extrabold text-ink">{board.metrics.textConfidence}</div>
          </div>
        </div>
      )}

      {/* Image Display Area */}
      {viewMode === 'sideBySide' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Raw Skewed Image */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5 font-mono font-bold">
              <span>Raw Capture (Skewed & Glare)</span>
              <span className="text-[10px] bg-slate-200 text-ink px-1.5 py-0.2 rounded border border-ink">RAW</span>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border-2 border-ink shadow-retro-sm group">
              <img
                src={board.rawImageUrl}
                alt="Raw Whiteboard"
                className="w-full h-full object-cover filter contrast-90 brightness-95"
              />
              <div className="absolute top-2 left-2 bg-ink/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                Raw Photo
              </div>
            </div>
          </div>

          {/* 2. Cleaned & Rectified Image with Region Bounding Boxes */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs text-ink mb-1.5 font-mono font-bold">
              <span className="flex items-center gap-1">
                <span>Cleaned + Rectified + AI Boxes</span>
              </span>
              <span className="text-[10px] bg-banana-300 text-ink px-1.5 py-0.2 rounded border border-ink">
                Q: {(board.quality * 100).toFixed(0)}%
              </span>
            </div>

            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border-2 border-ink shadow-retro-sm group">
              <img
                src={board.cleanImageUrl || board.rawImageUrl}
                alt="Clean Whiteboard"
                className="w-full h-full object-cover filter contrast-125 brightness-105"
              />

              {/* Bounding Box Overlays */}
              {showRegions && regions.map((region) => {
                const [x, y, w, h] = region.box;
                const isHovered = hoveredRegion?.id === region.id;

                let borderColor = 'border-banana-400 bg-banana-400/20';
                let tagColor = 'bg-banana-400 text-ink';
                if (region.type === 'box') {
                  borderColor = 'border-cyan-400 bg-cyan-400/20';
                  tagColor = 'bg-cyan-400 text-ink';
                } else if (region.type === 'arrow') {
                  borderColor = 'border-emerald-400 bg-emerald-400/25';
                  tagColor = 'bg-emerald-400 text-ink';
                }

                return (
                  <div
                    key={region.id}
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                    }}
                    className={`absolute border-2 rounded transition-all cursor-pointer ${borderColor} ${
                      isHovered ? 'ring-2 ring-white scale-[1.02] z-20 shadow-lg' : 'z-10'
                    }`}
                  >
                    <span className={`absolute -top-3.5 left-0 text-[9px] font-mono font-bold px-1 py-0.2 rounded border border-ink shadow-retro-sm ${tagColor}`}>
                      {region.type}: {region.label || region.type}
                    </span>
                  </div>
                );
              })}

              {/* Hover Tooltip Details */}
              {hoveredRegion && (
                <div className="absolute bottom-2 left-2 right-2 bg-white text-ink p-2.5 rounded-lg text-xs z-30 border-2 border-ink shadow-retro-sm flex items-center justify-between font-mono">
                  <div>
                    <span className="bg-banana-300 text-ink px-1 rounded text-[10px] font-bold mr-2 border border-ink">
                      {hoveredRegion.type.toUpperCase()}
                    </span>
                    <span className="font-bold">{hoveredRegion.text || hoveredRegion.label}</span>
                  </div>
                  <div className="text-[10px] text-ink-muted">
                    Conf: {(hoveredRegion.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Slider View */
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border-2 border-ink select-none shadow-retro-sm">
          <img
            src={board.cleanImageUrl || board.rawImageUrl}
            alt="Clean"
            className="absolute inset-0 w-full h-full object-cover filter contrast-125 brightness-105"
          />

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={board.rawImageUrl}
              alt="Raw"
              className="absolute inset-0 w-full h-full object-cover filter contrast-90 brightness-95 max-w-none"
              style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute top-3 left-3 bg-white text-ink font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-ink shadow-retro-sm">
              Raw Capture
            </div>
          </div>

          <div className="absolute top-3 right-3 bg-banana-300 text-ink font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-ink shadow-retro-sm">
            Cleaned & Contrast Boosted
          </div>

          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-7 h-7 rounded-full bg-banana-400 border-2 border-ink shadow-retro-sm flex items-center justify-center text-ink font-bold">
              <Sliders className="w-3.5 h-3.5 rotate-90" />
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
          />
        </div>
      )}

      {/* Legend */}
      {showRegions && regions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink font-mono pt-3 border-t-2 border-ink/10">
          <span className="font-bold">Detected Classes:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-cyan-400 border border-ink" />
            <span className="text-[11px]">Boxes & Shapes</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-banana-400 border border-ink" />
            <span className="text-[11px]">Handwriting Blocks</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-400 border border-ink" />
            <span className="text-[11px]">Directed Arrows</span>
          </span>
        </div>
      )}
    </div>
  );
}
