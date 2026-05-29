import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, ThumbsDown, ThumbsUp, Download } from 'lucide-react';
import { parseFlashcards, downloadJson } from '../../utils/studyExport';

const FlashcardViewer = ({ content, title, artifactId, onRate, onClose }) => {
  const cards = useMemo(() => parseFlashcards(content), [content]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState([]);

  const deck = shuffled.length ? shuffled : cards;
  const card = deck[index];

  const shuffle = () => {
    const copy = [...cards].sort(() => Math.random() - 0.5);
    setShuffled(copy);
    setIndex(0);
    setFlipped(false);
  };

  const rate = async (quality) => {
    if (artifactId && onRate) await onRate(artifactId, index, quality);
    setFlipped(false);
    setIndex(i => (i + 1) % deck.length);
  };

  if (!card) {
    return (
      <div className="p-6 text-center text-slate-500">
        No flashcards parsed. Try regenerating from Study Tools.
        <button type="button" onClick={onClose} className="mt-4 text-indigo-600">Close</button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h3 className="font-bold text-slate-800">{title || 'Flashcards'}</h3>
        <div className="flex gap-2">
          <button type="button" onClick={() => downloadJson('flashcards.json', deck)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="py-2 text-center text-xs text-slate-500">
        Card {index + 1} of {deck.length} · Tap card to flip
      </p>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4">
        <motion.button
          type="button"
          onClick={() => setFlipped(f => !f)}
          className="min-h-[200px] w-full max-w-lg rounded-2xl border border-indigo-200 bg-white p-8 text-center shadow-lg"
          whileTap={{ scale: 0.98 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            {flipped ? 'Answer' : 'Question'}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-800">
            {flipped ? (card.answer || card.back || '') : (card.question || card.front || '')}
          </p>
        </motion.button>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={shuffle} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm">
            <RotateCcw className="h-4 w-4" /> Shuffle
          </button>
          {artifactId && (
            <>
              <button type="button" onClick={() => rate(2)} className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <ThumbsDown className="h-4 w-4" /> Again
              </button>
              <button type="button" onClick={() => rate(4)} className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <ThumbsUp className="h-4 w-4" /> Got it
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;
