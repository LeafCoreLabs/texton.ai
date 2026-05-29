import {
  BookOpen,
  ClipboardList,
  Layers,
  HelpCircle,
  GraduationCap,
  Calendar,
  ListChecks,
  Lightbulb,
} from 'lucide-react';

export const STUDENT_TAGLINE = 'Your AI study command center for exams';

export const DOC_SUGGESTIONS = [
  { icon: BookOpen, label: 'Notes', text: 'Create exam-ready revision notes with headings, definitions, and examples' },
  { icon: ClipboardList, label: 'Mock exam', text: 'What topics are most likely on the exam? Give a revision checklist' },
  { icon: Layers, label: 'Flashcards', text: 'Generate 15 flashcards (question and answer) for active recall' },
  { icon: HelpCircle, label: 'Quiz', text: 'Generate 10 MCQ practice questions with answers and explanations' },
  { icon: Lightbulb, label: 'ELI15', text: 'Explain the hardest concepts like I am in high school' },
  { icon: ListChecks, label: 'Definitions', text: 'List all key terms and definitions from this material' },
];

export const GENERAL_SUGGESTIONS = [
  { icon: Calendar, label: 'Revision sprint', text: 'Help me plan a 7-day revision sprint before my exam' },
  { icon: GraduationCap, label: 'Study skills', text: 'What are the best active recall techniques for exam season?' },
  { icon: HelpCircle, label: 'Quiz me', text: 'Run a mock oral exam — I will tell you the subject' },
  { icon: Lightbulb, label: 'Compare', text: 'Help me compare two concepts I keep confusing for the exam' },
];

export const STUDY_TOOLS = [
  { id: 'notes', label: 'Smart Notes', description: 'Structured revision notes', icon: BookOpen },
  { id: 'exam-summary', label: 'Exam Summary', description: 'Likely topics & checklist', icon: ClipboardList },
  { id: 'flashcards', label: 'Flashcards', description: 'Spaced repetition decks', icon: Layers },
  { id: 'mcq-quiz', label: 'MCQ Quiz', description: 'Timed practice quiz', icon: HelpCircle },
  { id: 'eli15', label: 'Explain Simply', description: 'ELI15 for tough concepts', icon: Lightbulb },
  { id: 'topics', label: 'Key Topics', description: 'Extract topic list for planner', icon: ListChecks },
];

export const INTEGRITY_NOTICE =
  'Use Texton for learning and revision. Cite your sources and do not submit AI-generated text as your own work.';
