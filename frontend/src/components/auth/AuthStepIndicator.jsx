import { motion, useReducedMotion } from 'framer-motion';

const STEPS = [
  { id: 'user_type', label: 'Role' },
  { id: 'auth', label: 'Sign in' },
  { id: 'done', label: 'Dashboard' },
];

function getActiveIndex(step) {
  if (step === 'user_type') return 0;
  if (step === 'login' || step === 'signup') return 1;
  return 2;
}

export default function AuthStepIndicator({ step }) {
  const active = getActiveIndex(step);
  const reduce = useReducedMotion();

  return (
    <nav aria-label="Sign-in progress" className="mb-8 flex items-center justify-center gap-2">
      {STEPS.map((s, i) => {
        const isActive = i === active;
        const isComplete = i < active;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : isComplete
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-500'
                }`}
                animate={reduce || !isActive ? {} : { scale: [1, 1.08, 1] }}
                transition={reduce ? {} : { duration: 2, repeat: Infinity }}
              >
                {i + 1}
              </motion.div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  isActive ? 'text-indigo-700' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-8 rounded-full sm:w-12 ${
                  i < active ? 'bg-indigo-400' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
