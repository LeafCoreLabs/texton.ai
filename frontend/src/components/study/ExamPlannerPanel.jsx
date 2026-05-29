import { motion, AnimatePresence } from 'framer-motion';
import ExamPlanner from './ExamPlanner';
import { usePanelMotion } from '../../utils/panelMotion';

const ExamPlannerPanel = ({ open, onClose, ...plannerProps }) => {
  const { sidePanel, spring } = usePanelMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="exam-planner"
          className="chat-side-panel-wide flex flex-col overflow-hidden"
          initial={sidePanel.initial}
          animate={sidePanel.animate}
          exit={sidePanel.exit}
          transition={spring}
        >
          <ExamPlanner {...plannerProps} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExamPlannerPanel;
