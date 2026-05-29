import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, FileText } from 'lucide-react';
import { ACCEPT_ATTRIBUTE, FORMATS_LABEL } from '../../utils/documentFormats';

const ChatComposer = ({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  documentName,
  chatMode = 'general',
  onFileAttach,
  attachUploading = false,
  attachFileName = null,
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !attachUploading && value.trim()) onSubmit(e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileAttach) onFileAttach(file);
    e.target.value = '';
  };

  return (
    <div className="chat-composer-wrap">
      <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-2">
        {documentName && (
          <p className="mb-2 text-center text-xs text-slate-500">
            Chatting about <span className="font-medium text-indigo-600">{documentName}</span>
          </p>
        )}

        {attachUploading && attachFileName && (
          <div className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Processing {attachFileName}…</span>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="chat-composer relative flex items-end gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100 transition focus-within:border-indigo-300 focus-within:ring-indigo-500/20"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPT_ATTRIBUTE}
            onChange={handleFileChange}
            aria-label="Attach document"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || attachUploading}
            className="mb-1.5 ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
            title={`Attach document (${FORMATS_LABEL})`}
          >
            {attachUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || attachUploading}
            placeholder={placeholder}
            className="max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent py-2.5 pl-1 pr-2 text-[15px] text-slate-800 placeholder-slate-400 outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={disabled || attachUploading || !value.trim()}
            className="mb-1 mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          <Paperclip className="mr-0.5 inline h-3 w-3" />
          Attach docs · Enter to send · Shift+Enter new line
          {chatMode === 'document' ? ' · RAG on your file' : ' · or chat generally'}
        </p>
      </div>
    </div>
  );
};

export default ChatComposer;
