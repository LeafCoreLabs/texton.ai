import { useReducedMotion } from 'framer-motion';

export function useAuthMotion() {
  const reduce = useReducedMotion();

  return {
    reduce,
    duration: reduce ? 0 : 0.25,
    spring: reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 },
    fadeSlide: reduce
      ? {}
      : {
          initial: { opacity: 0, x: 16 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -12 },
        },
    stagger: reduce ? 0 : 0.05,
    hover: reduce ? {} : { scale: 1.02, y: -2 },
    tap: reduce ? {} : { scale: 0.98 },
  };
}
