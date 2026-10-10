import React from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Eye, Network, Cpu, FileText, HelpCircle, ShieldCheck } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: 1,
    title: "Perspective Rectification & Glare Suppression",
    owner: "OpenCV (Muavia)",
    icon: Eye,
    detail: "4-corner quad detection, warpPerspective to 1920x1080, specular glare attenuation."
  },
  {
    step: 2,
    title: "Quality Gate Evaluation",
    owner: "Agent Evaluator (Ammar)",
    icon: ShieldCheck,
    detail: "Sharpness variance of Laplacian, contrast ratio check (threshold: >0.65)."
  },
  {
    step: 3,
    title: "Region & Shape Detection",
    owner: "PyTorch YOLO/Faster-RCNN (Muavia)",
    icon: Cpu,
    detail: "Bounding box inference on 5 classes: text, box, circle, arrow, table."
  },
  {
    step: 4,
    title: "Handwriting OCR & Context Correction",
    owner: "TrOCR + Grounded Lexical Pass (Muavia & Awais)",
    icon: FileText,
    detail: "Extract handwritten tokens per region and resolve unclear characters via token vocabulary."
  },
  {
    step: 5,
    title: "Graph Construction & Mermaid Synthesis",
    owner: "Spatial Graph Builder (Muavia)",
    icon: Network,
    detail: "Proximity matching between arrow heads/tails and bounding boxes -> AST -> Mermaid flowchart."
  },
  {
    step: 6,
    title: "Structured Notes & Quiz Synthesis",
    owner: "Strict Grounded LLM (Awais)",
    icon: HelpCircle,
    detail: "Zero-hallucination note generation restricted exclusively to detected whiteboard text."
  }
];

export function ProcessingPipeline({ progress }) {
  const currentStep = progress?.currentStep || 1;
  const totalSteps = PIPELINE_STEPS.length;
  const percent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 mb-8 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-lg font-bold text-white">BoardSnap Autonomous Pipeline Running</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Running 6-stage Computer Vision & Agentic Pipeline on input photo...
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-emerald-400 font-bold">{percent}% COMPLETE</div>
            <div className="text-[11px] text-slate-400">Step {currentStep} of {totalSteps}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-6 relative z-10">
        <div
          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
        {PIPELINE_STEPS.map((s) => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const Icon = s.icon;

          return (
            <div
              key={s.step}
              className={`p-3.5 rounded-xl border text-xs transition-all ${
                isCurrent
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : isDone
                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  : 'bg-slate-900/40 border-slate-800/50 text-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <div className={`p-1 rounded-md ${isCurrent ? 'bg-emerald-500 text-slate-950' : isDone ? 'bg-slate-700 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`${isCurrent ? 'text-white font-bold' : isDone ? 'text-slate-200' : 'text-slate-400'}`}>
                    {s.title}
                  </span>
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-500 shrink-0">
                    {s.step}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-1">
                {s.detail}
              </p>
              <div className="text-[10px] font-mono text-slate-500">
                Layer: {s.owner}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal log ticker */}
      {progress?.stepInfo && (
        <div className="mt-4 p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-center gap-2">
          <span className="text-slate-500">&gt;</span>
          <span>{progress.stepInfo.detail}</span>
        </div>
      )}
    </div>
  );
}
