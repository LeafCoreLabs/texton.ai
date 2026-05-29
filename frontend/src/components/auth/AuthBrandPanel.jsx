import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bot, FileText, Layers, Calendar, Sparkles } from 'lucide-react';
import AuthAnimatedBackground from './AuthAnimatedBackground';

const FEATURES = [
  { icon: FileText, label: 'Syllabus & notes', desc: 'Upload PDFs and slides for exam-ready RAG' },
  { icon: Layers, label: 'Flashcards & quizzes', desc: 'Active recall with spaced repetition' },
  { icon: Calendar, label: 'Exam countdown', desc: 'Track topics and revision plans' },
];

const stepHeadlines = {
  user_type: 'Choose how you want to sign in',
  login: 'Welcome back',
  signup: 'Create your account',
};

const featureList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const featureItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
};

export default function AuthBrandPanel({ userType, step }) {
  const reduce = useReducedMotion();

  const portalLabel =
    userType === 'Admin'
      ? 'Admin portal — manage and oversee document intelligence'
      : userType === 'General User'
        ? 'User portal — upload, process, and chat with your documents'
        : 'AI-powered document intelligence for everyone';

  const stepLine = stepHeadlines[step] || stepHeadlines.user_type;
  const headlineKey = `${step}-${userType ?? 'none'}`;

  return (
    <aside className="auth-mesh-bg relative flex flex-col justify-between overflow-hidden px-6 py-8 text-white lg:min-h-screen lg:px-10 lg:py-12">
      <AuthAnimatedBackground variant="brand" />

      <div className="relative z-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
          className="mb-6 flex items-center gap-2 lg:mb-10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-indigo-100" />
          </div>
          <span className="text-2xl font-bold tracking-tight lg:text-3xl">Texton.ai</span>
        </motion.div>

        <p className="text-sm font-medium text-indigo-100/90 lg:text-base">Talk with your Text</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={headlineKey}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
          >
            <h2 className="mt-3 max-w-sm text-xl font-semibold leading-snug text-white lg:mt-4 lg:text-2xl">
              {stepLine}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-indigo-100/80 lg:text-base">
              {portalLabel}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.ul
        className="relative z-10 mt-8 hidden space-y-4 lg:mt-0 lg:block"
        variants={reduce ? {} : featureList}
        initial={reduce ? false : 'hidden'}
        animate={reduce ? false : 'show'}
      >
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <motion.li
            key={label}
            variants={reduce ? {} : featureItem}
            whileHover={reduce ? {} : { x: 4 }}
            className="flex items-start gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20">
              <Icon className="h-4 w-4 text-indigo-100" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-indigo-100/75">{desc}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <p className="relative z-10 mt-6 text-xs text-indigo-200/70 lg:mt-8">
        Made with care by LeafCore Labs · © 2025
      </p>
    </aside>
  );
}
