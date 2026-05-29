import { motion, useReducedMotion } from 'framer-motion';
import { Check, Shield, Users } from 'lucide-react';
import { useAuthMotion } from './authMotion';

export const ROLE_OPTIONS = [
  {
    type: 'General User',
    icon: Users,
    title: 'General User',
    description: 'Upload documents and chat with AI about your files',
  },
  {
    type: 'Admin',
    icon: Shield,
    title: 'Admin',
    description: 'Access the admin dashboard with elevated permissions',
  },
];

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AuthRoleSelect({ userType, onSelect, onContinue, message }) {
  const { reduce, hover, tap } = useAuthMotion();

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900">Access portal</h3>
      <p className="mt-1 text-sm text-slate-500">Select how you want to sign in</p>
      {message}
      <motion.div
        className="mt-6 space-y-3"
        variants={reduce ? {} : listVariants}
        initial={reduce ? false : 'hidden'}
        animate={reduce ? false : 'show'}
      >
        {ROLE_OPTIONS.map(({ type, icon: Icon, title, description }) => {
          const selected = userType === type;
          return (
            <motion.button
              key={type}
              type="button"
              aria-pressed={selected}
              variants={reduce ? {} : itemVariants}
              whileHover={hover}
              whileTap={tap}
              onClick={() => onSelect(type)}
              className={`relative flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-colors duration-200 ${
                selected
                  ? 'border-indigo-500 bg-indigo-50/90 shadow-lg shadow-indigo-500/15 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80'
              }`}
            >
              {selected && (
                <motion.span
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"
                >
                  <Check className="h-4 w-4" />
                </motion.span>
              )}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  selected
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="pr-8">
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
      <motion.button
        type="button"
        onClick={onContinue}
        disabled={!userType}
        className="auth-btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-50"
        animate={
          reduce || !userType
            ? {}
            : { scale: [1, 1.02, 1] }
        }
        transition={
          reduce || !userType
            ? {}
            : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        Continue
      </motion.button>
    </div>
  );
}
