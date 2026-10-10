import React, { useState } from 'react';
import { Layers, Eye, Sliders, CheckCircle, Crosshair, Sparkles, Maximize2 } from 'lucide-react';

export function ImageComparison({ board }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('sideBySide'); // 'sideBySide' | 'slider'
  const [showRegions, setShowRegions] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  if (!board) return null;

  const regions = board.regions || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Whiteboard Cleanup & Region Detection</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              OpenCV + PyTorch
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Original skewed camera capture vs. perspective-corrected, glare-filtered image with detected regions.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Regions */}
          <button
            onClick={() => setShowRegions(!showRegions)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              showRegions
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showRegions ? 'Hide Overlays' : 'Show Regions'}</span>
            <span className="text-[10px] bg-white/70 px-1 rounded font-mono ml-0.5">{regions.length}</span>
          </button>

          {/* Toggle View Mode */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'sideBySide' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'slider' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split Slider
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      {board.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Perspective</div>
            <div className="font-semibold text-slate-800">{board.metrics.perspectiveCorrection}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Contrast Boost</div>
            <div className="font-semibold text-emerald-600">{board.metrics.contrastBoost}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Glare Filter</div>
            <div className="font-semibold text-indigo-600">{board.metrics.glareSuppressed}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">OCR Word Recall</div>
            <div className="font-semibold text-slate-800">{board.metrics.textConfidence}</div>
          </div>
        </div>
      )}

      {/* Image Display Area */}
      {viewMode === 'sideBySide' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Raw Skewed Image */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span>Raw Capture (Skewed & Glare)</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-mono">Original</span>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
              <img
                src={board.rawImageUrl}
                alt="Raw Whiteboard"
                className="w-full h-full object-cover filter contrast-90 brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                Input Image
              </div>
            </div>
          </div>

          {/* 2. Cleaned & Rectified Image with Region Bounding Boxes */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Cleaned + Rectified + AI Boxes
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                Q: {(board.quality * 100).toFixed(0)}%
              </span>
            </div>

            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500/30 shadow-inner group">
              <img
                src={board.cleanImageUrl || board.rawImageUrl}
                alt="Clean Whiteboard"
                className="w-full h-full object-cover filter contrast-125 brightness-105"
              />

              {/* Bounding Box Overlays */}
              {showRegions && regions.map((region) => {
                const [x, y, w, h] = region.box;
                const isHovered = hoveredRegion?.id === region.id;

                let borderColor = 'border-amber-400 bg-amber-400/15 text-amber-900';
                let tagColor = 'bg-amber-400 text-black';
                if (region.type === 'box') {
                  borderColor = 'border-cyan-400 bg-cyan-400/15 text-cyan-900';
                  tagColor = 'bg-cyan-500 text-white';
                } else if (region.type === 'arrow') {
                  borderColor = 'border-emerald-400 bg-emerald-400/20 text-emerald-900';
                  tagColor = 'bg-emerald-500 text-white';
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
                    <span className={`absolute -top-3.5 left-0 text-[9px] font-mono font-bold px-1 py-0.2 rounded shadow-xs ${tagColor}`}>
                      {region.type}: {region.label || region.type}
                    </span>
                  </div>
                );
              })}

              {/* Hover Tooltip Details */}
              {hoveredRegion && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-lg text-xs z-30 border border-slate-700 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono text-emerald-400 text-[10px] uppercase font-bold mr-2">
                      [{hoveredRegion.type}]
                    </span>
                    <span className="font-medium">{hoveredRegion.text || hoveredRegion.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Conf: {(hoveredRegion.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Slider View */
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 select-none shadow-md">
          {/* Base Clean Image */}
          <img
            src={board.cleanImageUrl || board.rawImageUrl}
            alt="Clean"
            className="absolute inset-0 w-full h-full object-cover filter contrast-125 brightness-105"
          />

          {/* Overlaid Raw Image clipped by slider */}
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
            <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
              Raw Skewed Image
            </div>
          </div>

          <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[10px] px-2 py-0.5 rounded font-mono">
            Cleaned & Contrast Boosted
          </div>

          {/* Slider Divider Bar */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize z-20 flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-lg border border-slate-300 flex items-center justify-center text-slate-700">
              <Sliders className="w-3.5 h-3.5 rotate-90" />
            </div>
          </div>

          {/* Invisible interactive range input */}
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
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
          <span className="font-semibold text-slate-700 text-[11px]">Region Classes:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400 border border-cyan-500" />
            <span className="text-[11px]">Bounding Boxes / Shapes</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-500" />
            <span className="text-[11px]">Handwritten Text Blocks</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400 border border-emerald-500" />
            <span className="text-[11px]">Connector Arrows</span>
          </span>
        </div>
      )}
    </div>
  );
}
