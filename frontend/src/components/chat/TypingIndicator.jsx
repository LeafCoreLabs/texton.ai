import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator = () => (
  <div className="flex gap-4 bg-slate-50 px-4 py-6 md:px-8">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-600 shadow-sm">
      <Bot className="h-4 w-4" />
    </div>
    <div className="flex flex-col gap-2 pt-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Texton AI</p>
      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <span className="typing-dot" />
        <span className="typing-dot animation-delay-150" />
        <span className="typing-dot animation-delay-300" />
      </div>
    </div>
  </div>
);

export default TypingIndicator;
