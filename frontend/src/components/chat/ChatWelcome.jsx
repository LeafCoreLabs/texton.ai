import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, GraduationCap } from 'lucide-react';
import { DOC_SUGGESTIONS, GENERAL_SUGGESTIONS, STUDENT_TAGLINE, INTEGRITY_NOTICE } from '../../utils/studyPrompts';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const ChatWelcome = ({ mode, documentName, onSuggestionClick, reduceMotion }) => {
  const isGeneral = mode === 'general';
  const suggestions = isGeneral ? GENERAL_SUGGESTIONS : DOC_SUGGESTIONS;
  const canSuggest = isGeneral || documentName;

  const title = isGeneral
    ? 'Exam season? Let\'s study smarter.'
    : documentName
      ? `Revise ${documentName}`
      : 'Your study workspace';

  const subtitle = isGeneral
    ? 'Plan revision, ask doubts, or upload notes & textbooks for AI-powered exam prep.'
    : documentName
      ? 'Use Study Tools for notes, flashcards & quizzes — or pick a prompt below.'
      : 'Upload materials or open a study pack from the sidebar.';

  return (
    <div className="chat-welcome relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 md:px-8 md:py-14">
      <div className="chat-welcome-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="chat-welcome-orb chat-welcome-orb-1 pointer-events-none absolute" aria-hidden />
      <div className="chat-welcome-orb chat-welcome-orb-2 pointer-events-none absolute" aria-hidden />
      <div className="chat-welcome-orb chat-welcome-orb-3 pointer-events-none absolute" aria-hidden />

      <motion.div
        className="relative z-10 flex w-full max-w-3xl flex-col items-center"
        variants={reduceMotion ? undefined : containerVariants}
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? false : 'show'}
      >
        <motion.div variants={reduceMotion ? undefined : itemVariants} className="relative mb-8">
          <div className="chat-welcome-glow absolute inset-0 scale-150 rounded-full blur-2xl" />
          <motion.div
            className="relative flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-2xl shadow-indigo-500/40"
            animate={reduceMotion ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GraduationCap className="h-9 w-9 text-white" strokeWidth={1.75} />
          </motion.div>
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : itemVariants} className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500/90">
            Texton.ai · {STUDENT_TAGLINE}
          </p>
          <h2 className="chat-welcome-title text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-500">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          variants={reduceMotion ? undefined : itemVariants}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="chat-welcome-pill">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Notes & flashcards
          </span>
          <span className="chat-welcome-pill">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
            Exam prep
          </span>
        </motion.div>

        {canSuggest ? (
          <motion.div variants={reduceMotion ? undefined : itemVariants} className="mt-10 w-full">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
              Try asking
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestions.map(({ icon: Icon, label, text }, i) => (
                <motion.button
                  key={text}
                  type="button"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.2 + i * 0.05 }}
                  whileHover={reduceMotion ? {} : { y: -3 }}
                  onClick={() => onSuggestionClick(text)}
                  className="chat-welcome-card group text-left"
                >
                  <span className="chat-welcome-card-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-indigo-600/80">
                      {label}
                    </span>
                    <span className="block text-sm leading-snug text-slate-700">{text}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-indigo-500" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={reduceMotion ? undefined : itemVariants}
            className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 py-10 text-center"
          >
            <p className="text-sm font-medium text-slate-600">Upload a syllabus, slides, or textbook</p>
            <p className="mt-1 text-xs text-slate-400">Use the paperclip or Manage documents in the sidebar</p>
          </motion.div>
        )}

        <motion.p
          variants={reduceMotion ? undefined : itemVariants}
          className="mt-8 max-w-md text-center text-[10px] leading-relaxed text-slate-400"
        >
          {INTEGRITY_NOTICE}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ChatWelcome;
