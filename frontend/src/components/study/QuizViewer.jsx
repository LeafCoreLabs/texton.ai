import React, { useState, useMemo } from 'react';
import { X, Download, CheckCircle, XCircle } from 'lucide-react';
import { parseQuiz, downloadJson } from '../../utils/studyExport';

const QuizViewer = ({ content, title, timed = false, onClose }) => {
  const questions = useMemo(() => parseQuiz(content), [content]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timed ? questions.length * 60 : null);

  React.useEffect(() => {
    if (!timed || done || secondsLeft == null) return;
    if (secondsLeft <= 0) {
      setDone(true);
      return;
    }
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timed, done, secondsLeft]);

  const q = questions[index];

  const submit = (optIdx) => {
    if (selected != null) return;
    setSelected(optIdx);
    const correct = q.correctIndex ?? q.correct ?? 0;
    if (optIdx === correct) setScore(s => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
      setSelected(null);
    }
  };

  if (!q && !done) {
    return (
      <div className="p-6 text-center text-slate-500">
        No quiz questions parsed.
        <button type="button" onClick={onClose} className="mt-4 block w-full text-indigo-600">Close</button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-8">
        <h3 className="text-2xl font-bold text-slate-800">Quiz complete</h3>
        <p className="mt-2 text-4xl font-bold text-indigo-600">
          {score} / {questions.length}
        </p>
        <button type="button" onClick={onClose} className="mt-8 rounded-xl bg-indigo-600 px-6 py-2 text-white">
          Close
        </button>
      </div>
    );
  }

  const options = q.options || [];
  const correctIdx = q.correctIndex ?? 0;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <h3 className="font-bold text-slate-800">{title || 'Practice Quiz'}</h3>
        <div className="flex items-center gap-2">
          {timed && <span className="text-sm font-mono text-amber-600">{secondsLeft}s</span>}
          <button type="button" onClick={() => downloadJson('quiz.json', questions)} className="p-2 text-slate-500">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="p-2 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-xs text-slate-500">Question {index + 1} of {questions.length}</p>
        <p className="mt-3 text-lg font-medium text-slate-800">{q.question}</p>
        <div className="mt-6 space-y-2">
          {options.map((opt, i) => {
            let cls = 'w-full rounded-xl border p-4 text-left text-sm transition ';
            if (selected == null) cls += 'hover:border-indigo-300 bg-white';
            else if (i === correctIdx) cls += 'border-emerald-400 bg-emerald-50';
            else if (i === selected) cls += 'border-red-300 bg-red-50';
            else cls += 'bg-white opacity-60';
            return (
              <button key={i} type="button" disabled={selected != null} onClick={() => submit(i)} className={cls}>
                <span className="flex items-center gap-2">
                  {selected != null && i === correctIdx && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                  {selected === i && i !== correctIdx && <XCircle className="h-4 w-4 text-red-600" />}
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
        {selected != null && (
          <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
            {q.explanation || 'Review your notes for more detail.'}
          </div>
        )}
        {selected != null && (
          <button type="button" onClick={next} className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white">
            {index + 1 >= questions.length ? 'Finish' : 'Next question'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizViewer;
