import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookMarked, Calendar, Layers, Library, User } from 'lucide-react';
import { usePanelMotion } from '../../utils/panelMotion';
import CoursesPanel from './CoursesPanel';
import ExamPlanner from './ExamPlanner';
import StudentProfileSection from './StudentProfileSection';

const TABS = [
  { id: 'courses', label: 'Courses', icon: BookMarked },
  { id: 'exams', label: 'Exams', icon: Calendar },
  { id: 'practice', label: 'Practice', icon: Layers },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'profile', label: 'Profile', icon: User },
];

const artifactTypeLabel = {
  FLASHCARDS: 'Flashcards',
  MCQ_QUIZ: 'Quiz',
  NOTES: 'Notes',
  EXAM_SUMMARY: 'Exam summary',
  TOPICS: 'Topics',
  REVISION_PLAN: 'Revision plan',
};

const StudyHubPanel = ({
  open,
  onClose,
  dueReviews,
  artifacts,
  onOpenArtifact,
  onStartDueReview,
  coursesProps,
  examProps,
  onProfileSaved,
}) => {
  const [tab, setTab] = useState('courses');
  const { fullPanel, spring } = usePanelMotion();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="study-hub"
        className="chat-overlay-panel h-full min-h-0 text-slate-900"
        initial={fullPanel.initial}
        animate={fullPanel.animate}
        exit={fullPanel.exit}
        transition={spring}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-bold text-slate-900">Study hub</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 px-2 py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                tab === id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {id === 'practice' && dueReviews?.length > 0 && (
                <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] text-white">
                  {dueReviews.reduce((s, d) => s + (d.count || 0), 0)}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {tab === 'courses' && (
            <CoursesPanel embedded hideHeader onClose={onClose} {...coursesProps} />
          )}
          {tab === 'exams' && (
            <ExamPlanner embedded onClose={null} {...examProps} />
          )}
          {tab === 'practice' && (
            <div className="h-full overflow-y-auto p-4 chat-scrollbar-light">
              {dueReviews?.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={onStartDueReview}
                    className="mb-4 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white"
                  >
                    Review all due cards
                  </button>
                  <ul className="space-y-2">
                    {dueReviews.map(d => (
                      <li key={d.artifactId}>
                        <button
                          type="button"
                          onClick={() => onOpenArtifact(d.artifactId, 'flashcards')}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-violet-200"
                        >
                          <span className="text-sm font-medium text-slate-800">{d.title || 'Flashcards'}</span>
                          <span className="text-xs font-semibold text-violet-600">{d.count} due</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-center text-sm text-slate-500">
                  No cards due. Generate flashcards from Study tools after uploading notes.
                </p>
              )}
            </div>
          )}
          {tab === 'library' && (
            <div className="h-full overflow-y-auto p-4 chat-scrollbar-light">
              {artifacts?.length > 0 ? (
                <ul className="space-y-2">
                  {artifacts.map(a => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenArtifact(
                            a.id,
                            a.type === 'MCQ_QUIZ' ? 'quiz' : a.type === 'FLASHCARDS' ? 'flashcards' : 'notes',
                            a
                          )
                        }
                        className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-indigo-200"
                      >
                        <span className="text-xs font-semibold uppercase text-indigo-600">
                          {artifactTypeLabel[a.type] || a.type}
                        </span>
                        <span className="text-sm font-medium text-slate-900">{a.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-slate-500">
                  Saved study outputs appear here after you use Study tools.
                </p>
              )}
            </div>
          )}
          {tab === 'profile' && (
            <div className="overflow-y-auto p-4">
              <StudentProfileSection onSaved={onProfileSaved} />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudyHubPanel;
