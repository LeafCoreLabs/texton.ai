import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Calendar, Layers } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your syllabus',
    body: 'Add PDFs, Word docs, or slides so Texton can answer from your real materials.',
  },
  {
    icon: Calendar,
    title: 'Add an exam date',
    body: 'Open Study hub → Exams to track countdown and topic checklists.',
  },
  {
    icon: Layers,
    title: 'Try flashcards',
    body: 'Generate cards from a document, then review with spaced repetition.',
  },
];

const OnboardingModal = ({ open, step, onNext, onSkip, onClose }) => {
  const current = STEPS[step] ?? STEPS[0];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[61] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Icon className="h-6 w-6" />
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{current.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{current.body}</p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600"
              >
                Skip tour
              </button>
              <button
                type="button"
                onClick={onNext}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
              >
                {step < STEPS.length - 1 ? 'Next' : 'Get started'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
