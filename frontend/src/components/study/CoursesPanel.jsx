import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Plus, FolderOpen, Trash2, X } from 'lucide-react';
import { usePanelMotion } from '../../utils/panelMotion';

const CoursesPanel = ({
  subjects,
  packs,
  documents,
  onCreateSubject,
  onCreatePack,
  onSelectPack,
  onDeletePack,
  selectedPackId,
  onClose,
  embedded = false,
  hideHeader = false,
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [packName, setPackName] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  const processed = documents.filter(d => d.status === 'PROCESSED');
  const { fullPanel, spring } = usePanelMotion();

  const toggleDoc = (id) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const body = (
    <>
      {!hideHeader && (
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <BookMarked className="h-5 w-5 text-indigo-600" />
          My courses & study packs
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto chat-scrollbar-light p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">New subject</h3>
            <div className="flex gap-2">
              <input
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                placeholder="e.g. Physics Sem 2"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (subjectName.trim()) {
                    onCreateSubject(subjectName.trim());
                    setSubjectName('');
                  }
                }}
                className="rounded-lg bg-slate-800 px-3 py-2 text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-3 space-y-1">
              {subjects.map(s => (
                <li key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {s.name}
                </li>
              ))}
              {subjects.length === 0 && (
                <li className="text-xs text-slate-500">No subjects yet</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">New study pack</h3>
            <input
              value={packName}
              onChange={e => setPackName(e.target.value)}
              placeholder="Pack name (e.g. Unit 3 revision)"
              className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400"
            />
            <p className="mb-1 text-xs font-medium text-slate-600">Add processed documents:</p>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {processed.map(d => (
                <label key={d.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.includes(d.id)}
                    onChange={() => toggleDoc(d.id)}
                    className="rounded border-slate-300"
                  />
                  <span className="truncate">{d.fileName}</span>
                </label>
              ))}
              {processed.length === 0 && (
                <p className="px-1 py-2 text-xs text-slate-500">Upload and process documents first</p>
              )}
            </div>
            <button
              type="button"
              disabled={!packName.trim() || selectedDocIds.length === 0}
              onClick={() => {
                onCreatePack(packName.trim(), selectedDocIds);
                setPackName('');
                setSelectedDocIds([]);
              }}
              className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create pack
            </button>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Your study packs</h3>
        <div className="max-h-48 space-y-2 overflow-y-auto chat-scrollbar-light">
          {packs.map(p => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                selectedPackId === p.id
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectPack(p.id)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <FolderOpen className="h-4 w-4 shrink-0 text-indigo-600" />
                <span className="text-sm font-medium text-slate-900">{p.name}</span>
                <span className="text-xs text-slate-500">
                  {(p.packDocuments || []).length} docs
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeletePack(p.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                aria-label="Delete pack"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {packs.length === 0 && (
            <p className="text-sm text-slate-500">No study packs yet. Create one above.</p>
          )}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="flex h-full min-h-0 flex-col text-slate-900">{body}</div>;
  }

  return (
    <motion.div
      className="chat-overlay h-full min-h-0 text-slate-900"
      initial={fullPanel.initial}
      animate={fullPanel.animate}
      exit={fullPanel.exit}
      transition={spring}
    >
      {body}
    </motion.div>
  );
};

export default CoursesPanel;
