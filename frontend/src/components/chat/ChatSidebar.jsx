import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Trash2,
  FileText,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Search,
  Shield,
  Upload,
  MessagesSquare,
  GraduationCap,
  BookMarked,
  FolderOpen,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { groupSessionsByDate, sessionMode } from '../../utils/chatStorage';

const ChatSidebar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onNewDocumentChat,
  onDeleteSession,
  documents,
  selectedDocId,
  onSelectDocument,
  onOpenDocuments,
  sidebarOpen,
  onToggleSidebar,
  isAdmin,
  isLoggedIn,
  username,
  onStudentLogin,
  onStudentSignup,
  onAdminLogin,
  onLogout,
  processedCount,
  packs,
  selectedPackId,
  onSelectPack,
  onOpenStudyHub,
  onOpenStudyTools,
  dueReviewCount = 0,
}) => {
  const [search, setSearch] = useState('');
  const groups = groupSessionsByDate(sessions);

  const filteredSessions = search.trim()
    ? sessions.filter(
        s =>
          s.title?.toLowerCase().includes(search.toLowerCase()) ||
          s.documentName?.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const renderSession = (s) => {
    const isGeneral = sessionMode(s) === 'general';
    return (
    <button
      key={s.id}
      type="button"
      onClick={() => onSelectSession(s.id)}
      className={`chat-history-item group w-full ${
        activeSessionId === s.id ? 'chat-history-item-active' : ''
      }`}
    >
      {isGeneral ? (
        <MessagesSquare className="h-4 w-4 shrink-0 opacity-70" />
      ) : (
        <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
      )}
      <span className="min-w-0 flex-1 truncate text-left text-sm">
        {s.title}
        {!isGeneral && s.documentName && (
          <span className="block truncate text-[10px] font-normal opacity-60">{s.documentName}</span>
        )}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteSession(s.id);
        }}
        className="ml-1 shrink-0 rounded p-1 opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
        aria-label="Delete chat"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </button>
  );
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            className="chat-sidebar flex h-full shrink-0 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <span className="text-lg font-bold tracking-tight text-white">Texton.ai</span>
                <p className="text-[10px] text-indigo-300/80">Study buddy for exams</p>
              </div>
              <button
                type="button"
                onClick={onToggleSidebar}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 px-3 pt-2">
              <button type="button" onClick={onNewChat} className="chat-new-btn">
                <Plus className="h-4 w-4" />
                New chat
              </button>
              {onNewDocumentChat && processedCount > 0 && (
                <button type="button" onClick={onNewDocumentChat} className="chat-sidebar-link w-full justify-center">
                  <FileText className="h-4 w-4" />
                  Document chat
                </button>
              )}
              {onOpenStudyTools && (
                <button type="button" onClick={onOpenStudyTools} className="chat-sidebar-link w-full justify-center text-indigo-200">
                  <GraduationCap className="h-4 w-4" />
                  Study tools
                </button>
              )}
            </div>

            <div className="px-3 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Chats
            </p>
            <div className="mt-1 flex-1 overflow-y-auto px-2 pb-2 chat-scrollbar">
              {filteredSessions ? (
                <div className="space-y-0.5">
                  {filteredSessions.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-slate-500">No chats found</p>
                  ) : (
                    filteredSessions.map(renderSession)
                  )}
                </div>
              ) : (
                Object.entries(groups).map(([label, list]) =>
                  list.length > 0 ? (
                    <div key={label} className="mb-3">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {label}
                      </p>
                      <div className="space-y-0.5">{list.map(renderSession)}</div>
                    </div>
                  ) : null
                )
              )}
              {sessions.length === 0 && !search && (
                <p className="px-3 py-6 text-center text-xs leading-relaxed text-slate-500">
                  No chats yet. Start a revision session from the home screen.
                </p>
              )}
            </div>

            <div className="border-t border-white/10 p-3">
              {packs && packs.length > 0 && (
                <>
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    My subjects
                  </p>
                  <div className="mb-3 max-h-24 space-y-0.5 overflow-y-auto chat-scrollbar">
                    {packs.slice(0, 6).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectPack?.(p.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${
                          selectedPackId === p.id
                            ? 'bg-violet-600/40 text-white'
                            : 'text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {onOpenStudyHub && (
                <button type="button" onClick={onOpenStudyHub} className="chat-sidebar-link mb-2 w-full">
                  <BookMarked className="h-4 w-4" />
                  Study hub
                  {dueReviewCount > 0 ? (
                    <span className="ml-auto rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {dueReviewCount}
                    </span>
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>
              )}
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Documents ({processedCount} ready)
              </p>
              <div className="max-h-36 space-y-0.5 overflow-y-auto chat-scrollbar">
                {documents
                  .filter(d => d.status === 'PROCESSED')
                  .slice(0, 8)
                  .map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => onSelectDocument(doc.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        selectedDocId === doc.id
                          ? 'bg-indigo-600/40 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                    </button>
                  ))}
                {processedCount === 0 && (
                  <p className="px-2 py-2 text-[11px] text-slate-500">No processed docs yet</p>
                )}
              </div>
              <button type="button" onClick={onOpenDocuments} className="chat-sidebar-link mt-2 w-full">
                <Upload className="h-4 w-4" />
                Manage documents
                <ChevronRight className="ml-auto h-4 w-4" />
              </button>
              <div className="mt-3 border-t border-white/10 pt-3">
                {isLoggedIn ? (
                  <>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {isAdmin ? 'Admin' : 'Signed in'}
                    </p>
                    <p className="mb-2 truncate px-2 text-xs font-medium text-slate-200">
                      {username}
                    </p>
                    {onLogout && (
                      <button type="button" onClick={onLogout} className="chat-sidebar-link w-full">
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    )}
                    {!isAdmin && onAdminLogin && (
                      <button type="button" onClick={onAdminLogin} className="chat-sidebar-link mt-1 w-full">
                        <Shield className="h-4 w-4" />
                        Admin login
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mb-2 px-1 text-[10px] leading-relaxed text-slate-500">
                      Sign in to save documents, courses, exams & chats
                    </p>
                    {onStudentLogin && (
                      <button type="button" onClick={onStudentLogin} className="chat-sidebar-link mb-1 w-full">
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </button>
                    )}
                    {onStudentSignup && (
                      <button type="button" onClick={onStudentSignup} className="chat-sidebar-link mb-1 w-full">
                        <UserPlus className="h-4 w-4" />
                        Create account
                      </button>
                    )}
                    {onAdminLogin && (
                      <button type="button" onClick={onAdminLogin} className="chat-sidebar-link mt-1 w-full">
                        <Shield className="h-4 w-4" />
                        Admin login
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!sidebarOpen && (
        <div className="flex w-12 shrink-0 flex-col items-center border-r border-slate-200 bg-slate-900 py-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNewChat}
            className="mt-3 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="New chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;
