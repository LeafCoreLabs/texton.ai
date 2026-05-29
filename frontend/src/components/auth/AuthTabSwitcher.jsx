import { motion, useReducedMotion } from 'framer-motion';

function TabButton({ active, onClick, children, layoutId }) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex-1 rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
        active ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {active && !reduce && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg bg-white shadow-sm"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {active && reduce && (
        <span className="absolute inset-0 rounded-lg bg-white shadow-sm" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export default function AuthTabSwitcher({ activeTab, onLogin, onSignup, showSignup = true }) {
  const isLogin = activeTab === 'login';

  return (
    <div
      className={`relative mb-6 flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 ${
        showSignup ? '' : 'max-w-xs'
      }`}
      role="tablist"
    >
      <TabButton active={isLogin} onClick={onLogin} layoutId="auth-tab-pill">
        Sign in
      </TabButton>
      {showSignup && (
        <TabButton active={!isLogin} onClick={onSignup} layoutId="auth-tab-pill">
          Sign up
        </TabButton>
      )}
    </div>
  );
}
