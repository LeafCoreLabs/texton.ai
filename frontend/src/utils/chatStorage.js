const LEGACY_SESSIONS_KEY = 'texton_chat_sessions';
const LEGACY_ACTIVE_KEY = 'texton_active_session_id';

export function createSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sessionsKey(userKey = 'guest') {
  return `texton_chat_sessions_${userKey || 'guest'}`;
}

function activeKey(userKey = 'guest') {
  return `texton_active_session_${userKey || 'guest'}`;
}

function migrateLegacySessionsIfNeeded(userKey) {
  if (userKey !== 'guest') return;
  try {
    const newKey = sessionsKey('guest');
    if (localStorage.getItem(newKey)) return;
    const legacy = localStorage.getItem(LEGACY_SESSIONS_KEY);
    if (legacy) {
      localStorage.setItem(newKey, legacy);
      const legacyActive = localStorage.getItem(LEGACY_ACTIVE_KEY);
      if (legacyActive) localStorage.setItem(activeKey('guest'), legacyActive);
    }
  } catch {
    /* ignore */
  }
}

export function loadSessions(userKey = 'guest') {
  migrateLegacySessionsIfNeeded(userKey);
  try {
    const raw = localStorage.getItem(sessionsKey(userKey));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions, userKey = 'guest') {
  try {
    localStorage.setItem(sessionsKey(userKey), JSON.stringify(sessions));
  } catch {
    /* quota or private mode */
  }
}

export function loadActiveSessionId(userKey = 'guest') {
  migrateLegacySessionsIfNeeded(userKey);
  return localStorage.getItem(activeKey(userKey)) || null;
}

export function saveActiveSessionId(id, userKey = 'guest') {
  try {
    if (id) localStorage.setItem(activeKey(userKey), id);
    else localStorage.removeItem(activeKey(userKey));
  } catch {
    /* ignore */
  }
}

/** @param {'general'|'document'} mode */
export function createSession({ documentId, documentName, mode, packId, packName }) {
  const now = new Date().toISOString();
  const resolvedMode = mode || (documentId || packId ? 'document' : 'general');
  return {
    id: createSessionId(),
    mode: resolvedMode,
    documentId: resolvedMode === 'document' ? documentId : null,
    packId: packId || null,
    packName: packName || null,
    documentName:
      resolvedMode === 'general'
        ? 'General chat'
        : packName || documentName || 'Document',
    title: resolvedMode === 'general' ? 'New chat' : 'New conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function sessionMode(session) {
  if (!session) return 'general';
  if (session.mode) return session.mode;
  return session.documentId ? 'document' : 'general';
}

export function isGeneralSession(session) {
  return sessionMode(session) === 'general';
}

export function upsertSession(sessions, session) {
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    const next = [...sessions];
    next[idx] = session;
    return next;
  }
  return [session, ...sessions];
}

export function deleteSession(sessions, sessionId) {
  return sessions.filter(s => s.id !== sessionId);
}

export function groupSessionsByDate(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { Today: [], Yesterday: [], 'Previous 7 days': [], Older: [] };

  for (const s of sessions) {
    const d = new Date(s.updatedAt || s.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() >= today.getTime()) groups.Today.push(s);
    else if (d.getTime() >= yesterday.getTime()) groups.Yesterday.push(s);
    else if (d.getTime() >= weekAgo.getTime()) groups['Previous 7 days'].push(s);
    else groups.Older.push(s);
  }
  return groups;
}
