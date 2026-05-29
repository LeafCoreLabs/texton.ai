import React from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  FolderOpen,
  Upload,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { STUDENT_TAGLINE, INTEGRITY_NOTICE, GENERAL_SUGGESTIONS, DOC_SUGGESTIONS } from '../../utils/studyPrompts';
import { daysUntilExam, sortExamsByDate } from '../../utils/examUtils';
import { PANEL_FADE } from '../../utils/panelMotion';

const statVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, ...PANEL_FADE } }),
};

function StatCard({ icon: Icon, label, value, sub, accent, onClick }) {
  const inner = (
    <>
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </>
  );
  const className =
    'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md text-left w-full';
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

const StudentHomeDashboard = ({
  mode,
  documentName,
  exams,
  dueReviewCount,
  processedCount,
  activePackName,
  packsCount,
  onSuggestionClick,
  onNewChat,
  onOpenDocuments,
  onOpenStudyTools,
  onOpenStudyHub,
  onStartDueReview,
  reduceMotion,
}) => {
  const isGeneral = mode === 'general';
  const suggestions = isGeneral ? GENERAL_SUGGESTIONS : DOC_SUGGESTIONS;
  const sortedExams = sortExamsByDate(exams).filter(e => {
    const d = daysUntilExam(e.examDate);
    return d === null || d >= 0;
  });
  const nextExam = sortedExams[0];
  const nextDays = nextExam ? daysUntilExam(nextExam.examDate) : null;

  return (
    <div className="relative min-h-full px-4 py-8 md:px-8 md:py-10">
      <div className="chat-welcome-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Texton.ai · {STUDENT_TAGLINE}
          </p>
          <h1 className="chat-welcome-title mt-2 text-2xl font-bold md:text-3xl">
            {isGeneral ? 'Your study command center' : `Revise ${documentName}`}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            {isGeneral
              ? 'Track exams, crush flashcard reviews, and jump into AI-powered revision.'
              : 'Use Study Tools or prompts below — your materials are ready.'}
          </p>
        </div>

        <motion.div
          className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4"
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? false : 'show'}
        >
          <motion.div custom={0} variants={statVariants}>
            <StatCard
              icon={Calendar}
              label="Next exam"
              value={nextDays != null ? `${nextDays}d` : '—'}
              sub={nextExam?.title || 'Add in Study hub'}
              accent="bg-amber-100 text-amber-700"
              onClick={onOpenStudyHub}
            />
          </motion.div>
          <motion.div custom={1} variants={statVariants}>
            <StatCard
              icon={Layers}
              label="Cards due"
              value={dueReviewCount}
              sub="Spaced repetition"
              accent="bg-violet-100 text-violet-700"
              onClick={dueReviewCount > 0 ? onStartDueReview : onOpenStudyTools}
            />
          </motion.div>
          <motion.div custom={2} variants={statVariants}>
            <StatCard
              icon={FileText}
              label="Docs ready"
              value={processedCount}
              sub="For RAG study"
              accent="bg-emerald-100 text-emerald-700"
              onClick={onOpenDocuments}
            />
          </motion.div>
          <motion.div custom={3} variants={statVariants}>
            <StatCard
              icon={FolderOpen}
              label="Study packs"
              value={packsCount}
              sub={activePackName ? activePackName : 'Bundle subjects'}
              accent="bg-indigo-100 text-indigo-700"
              onClick={onOpenStudyHub}
            />
          </motion.div>
        </motion.div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            <Sparkles className="h-4 w-4" /> New chat
          </button>
          <button
            type="button"
            onClick={onOpenDocuments}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200"
          >
            <Upload className="h-4 w-4" /> Upload notes
          </button>
          <button
            type="button"
            onClick={onOpenStudyTools}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200"
          >
            <BookOpen className="h-4 w-4" /> Study tools
          </button>
          <button
            type="button"
            onClick={onOpenStudyHub}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-800 transition hover:bg-indigo-100"
          >
            <GraduationCap className="h-4 w-4" /> Study hub
          </button>
        </div>

        {sortedExams.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Upcoming exams</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {sortedExams.slice(0, 3).map(ex => {
                const d = daysUntilExam(ex.examDate);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={onOpenStudyHub}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-amber-200 hover:shadow-sm"
                  >
                    <p className="truncate text-sm font-semibold text-slate-900">{ex.title}</p>
                    <p className="mt-1 text-xs text-amber-700">
                      {d != null ? `${d} days left` : 'Date TBD'}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {dueReviewCount > 0 && (
          <button
            type="button"
            onClick={onStartDueReview}
            className="mb-8 flex w-full items-center justify-between rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 text-left transition hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-violet-900">{dueReviewCount} flashcards due for review</p>
              <p className="text-xs text-violet-700">Active recall keeps exam content fresh</p>
            </div>
            <ArrowRight className="h-5 w-5 text-violet-600" />
          </button>
        )}

        <section>
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
            Try asking
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.slice(0, 4).map(({ icon: Icon, label, text }) => (
              <button
                key={text}
                type="button"
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
              </button>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-[10px] leading-relaxed text-slate-400">{INTEGRITY_NOTICE}</p>
      </div>
    </div>
  );
};

export default StudentHomeDashboard;
