import { AnimatePresence, motion } from 'framer-motion';
import AuthBrandPanel from './AuthBrandPanel';
import AuthAnimatedBackground from './AuthAnimatedBackground';
import AuthStepIndicator from './AuthStepIndicator';
import { useAuthMotion } from './authMotion';

export default function AuthSplitLayout({ userType, step, children, wide = false }) {
  const { reduce, fadeSlide, duration } = useAuthMotion();

  return (
    <div className="min-h-screen font-sans lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <AuthBrandPanel userType={userType} step={step} />
      <main className="auth-panel-dots relative flex min-h-[50vh] flex-col justify-center bg-slate-50 px-6 py-10 lg:min-h-screen lg:px-16 lg:py-12">
        <AuthAnimatedBackground variant="panel" />
        <div className={`relative z-10 mx-auto w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}>
          <AuthStepIndicator step={step} />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              {...(reduce ? {} : fadeSlide)}
              transition={{ duration }}
            >
              <motion.div
                className="glass-card p-8"
                initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.05 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
