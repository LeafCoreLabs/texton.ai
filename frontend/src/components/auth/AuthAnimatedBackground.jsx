import { motion, useReducedMotion } from 'framer-motion';

const BLOBS = [
  { className: '-left-20 -top-20 h-64 w-64 bg-violet-400/30', duration: 14, delay: 0 },
  { className: '-bottom-16 right-0 h-72 w-72 bg-indigo-300/25', duration: 18, delay: 2 },
  { className: 'right-1/4 top-1/3 h-40 w-40 bg-fuchsia-400/20', duration: 12, delay: 4 },
];

export default function AuthAnimatedBackground({ variant = 'brand' }) {
  const reduce = useReducedMotion();

  if (variant === 'panel') {
    return (
      <div className="auth-panel-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden />
    );
  }

  return (
    <>
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`pointer-events-none absolute rounded-full blur-3xl ${blob.className}`}
          aria-hidden
          animate={
            reduce
              ? {}
              : { y: [0, -24, 0], x: [0, i % 2 === 0 ? 12 : -12, 0] }
          }
          transition={
            reduce
              ? {}
              : {
                  duration: blob.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: blob.delay,
                }
          }
        />
      ))}
    </>
  );
}
