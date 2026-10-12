import React from 'react';
import { X, Eye, GitBranch, MessageCircle, ShieldCheck } from 'lucide-react';

const implementationDetails = [
  {
    title: 'Image cleanup',
    description: 'OpenCV-based perspective correction, glare inpainting, contrast enhancement, and a sharpness heuristic.',
    icon: Eye,
  },
  {
    title: 'Detection and OCR',
    description: 'Region detection and full-board OCR use configured Roboflow workflows. EasyOCR is the local OCR fallback; no project-trained detector weights are included.',
    icon: ShieldCheck,
  },
  {
    title: 'Diagram reconstruction',
    description: 'A spatial heuristic connects detected shapes and arrows. When full-board OCR text is available, lines are currently drawn as a top-to-bottom sequence.',
    icon: GitBranch,
  },
  {
    title: 'Notes, quiz, and chat',
    description: 'The selected LLM provider generates notes, quiz questions, and answers using the current board content as context. Chat does not currently use vector search.',
    icon: MessageCircle,
  },
];

export function EvaluationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="retro-card max-w-3xl w-full bg-white shadow-retro-xl overflow-hidden my-8 animate-fadeIn">
        <div className="p-5 bg-banana-300 border-b-2 border-ink flex items-center justify-between text-ink">
          <div>
            <h3 className="text-xl font-extrabold font-mono">How BoardSnap Works</h3>
            <p className="text-xs text-ink-muted mt-0.5 font-medium">
              Current implementation and evaluation status
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close project details"
            className="retro-btn w-8 h-8 rounded-lg bg-white hover:bg-rose-100 flex items-center justify-center text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-ink">
          <div role="note" className="rounded-xl border-2 border-ink bg-cream-100 p-4 text-sm leading-relaxed">
            The repository does not currently include a verified end-to-end benchmark dataset or measured accuracy results.
            Sample boards are illustrative demo content, not model evaluation results. Review AI-generated content before relying on it.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {implementationDetails.map(({ title, description, icon: Icon }) => (
              <section key={title} className="rounded-xl border-2 border-ink bg-white p-4 shadow-retro-sm">
                <h4 className="mb-2 flex items-center gap-2 font-mono text-sm font-extrabold">
                  <Icon className="h-4 w-4" />
                  {title}
                </h4>
                <p className="text-xs leading-relaxed text-ink-muted">{description}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="p-4 bg-cream-200 border-t-2 border-ink flex justify-end">
          <button
            onClick={onClose}
            className="retro-btn px-5 py-2 rounded-xl bg-banana-400 hover:bg-banana-500 text-ink font-mono font-extrabold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
