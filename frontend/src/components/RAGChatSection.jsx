import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, Database, ShieldCheck, CornerDownRight } from 'lucide-react';
import { apiService } from '../utils/api';

export function RAGChatSection({ boardId, boardName }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your BoardSnap AI assistant. I've indexed this whiteboard. Ask me anything about components, specs, or decisions!`,
      source: 'Indexed Whiteboard Context'
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
          content: "Sorry, I encountered an error querying the board index.",
          source: "Error"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Ask Your Whiteboard (RAG Chat)</h3>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Database className="w-3 h-3" /> LangChain Vector Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Query meeting notes or classroom lectures. Answers are strictly sourced from board text and nodes.
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            className="text-[11px] px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200 transition flex items-center gap-1"
          >
            <span>&ldquo;{qp}&rdquo;</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/60 space-y-3 max-h-[340px] overflow-y-auto mb-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
              }`}
            >
              <p>{m.content}</p>
              {m.source && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] text-emerald-700 font-mono">
                  <CornerDownRight className="w-3 h-3" />
                  <span>Source: {m.source}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono italic">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Embedding query & retrieving nearest whiteboard chunks...</span>
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
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
