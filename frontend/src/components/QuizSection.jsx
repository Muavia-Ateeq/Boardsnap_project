import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Sparkles, BookOpen, ChevronRight, Eye } from 'lucide-react';

export function QuizSection({ quiz, onRegenerateQuiz, isRegenerating }) {
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});

  if (!quiz || quiz.length === 0) return null;

  const handleSelectOption = (qId, optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    // Auto-reveal explanation when an option is chosen
    setRevealedAnswers(prev => ({ ...prev, [qId]: true }));
  };

  const toggleReveal = (qId) => {
    setRevealedAnswers(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const toggleFlip = (qId) => {
    setFlippedCards(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Compute Score
  const score = quiz.reduce((acc, item) => {
    if (userAnswers[item.id] !== undefined && userAnswers[item.id] === item.correctIndex) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Active Recall & Quiz</h3>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Study Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generated practice questions to test retention directly from the whiteboard content.
          </p>
        </div>

        {/* Actions & Score */}
        <div className="flex items-center gap-3">
          {answeredCount > 0 && !isFlashcardMode && (
            <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              Score: <span className="text-emerald-600">{score}</span> / {quiz.length}
            </div>
          )}

          <button
            onClick={() => setIsFlashcardMode(!isFlashcardMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              isFlashcardMode
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isFlashcardMode ? 'Standard Quiz' : 'Flashcard Mode'}</span>
          </button>

          <button
            onClick={onRegenerateQuiz}
            disabled={isRegenerating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Multiple-Choice Quiz */}
      {!isFlashcardMode ? (
        <div className="space-y-6">
          {quiz.map((item, idx) => {
            const chosen = userAnswers[item.id];
            const isRevealed = revealedAnswers[item.id];
            const hasOptions = item.options && item.options.length > 0;

            return (
              <div key={item.id || idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 leading-snug">{item.q}</h5>
                  </div>
                  <button
                    onClick={() => toggleReveal(item.id)}
                    className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 shrink-0 font-medium px-2 py-1 rounded hover:bg-slate-100"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
                  </button>
                </div>

                {/* Multiple Choice Options */}
                {hasOptions && (
                  <div className="space-y-2 mt-3 ml-8">
                    {item.options.map((opt, optIdx) => {
                      const isSelected = chosen === optIdx;
                      const isCorrect = item.correctIndex !== undefined && optIdx === item.correctIndex;
                      
                      let optClass = 'border-slate-200 bg-white hover:border-slate-300 text-slate-700';
                      if (isRevealed) {
                        if (isCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                        } else if (isSelected && !isCorrect) {
                          optClass = 'border-rose-400 bg-rose-50 text-rose-900';
                        }
                      } else if (isSelected) {
                        optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(item.id, optIdx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${optClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {isRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Answer Explanation Box */}
                {isRevealed && (
                  <div className="mt-3 ml-8 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 animate-fadeIn">
                    <div className="font-bold mb-0.5 flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Explanation:</span>
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
                className="cursor-pointer min-h-[160px] p-5 rounded-xl border border-slate-200 bg-slate-50/60 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <span>Card #{idx + 1}</span>
                    <span className="text-emerald-600 font-bold">Click to {isFlipped ? 'see question' : 'flip answer'}</span>
                  </div>
                  {isFlipped ? (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1">Answer</div>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">{item.a}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Question</div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">{item.q}</p>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 text-right mt-3 font-mono">
                  {isFlipped ? "Showing Answer" : "Showing Prompt"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
