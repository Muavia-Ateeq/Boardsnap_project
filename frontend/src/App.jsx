import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadSection } from './components/UploadSection';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { QualityRejectModal } from './components/QualityRejectModal';
import { ImageComparison } from './components/ImageComparison';
import { MermaidDiagram } from './components/MermaidDiagram';
import { StructuredNotes } from './components/StructuredNotes';
import { QuizSection } from './components/QuizSection';
import { RAGChatSection } from './components/RAGChatSection';
import { EvaluationModal } from './components/EvaluationModal';
import { sampleBoards } from './data/sampleBoards';
import { apiService } from './utils/api';
import { Sparkles, BarChart2, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [currentBoard, setCurrentBoard] = useState(sampleBoards[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [processingError, setProcessingError] = useState('');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [isRegeneratingQuiz, setIsRegeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await apiService.checkBackendHealth();
      setIsBackendConnected(healthy);
    };
    checkHealth();
  }, []);

  // Process a board (file or sample ID)
  const handleProcessBoard = async (fileOrId) => {
    setIsProcessing(true);
    setProcessingError('');
    setProgress({ currentStep: 1, totalSteps: 6 });

    try {
      const processed = await apiService.uploadBoard(fileOrId, (stepProgress) => {
        setProgress(stepProgress);
      });
      setCurrentBoard(processed);
    } catch (err) {
      console.error("Processing error:", err);
      setProcessingError(err instanceof Error ? err.message : 'Board processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Regenerate Quiz
  const handleRegenerateQuiz = async () => {
    if (!currentBoard) return;
    setIsRegeneratingQuiz(true);
    setQuizError('');
    try {
      const newQuiz = await apiService.regenerateQuiz(currentBoard.id);
      setCurrentBoard(prev => ({ ...prev, quiz: newQuiz }));
    } catch (err) {
      console.error("Quiz regenerate failed:", err);
      setQuizError(err instanceof Error ? err.message : 'Quiz generation failed.');
    } finally {
      setIsRegeneratingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-ink flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        onOpenEvaluation={() => setIsEvaluationOpen(true)}
        isBackendConnected={isBackendConnected}
        currentBoard={currentBoard}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Upload & Capture Card */}
        <UploadSection
          onProcessBoard={handleProcessBoard}
          isProcessing={isProcessing}
        />

        {/* Live Processing Pipeline Ticker */}
        {isProcessing && (
          <ProcessingPipeline progress={progress} />
        )}

        {processingError && (
          <div role="alert" className="mb-8 rounded-xl border-2 border-ink bg-red-100 px-4 py-3 text-sm font-bold text-ink shadow-retro-sm">
            {processingError}
          </div>
        )}

        {/* Quality Gate Rejection Banner (For dark / glare / blurry photos) */}
        {!isProcessing && currentBoard && !currentBoard.isQualityPass && (
          <QualityRejectModal
            board={currentBoard}
            onRetake={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTryClearSample={() => {
              handleProcessBoard(sampleBoards[0].id);
            }}
          />
        )}

        {/* Result Workspace (when quality passed) */}
        {!isProcessing && currentBoard && currentBoard.isQualityPass && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* 1. Image Cleanup & Region Overlays */}
            <ImageComparison board={currentBoard} />

            {/* 2. Rebuilt Diagram (Mermaid Flowchart) */}
            {currentBoard.diagram && (
              <MermaidDiagram diagram={currentBoard.diagram} />
            )}

            {/* 3. Structured Study Notes (Markdown) */}
            {currentBoard.notes && (
              <StructuredNotes
                notes={currentBoard.notes}
                boardName={currentBoard.name}
              />
            )}

            {/* 4. Active Recall Quiz & Flashcards */}
            {currentBoard.quiz && (
              <QuizSection
                quiz={currentBoard.quiz}
                onRegenerateQuiz={handleRegenerateQuiz}
                isRegenerating={isRegeneratingQuiz}
                error={quizError}
              />
            )}

            {/* 5. RAG Chat over Board */}
            <RAGChatSection
              boardId={currentBoard.id}
              boardName={currentBoard.name}
            />

          </div>
        )}

      </main>

      {/* Evaluation & Metrics Modal */}
      <EvaluationModal
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
      />

      {/* Retro Banana Footer */}
      <footer className="bg-[#FFFBF0] border-t-2 border-ink py-6 mt-12 shadow-retro-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base">🍌 BoardSnap</span>
            <span>&bull;</span>
            <span className="bg-banana-300 px-2 py-0.5 rounded border border-ink font-bold">Banana Hacks 2026</span>
          </div>
          <div>
            Built with 💛 by <strong className="font-extrabold">Ammar, Muavia, Moyeon &amp; Awais</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEvaluationOpen(true)}
              className="retro-btn bg-white hover:bg-banana-200 px-3 py-1 rounded text-ink font-bold cursor-pointer"
            >
              40-Photo Evaluation Table
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
