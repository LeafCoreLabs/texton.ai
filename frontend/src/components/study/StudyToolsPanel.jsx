import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, GraduationCap } from 'lucide-react';
import { STUDY_TOOLS, INTEGRITY_NOTICE } from '../../utils/studyPrompts';
import { usePanelMotion } from '../../utils/panelMotion';

const StudyToolsPanel = ({
  open,
  onClose,
  onRunTool,
  runningTool,
  documentName,
  packName,
  disabled,
}) => {
  const { sidePanel, spring } = usePanelMotion();

  const contextLabel = packName
    ? `Study pack: ${packName}`
    : documentName
      ? `Document: ${documentName}`
      : 'Upload or select a processed document first';

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      key="study-tools"
      initial={sidePanel.initial}
      animate={sidePanel.animate}
      exit={sidePanel.exit}
      transition={spring}
      className="chat-side-panel"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800">Study Tools</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="border-b border-slate-50 px-4 py-2 text-xs text-slate-500">{contextLabel}</p>

      <div className="flex-1 space-y-2 overflow-y-auto p-4 chat-scrollbar-light">
        {STUDY_TOOLS.map(tool => {
          const Icon = tool.icon;
          const isRunning = runningTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              disabled={disabled || (runningTool && !isRunning)}
              onClick={() => onRunTool(tool.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left transition-all duration-200 ease-out hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">{tool.label}</span>
                <span className="block text-xs text-slate-500">{tool.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="border-t border-slate-100 px-4 py-3 text-[10px] leading-relaxed text-slate-400">
        {INTEGRITY_NOTICE}
      </p>
    </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudyToolsPanel;
