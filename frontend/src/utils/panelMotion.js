import { useReducedMotion } from 'framer-motion';

/** Soft spring — similar to modern chat / drawer UIs */
export const PANEL_SPRING = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

export const PANEL_FADE = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
};

export function usePanelMotion() {
  const reduce = useReducedMotion();

  if (reduce) {
    return {
      reduce: true,
      spring: { duration: 0 },
      fade: { duration: 0 },
      scrim: { initial: false, animate: {}, exit: {} },
      sidePanel: { initial: false, animate: {}, exit: {} },
      fullPanel: { initial: false, animate: {}, exit: {} },
    };
  }

  return {
    reduce: false,
    spring: PANEL_SPRING,
    fade: PANEL_FADE,
    scrim: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: PANEL_FADE,
    },
    sidePanel: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      transition: PANEL_SPRING,
    },
    fullPanel: {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 12 },
      transition: PANEL_SPRING,
    },
  };
}
