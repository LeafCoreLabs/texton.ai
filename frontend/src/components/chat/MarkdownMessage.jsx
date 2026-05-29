import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownMessage = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    className="chat-prose-markdown max-w-none text-[15px] leading-relaxed text-slate-700"
    components={{
      h1: ({ children }) => (
        <h1 className="mb-3 mt-4 text-xl font-bold text-slate-900 first:mt-0">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="mb-2 mt-4 text-lg font-bold text-slate-900 first:mt-0">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-2 mt-3 text-base font-semibold text-slate-800">{children}</h3>
      ),
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
      li: ({ children }) => <li className="text-slate-700">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
      code: ({ inline, children }) =>
        inline ? (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-indigo-800">
            {children}
          </code>
        ) : (
          <code className="block overflow-x-auto rounded-lg bg-slate-100 p-3 font-mono text-sm text-slate-800">
            {children}
          </code>
        ),
      pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg bg-slate-100 p-3">{children}</pre>,
      blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-4 border-indigo-200 pl-4 italic text-slate-600">
          {children}
        </blockquote>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

export default MarkdownMessage;
