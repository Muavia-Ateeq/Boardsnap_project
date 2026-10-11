import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Sparkles, BookOpen, Eye } from 'lucide-react';

export function QuizSection({ quiz, onRegenerateQuiz, isRegenerating, error = '' }) {
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});

  if (!quiz) return null;

  const handleSelectOption = (qId, optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    setRevealedAnswers(prev => ({ ...prev, [qId]: true }));
  };

  const toggleReveal = (qId) => {
    setRevealedAnswers(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const toggleFlip = (qId) => {
    setFlippedCards(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const score = quiz.reduce((acc, item) => {
    if (userAnswers[item.id] !== undefined && userAnswers[item.id] === item.correctIndex) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="retro-card p-6 mb-8 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b-2 border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-ink font-mono">Active Recall Quiz & Flashcards</h3>
            <span className="text-xs bg-banana-300 text-ink font-mono font-bold px-2.5 py-0.5 rounded-md border border-ink shadow-retro-sm">
              Study Tool
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 font-medium">
            Auto-generated practice questions to test retention directly from the whiteboard content.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-lg border-2 border-ink bg-red-100 px-3 py-2 text-xs font-bold text-ink">
            {error}
          </p>
        )}

        {/* Actions & Score */}
        <div className="flex items-center gap-3">
          {answeredCount > 0 && !isFlashcardMode && (
            <div className="text-xs font-mono font-extrabold px-3 py-1 rounded-lg bg-banana-300 text-ink border-2 border-ink shadow-retro-sm">
              SCORE: <span className="text-vine-600">{score}</span> / {quiz.length}
            </div>
          )}

          <button
            onClick={() => setIsFlashcardMode(!isFlashcardMode)}
            className={`retro-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
              isFlashcardMode
                ? 'bg-banana-400 text-ink'
                : 'bg-white text-ink hover:bg-cream-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isFlashcardMode ? 'Standard Quiz' : 'Flashcards'}</span>
          </button>

          <button
            onClick={onRegenerateQuiz}
            disabled={isRegenerating}
            className="retro-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white hover:bg-banana-100 text-ink flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Multiple-Choice Quiz */}
      {quiz.length === 0 ? (
        <p className="rounded-lg border-2 border-ink bg-cream-100 px-4 py-5 text-sm font-mono text-ink">
          No quiz questions were generated for this board yet. Use Regenerate to try again.
        </p>
      ) : !isFlashcardMode ? (
        <div className="space-y-6">
          {quiz.map((item, idx) => {
            const chosen = userAnswers[item.id];
            const isRevealed = revealedAnswers[item.id];
            const hasOptions = item.options && item.options.length > 0;

            return (
              <div key={item.id || idx} className="p-4 rounded-xl border-2 border-ink bg-cream-50 shadow-retro-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-md bg-banana-400 border border-ink text-ink font-mono font-bold flex items-center justify-center text-xs shrink-0 shadow-retro-sm">
                      Q{idx + 1}
                    </span>
                    <h5 className="text-sm font-extrabold text-ink font-mono leading-snug">{item.q}</h5>
                  </div>
                  <button
                    onClick={() => toggleReveal(item.id)}
                    className="retro-btn text-xs text-ink font-mono font-bold px-2.5 py-1 rounded-md bg-white hover:bg-banana-100 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>

                {/* Multiple Choice Options */}
                {hasOptions && (
                  <div className="space-y-2 mt-3 ml-9">
                    {item.options.map((opt, optIdx) => {
                      const isSelected = chosen === optIdx;
                      const isCorrect = item.correctIndex !== undefined && optIdx === item.correctIndex;
                      
                      let optClass = 'border-ink/40 bg-white hover:border-ink hover:bg-banana-50 text-ink';
                      if (isRevealed) {
                        if (isCorrect) {
                          optClass = 'border-ink bg-vine-100 text-vine-700 font-bold shadow-retro-sm ring-1 ring-vine-500';
                        } else if (isSelected && !isCorrect) {
                          optClass = 'border-ink bg-rose-100 text-ripe font-bold shadow-retro-sm';
                        }
                      } else if (isSelected) {
                        optClass = 'border-ink bg-banana-300 text-ink font-bold shadow-retro-sm';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(item.id, optIdx)}
                          className={`w-full text-left p-3 rounded-lg border-2 text-xs flex items-center justify-between transition-all cursor-pointer ${optClass}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-md border border-ink bg-cream-100 flex items-center justify-center text-[10px] font-mono font-bold text-ink">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="font-medium">{opt}</span>
                          </div>
                          {isRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-vine-600 shrink-0" />}
                          {isRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-ripe shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Answer Explanation Box */}
                {isRevealed && (
                  <div className="mt-3 ml-9 p-3 rounded-lg bg-banana-100 border-2 border-ink text-xs text-ink shadow-retro-sm font-medium">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-ink font-mono">
                      <span>💡 Explanation:</span>
                    </div>
                    <p className="leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode 2: Flashcards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quiz.map((item, idx) => {
            const isFlipped = flippedCards[item.id];
            return (
              <div
                key={item.id || idx}
                onClick={() => toggleFlip(item.id)}
                className="cursor-pointer min-h-[170px] p-5 rounded-xl border-2 border-ink bg-cream-100 hover:bg-banana-100 shadow-retro-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted mb-2">
                    <span className="font-bold">Card #{idx + 1}</span>
                    <span className="text-ink font-bold bg-white px-2 py-0.5 rounded border border-ink">
                      Click to {isFlipped ? 'flip back' : 'reveal answer'}
                    </span>
                  </div>
                  {isFlipped ? (
                    <div>
                      <div className="text-[10px] uppercase font-mono font-bold text-vine-600 mb-1">Answer</div>
                      <p className="text-xs font-bold text-ink leading-relaxed">{item.a}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] uppercase font-mono font-bold text-ink-muted mb-1">Question</div>
                      <p className="text-xs font-bold text-ink font-mono leading-snug">{item.q}</p>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-ink-muted text-right mt-3 font-mono">
                  {isFlipped ? "Showing Answer 🍌" : "Prompt Front"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
