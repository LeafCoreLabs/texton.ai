import { motion } from 'framer-motion';
import { usePanelMotion } from '../../utils/panelMotion';

const OverlayScrim = ({ onClose }) => {
  const { scrim, fade } = usePanelMotion();

  return (
    <motion.button
      type="button"
      className="chat-overlay-scrim"
      aria-label="Close panel"
      onClick={onClose}
      initial={scrim.initial}
      animate={scrim.animate}
      exit={scrim.exit}
      transition={fade}
    />
  );
};

export default OverlayScrim;
