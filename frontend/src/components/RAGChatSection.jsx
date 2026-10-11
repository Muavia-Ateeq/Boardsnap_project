import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, Database, ShieldCheck, CornerDownRight } from 'lucide-react';
import { apiService } from '../utils/api';

export function RAGChatSection({ boardId, boardName }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your BoardSnap AI assistant. I've indexed this whiteboard. Ask me anything about components, specs, or decisions!`,
      source: 'Whiteboard OCR & Graph Index'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    "What did we decide about the Dead Letter Queue?",
    "What is the latency SLA requirement?",
    "What are the assigned action items?"
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await apiService.chatWithBoard(boardId, query);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.answer,
          source: result.source
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? `Sorry, ${err.message}` : "Sorry, error querying the board index.",
          source: "Error"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="retro-card p-6 mb-8 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b-2 border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-ink font-mono">Ask Your Whiteboard (RAG Chat)</h3>
            <span className="text-xs bg-banana-300 text-ink font-mono font-bold px-2.5 py-0.5 rounded-md border border-ink shadow-retro-sm">
              Vector RAG Search
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 font-medium">
            Search meeting notes or classroom lectures. Answers are strictly sourced from board text and nodes.
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            className="retro-btn text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg bg-cream-100 hover:bg-banana-200 text-ink cursor-pointer"
          >
            <span>&ldquo;{qp}&rdquo;</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="bg-cream-100 rounded-xl p-4 border-2 border-ink space-y-3 max-h-[340px] overflow-y-auto mb-4 shadow-retro-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed border-2 border-ink ${
                m.role === 'user'
                  ? 'bg-banana-400 text-ink font-semibold shadow-retro-sm'
                  : 'bg-white text-ink shadow-retro-sm'
              }`}
            >
              <p>{m.content}</p>
              {m.source && (
                <div className="mt-2 pt-1.5 border-t border-ink/10 flex items-center gap-1 text-[10px] text-ink font-mono font-bold">
                  <CornerDownRight className="w-3 h-3 text-banana-600" />
                  <span>Source: {m.source}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-ink font-mono italic">
            <span className="w-2 h-2 rounded-full bg-banana-400 border border-ink animate-ping" />
            <span>Searching indexed board vectors...</span>
          </div>
        )}
      </div>

      {/* Query Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about this whiteboard..."
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-ink focus:outline-none focus:bg-banana-50 text-xs font-mono font-medium shadow-retro-sm"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="retro-btn px-5 py-2.5 rounded-xl bg-banana-400 hover:bg-banana-500 text-ink font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
