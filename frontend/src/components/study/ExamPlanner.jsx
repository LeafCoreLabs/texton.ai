import React, { useState } from 'react';
import { Calendar, Plus, Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { daysUntilExam, topicProgressPercent } from '../../utils/examUtils';

const statusIcon = {
  PENDING: Circle,
  STUDIED: CheckCircle2,
  WEAK: AlertCircle,
};

const ExamPlanner = ({
  exams,
  topics,
  packs,
  onCreateExam,
  onGenerateTopics,
  onUpdateTopic,
  onGenerateRevisionPlan,
  selectedExamId,
  onSelectExam,
  loading,
  documentId,
  embedded = false,
}) => {
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [packId, setPackId] = useState('');

  const selected = exams.find(e => e.id === selectedExamId);
  const daysUntil = selected?.examDate ? daysUntilExam(selected.examDate) : null;
  const progress = topicProgressPercent(topics);
  const linkedPackId = selected?.studyPack?.id ?? selected?.packId ?? null;
  const canGenerateTopics = selectedExamId && (documentId || linkedPackId || packId);

  return (
    <div className={`flex h-full flex-col bg-white ${embedded ? '' : ''}`}>
      <div className="space-y-3 border-b p-4">
        <input
          type="text"
          placeholder="Exam title (e.g. Physics Final)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={examDate}
          onChange={e => setExamDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {packs?.length > 0 && (
          <select
            value={packId}
            onChange={e => setPackId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Link study pack (optional)</option>
            {packs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          disabled={!title.trim() || loading}
          onClick={() => {
            onCreateExam({ title, examDate, packId: packId ? Number(packId) : null });
            setTitle('');
            setExamDate('');
            setPackId('');
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add exam
        </button>
      </div>
      <div className="max-h-32 overflow-y-auto border-b">
        {exams.map(ex => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onSelectExam(ex.id)}
            className={`w-full px-4 py-2 text-left text-sm ${
              selectedExamId === ex.id ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-slate-50'
            }`}
          >
            <span className="font-medium">{ex.title}</span>
            {ex.examDate && (
              <span className="block text-xs text-slate-500">{ex.examDate}</span>
            )}
          </button>
        ))}
      </div>
      {selected && (
        <div className="border-b bg-amber-50 px-4 py-3">
          <div className="text-center">
            {daysUntil != null && daysUntil >= 0 ? (
              <p className="text-2xl font-bold text-amber-800">{daysUntil} days left</p>
            ) : (
              <p className="text-sm text-amber-800">Exam date passed or not set</p>
            )}
          </div>
          {topics.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-medium text-amber-900">
                <span>Topic progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-amber-200">
                <div
                  className="h-full rounded-full bg-amber-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {onGenerateRevisionPlan && (linkedPackId || packId || documentId) && (
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                onGenerateRevisionPlan({
                  examId: selectedExamId,
                  packId: linkedPackId || (packId ? Number(packId) : null),
                  days: daysUntil != null && daysUntil > 0 ? Math.min(daysUntil, 14) : 7,
                })
              }
              className="mt-3 w-full rounded-lg border border-amber-300 bg-white py-2 text-xs font-semibold text-amber-900"
            >
              Generate AI revision plan
            </button>
          )}
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold uppercase text-slate-400">Topics</span>
        {canGenerateTopics && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              onGenerateTopics(selectedExamId, documentId, linkedPackId || (packId ? Number(packId) : null))
            }
            className="text-xs font-medium text-indigo-600"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : 'Auto-generate'}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {topics.map(t => {
          const Icon = statusIcon[t.status] || Circle;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                const next =
                  t.status === 'PENDING' ? 'STUDIED' : t.status === 'STUDIED' ? 'WEAK' : 'PENDING';
                onUpdateTopic(t.id, next);
              }}
              className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  t.status === 'STUDIED'
                    ? 'text-emerald-500'
                    : t.status === 'WEAK'
                      ? 'text-amber-500'
                      : 'text-slate-300'
                }`}
              />
              <span className="truncate text-slate-800">{t.topicName}</span>
            </button>
          );
        })}
        {topics.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-slate-400">
            Select an exam, link a pack, and auto-generate topics.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExamPlanner;
