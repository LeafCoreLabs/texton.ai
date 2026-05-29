import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { ACCEPT_ATTRIBUTE, FORMATS_LABEL } from '../../utils/documentFormats';
import { usePanelMotion } from '../../utils/panelMotion';

const DocumentsPanel = ({
  documents,
  selectedFile,
  onFileChange,
  onUpload,
  loading,
  uploadMessage,
  onSelectDoc,
  onDeleteDoc,
  deletingDocId,
  onClose,
  selectedDocId,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { fullPanel, spring } = usePanelMotion();

  const handleDeleteClick = (doc) => {
    if (confirmDeleteId === doc.id) {
      onDeleteDoc(doc.id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(doc.id);
    }
  };

  return (
    <motion.div
      initial={fullPanel.initial}
      animate={fullPanel.animate}
      exit={fullPanel.exit}
      transition={spring}
      className="chat-overlay h-full min-h-0 text-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <FileText className="h-5 w-5 text-indigo-600" />
          Documents
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 chat-scrollbar-light">
        <div className="doc-upload-zone mb-8">
          <Upload className="mx-auto mb-3 h-8 w-8 text-indigo-500" />
          <p className="mb-4 text-center text-sm text-slate-600">
            Upload documents for AI chat — {FORMATS_LABEL}.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="file-upload-input"
              type="file"
              onChange={onFileChange}
              accept={ACCEPT_ATTRIBUTE}
              className="flex-1 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700"
            />
            <button
              type="button"
              onClick={onUpload}
              disabled={!selectedFile || loading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Upload & process'}
            </button>
          </div>
          {uploadMessage && (
            <p
              className={`mt-3 text-center text-sm font-medium ${
                uploadMessage.includes('Success') ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {uploadMessage}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {documents.length === 0 ? (
            <p className="py-12 text-center text-slate-500">No documents yet. Upload one above.</p>
          ) : (
            documents.map(doc => (
              <div
                key={doc.id}
                className={`doc-row ${selectedDocId === doc.id ? 'doc-row-active' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{doc.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {(doc.sizeInKb ?? doc.size) ?? '—'} KB · {doc.uploadDate?.substring(0, 10) ?? '—'}
                    {doc.pageCount ? ` · ${doc.pageCount} pages` : ''}
                    {doc.chunkCount ? ` · ${doc.chunkCount} chunks` : ''}
                  </p>
                </div>
                <span
                  className={`doc-status-pill ${
                    doc.status === 'PROCESSED'
                      ? 'doc-status-done'
                      : doc.status === 'FAILED'
                        ? 'doc-status-fail'
                        : 'doc-status-pending'
                  }`}
                >
                  {doc.status === 'PROCESSING' && doc.indexProgress != null
                    ? `Indexing ${doc.indexProgress}%`
                    : doc.status}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={doc.status !== 'PROCESSED'}
                    onClick={() => onSelectDoc(doc.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </button>
                  {confirmDeleteId === doc.id ? (
                    <div className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1">
                      <button
                        type="button"
                        disabled={deletingDocId === doc.id}
                        onClick={() => handleDeleteClick(doc)}
                        className="text-xs font-semibold text-red-700 hover:text-red-800 disabled:opacity-50"
                      >
                        {deletingDocId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirm'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(doc)}
                      disabled={deletingDocId === doc.id}
                      title="Delete document"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingDocId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentsPanel;
