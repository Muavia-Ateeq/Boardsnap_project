import React from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Eye, Network, Cpu, FileText, HelpCircle, ShieldCheck } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: 1,
    title: "1. Perspective Rectification",
    owner: "OpenCV (Muavia)",
    icon: Eye,
    detail: "4-corner quad detection, warpPerspective to 1080p, specular glare attenuation."
  },
  {
    step: 2,
    title: "2. Quality Gate Evaluation",
    owner: "Agent Evaluator (Ammar)",
    icon: ShieldCheck,
    detail: "Sharpness variance & contrast ratio check. Halts early if image is unreadable."
  },
  {
    step: 3,
    title: "3. Region & Shape Detection",
    owner: "PyTorch YOLO (Muavia)",
    icon: Cpu,
    detail: "Bounding boxes for text blocks, boxes, circles, arrows, and tables."
  },
  {
    step: 4,
    title: "4. Handwriting OCR",
    owner: "TrOCR + Lexicon (Muavia & Awais)",
    icon: FileText,
    detail: "Extract handwritten tokens per region with contextual dictionary correction."
  },
  {
    step: 5,
    title: "5. Diagram Graph Builder",
    owner: "Spatial Builder (Muavia)",
    icon: Network,
    detail: "Links arrow endpoints to shapes -> builds AST -> outputs Mermaid flowchart."
  },
  {
    step: 6,
    title: "6. Grounded Notes & Quiz",
    owner: "Grounded LLM (Awais)",
    icon: HelpCircle,
    detail: "Strictly grounded summary, definitions, action items & recall quiz."
  }
];

export function ProcessingPipeline({ progress }) {
  const currentStep = progress?.currentStep || 1;
  const totalSteps = PIPELINE_STEPS.length;
  const percent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="retro-card p-6 mb-8 bg-cream-100 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-banana-400 border border-ink animate-ping" />
            <h3 className="text-xl font-extrabold text-ink font-mono">Autonomous Pipeline Running</h3>
          </div>
          <p className="text-xs text-ink-muted font-medium mt-0.5">
            Running 6-stage Computer Vision & Agentic pipeline on whiteboard image...
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono font-extrabold text-ink bg-banana-300 px-2 py-0.5 rounded border border-ink shadow-retro-sm">
              {percent}% COMPLETED
            </div>
            <div className="text-[11px] font-mono text-ink-muted mt-1 font-bold">Step {currentStep} of {totalSteps}</div>
          </div>
        </div>
      </div>

      {/* Retro Striped Progress Bar */}
      <div className="w-full bg-white h-3.5 rounded-full border-2 border-ink overflow-hidden mb-6 p-0.5 shadow-retro-sm">
        <div
          className="bg-banana-400 h-full rounded-full border-r-2 border-ink transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PIPELINE_STEPS.map((s) => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const Icon = s.icon;

          return (
            <div
              key={s.step}
              className={`p-3.5 rounded-xl border-2 text-xs transition-all ${
                isCurrent
                  ? 'bg-banana-300 border-ink shadow-retro-sm scale-[1.01]'
                  : isDone
                  ? 'bg-white border-ink text-ink shadow-retro-sm'
                  : 'bg-white/60 border-ink/30 text-ink-muted'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <div className={`p-1 rounded-md border border-ink ${isCurrent ? 'bg-white' : isDone ? 'bg-banana-200' : 'bg-slate-100'}`}>
                    <Icon className="w-3.5 h-3.5 text-ink" />
                  </div>
                  <span className={isCurrent ? 'text-ink font-extrabold' : isDone ? 'text-ink' : 'text-ink/50'}>
                    {s.title}
                  </span>
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-vine-500 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-ink animate-spin shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-ink/40 flex items-center justify-center text-[9px] text-ink/40 font-mono shrink-0">
                    {s.step}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed font-medium mb-1">
                {s.detail}
              </p>
              <div className="text-[10px] font-mono font-bold text-ink/70">
                Layer: {s.owner}
              </div>
            </div>
          );
        })}
      </div>

      {/* Retro Status Bar */}
      {progress?.stepInfo && (
        <div className="mt-4 p-2.5 rounded-lg bg-white border-2 border-ink font-mono text-[11px] text-ink flex items-center gap-2 shadow-retro-sm">
          <span className="font-bold text-banana-500">&gt;&gt;</span>
          <span className="font-semibold">{progress.stepInfo.detail}</span>
        </div>
      )}
    </div>
  );
}
