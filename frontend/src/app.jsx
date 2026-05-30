import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import apiClient from './api/client';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Power,
  ArrowLeft,
  Loader2 as Loader,
  Lock,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import AuthSplitLayout from './components/auth/AuthSplitLayout';
import AuthFormField from './components/auth/AuthFormField';
import AuthTabSwitcher from './components/auth/AuthTabSwitcher';
import { useAuthMotion } from './components/auth/authMotion';
import { loadAuth, saveAuth, clearAuth, chatUserKey } from './utils/authStorage';
import { validatePassword, validateEmail } from './utils/authValidation';
import ChatSidebar from './components/chat/ChatSidebar';
import ChatWorkspace from './components/chat/ChatWorkspace';
import DocumentsPanel from './components/chat/DocumentsPanel';
import StudyToolsPanel from './components/study/StudyToolsPanel';
import StudyHubPanel from './components/study/StudyHubPanel';
import OverlayScrim from './components/chat/OverlayScrim';
import { loadStudentProfile, profileContextLine } from './utils/studentProfile';
import FlashcardViewer from './components/study/FlashcardViewer';
import QuizViewer from './components/study/QuizViewer';
import { downloadText } from './utils/studyExport';
import {
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createSession,
  upsertSession,
  deleteSession,
  sessionMode,
} from './utils/chatStorage';
import { fileValidationError } from './utils/documentFormats';

const API_BASE_URL = '/api';
const AUTH_API_URL = '/auth';

const welcomeMessage = (fileName) =>
  `Hi! I'm your Texton study tutor. I'm ready to help you revise "${fileName}" — use Study Tools for notes, flashcards, and quizzes, or ask questions below.`;

const generalWelcomeMessage = () =>
  `Hi! I'm Texton, your AI study buddy. I can help with exam prep, revision plans, and explaining tough topics. Upload your syllabus or notes anytime for document-based study.`;

const buildChatHistory = (messages) =>
  (messages || [])
    .filter(m => (m.sender === 'user' || m.sender === 'bot') && m.id !== 'welcome')
    .map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.message,
    }));

const App = () => {
  const [hydratedAuth] = useState(() => loadAuth());
  const [step, setStep] = useState('dashboard');
  const [role, setRole] = useState(hydratedAuth?.role ?? null);
  const [username, setUsername] = useState(hydratedAuth?.username ?? null);
  const [message, setMessage] = useState({ type: null, text: null });
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [signupData, setSignupData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    contact: '',
    address: '',
    designation: 'Student',
  });
  const [confirmLogout, setConfirmLogout] = useState(false);
  const isAdmin = role === 'admin';
  const isStudent = role === 'user';
  const isLoggedIn = Boolean(username && (isAdmin || isStudent));

  const [chatStorageKey, setChatStorageKey] = useState(() => chatUserKey(hydratedAuth));

  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [attachUploading, setAttachUploading] = useState(false);
  const [attachFileName, setAttachFileName] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [runningStudyTool, setRunningStudyTool] = useState(null);
  const [studyViewer, setStudyViewer] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [packs, setPacks] = useState([]);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [exams, setExams] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [dueReviews, setDueReviews] = useState([]);
  const [artifacts, setArtifacts] = useState([]);

  const [chatSessions, setChatSessions] = useState(() => loadSessions(chatUserKey(hydratedAuth)));
  const [activeSessionId, setActiveSessionId] = useState(() =>
    loadActiveSessionId(chatUserKey(hydratedAuth))
  );
  const [userInput, setUserInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const sseMapRef = useRef(new Map());
  const pollTimersRef = useRef(new Map());
  const { reduce, stagger } = useAuthMotion();
  const reduceMotion = useReducedMotion();

  const activeSession = useMemo(
    () => chatSessions.find(s => s.id === activeSessionId) ?? null,
    [chatSessions, activeSessionId]
  );

  const chatMode = activeSession ? sessionMode(activeSession) : 'general';
  const isGeneralChat = chatMode === 'general';
  const selectedDocId = isGeneralChat ? null : activeSession?.documentId ?? null;
  const activePackId = activeSession?.packId ?? selectedPackId;
  const chatMessages = activeSession?.messages ?? [];
  const activeDoc = selectedDocId ? documents.find(d => d.id === selectedDocId) : null;
  const activePack = packs.find(p => p.id === activePackId);
  const processedCount = documents.filter(d => d.status === 'PROCESSED').length;
  const dueReviewCount = useMemo(
    () => dueReviews.reduce((sum, d) => sum + (d.count || 0), 0),
    [dueReviews]
  );
  const activePackName = packs.find(p => p.id === selectedPackId)?.name;

  const formVariants = reduce
    ? {}
    : { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: stagger } } };
  const fieldVariants = reduce
    ? {}
    : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  const clearMessage = useCallback(() => setMessage({ type: null, text: null }), []);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (!message.text) {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      return;
    }
    const duration = message.type === 'error' ? 6500 : 4500;
    toastTimerRef.current = setTimeout(() => {
      setMessage({ type: null, text: null });
      toastTimerRef.current = null;
    }, duration);
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [message.text, message.type]);

  useEffect(() => {
    if (!uploadMessage || uploadMessage.startsWith('Uploading')) return;
    const duration = uploadMessage.includes('failed') || uploadMessage.includes('Please select')
      ? 6500
      : 5000;
    const t = setTimeout(() => setUploadMessage(''), duration);
    return () => clearTimeout(t);
  }, [uploadMessage]);

  const openPanel = useCallback(panel => {
    setActivePanel(prev => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => setActivePanel(null), []);

  const switchToChatUser = useCallback(key => {
    setChatStorageKey(key);
    const sessions = loadSessions(key);
    const activeId = loadActiveSessionId(key);
    setChatSessions(sessions);
    setActiveSessionId(activeId);
  }, []);

  const persistSessions = useCallback((sessions, activeId) => {
    setChatSessions(sessions);
    saveSessions(sessions, chatStorageKey);
    if (activeId !== undefined) {
      setActiveSessionId(activeId);
      saveActiveSessionId(activeId, chatStorageKey);
    }
  }, [chatStorageKey]);

  const updateActiveSession = useCallback((updater) => {
    if (!activeSessionId) return;
    setChatSessions(prev => {
      const session = prev.find(s => s.id === activeSessionId);
      if (!session) return prev;
      const updated = {
        ...updater(session),
        updatedAt: new Date().toISOString(),
      };
      const next = upsertSession(prev, updated);
      saveSessions(next, chatStorageKey);
      return next;
    });
  }, [activeSessionId, chatStorageKey]);

  const startGeneralSession = useCallback(({ forceNew = false } = {}) => {
    let sessionId = null;
    setChatSessions(prev => {
      if (!forceNew) {
        const existing = prev.find(
          s => sessionMode(s) === 'general' && s.messages.filter(m => m.sender === 'user').length === 0
        );
        if (existing) {
          sessionId = existing.id;
          saveActiveSessionId(existing.id, chatStorageKey);
          setActiveSessionId(existing.id);
          return prev;
        }
      }
      const session = createSession({ mode: 'general' });
      session.messages = [
        { id: 'welcome', sender: 'bot', message: generalWelcomeMessage() },
      ];
      sessionId = session.id;
      const next = upsertSession(prev, session);
      saveSessions(next, chatStorageKey);
      saveActiveSessionId(session.id, chatStorageKey);
      setActiveSessionId(session.id);
      return next;
    });
    return sessionId;
  }, [chatStorageKey]);

  const startSessionForDoc = useCallback((docId, { forceNew = false, botMessage } = {}) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return null;

    let sessionId = null;
    setChatSessions(prev => {
      if (!forceNew && doc.status === 'PROCESSED') {
        const existing = prev.find(
          s => s.documentId === docId && sessionMode(s) === 'document'
        );
        if (existing) {
          sessionId = existing.id;
          saveActiveSessionId(existing.id, chatStorageKey);
          setActiveSessionId(existing.id);
          return prev;
        }
      }
      const session = createSession({
        mode: 'document',
        documentId: docId,
        documentName: doc.fileName,
      });
      const defaultMsg =
        doc.status === 'PROCESSED'
          ? welcomeMessage(doc.fileName)
          : `📎 "${doc.fileName}" is uploading and processing. Ask questions once status is PROCESSED — I'll use the file content for answers.`;
      session.messages = [
        {
          id: 'welcome',
          sender: 'bot',
          message: botMessage || defaultMsg,
        },
      ];
      sessionId = session.id;
      const next = upsertSession(prev, session);
      saveSessions(next, chatStorageKey);
      saveActiveSessionId(session.id, chatStorageKey);
      setActiveSessionId(session.id);
      return next;
    });
    return sessionId;
  }, [documents, chatStorageKey]);

  const fetchDocuments = useCallback(async () => {
    if (!isLoggedIn) {
      setDocuments([]);
      return;
    }
    try {
      const res = await apiClient.get(`${API_BASE_URL}/documents`);
      const list = Array.isArray(res.data) ? res.data : [];
      setDocuments(list);
      list.forEach(d => {
        if (d.status === 'PROCESSING') attachStatusListeners(d.id);
        else cleanupDocListeners(d.id);
      });
    } catch {}
  }, [isLoggedIn]);

  const attachStatusListeners = useCallback((docId) => {
    if (!isLoggedIn) return;
    if (!sseMapRef.current.has(docId)) {
      try {
        const streamUrl = `${API_BASE_URL}/documents/${docId}/stream`;
        const es = new EventSource(streamUrl, { withCredentials: true });
        sseMapRef.current.set(docId, es);
        const applyDocPatch = (patch) => {
          setDocuments(prev =>
            prev.map(d => (d.id === docId ? { ...d, ...patch } : d))
          );
        };
        es.addEventListener('progress', (evt) => {
          const pct = parseInt(String(evt.data || ''), 10);
          if (!Number.isNaN(pct)) {
            applyDocPatch({ indexProgress: pct });
          }
        });
        es.addEventListener('status', (evt) => {
          const statusText = String(evt.data || '').trim();
          if (!statusText) return;
          applyDocPatch({ status: statusText, indexProgress: statusText === 'PROCESSED' ? 100 : undefined });
          if (statusText === 'PROCESSED' || statusText === 'FAILED') cleanupDocListeners(docId);
        });
        es.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data);
            if (payload?.status) {
              applyDocPatch({ status: payload.status });
              if (payload.status === 'PROCESSED' || payload.status === 'FAILED') {
                cleanupDocListeners(docId);
              }
            }
          } catch {
            const statusText = String(evt.data || '').trim();
            if (statusText) {
              applyDocPatch({ status: statusText });
              if (statusText === 'PROCESSED' || statusText === 'FAILED') cleanupDocListeners(docId);
            }
          }
        };
        es.onerror = () => {
          es.close();
          sseMapRef.current.delete(docId);
          ensurePolling(docId);
        };
      } catch {
        ensurePolling(docId);
      }
    }
    ensurePolling(docId);
  }, [isLoggedIn]);

  const ensurePolling = (docId) => {
    if (!isLoggedIn) return;
    if (pollTimersRef.current.has(docId)) return;
    const id = setInterval(async () => {
      try {
        const res = await apiClient.get(`${API_BASE_URL}/documents`);
        const list = Array.isArray(res.data) ? res.data : [];
        const updated = list.find(d => d.id === docId);
        if (updated) {
          setDocuments(prev => prev.map(d => (d.id === docId ? updated : d)));
          if (updated.status === 'PROCESSED' || updated.status === 'FAILED') {
            cleanupDocListeners(docId);
          }
        }
      } catch {
        cleanupDocListeners(docId);
      }
    }, 3000);
    pollTimersRef.current.set(docId, id);
  };

  const cleanupDocListeners = (docId) => {
    const es = sseMapRef.current.get(docId);
    if (es) {
      try { es.close(); } catch {}
      sseMapRef.current.delete(docId);
    }
    const timerId = pollTimersRef.current.get(docId);
    if (timerId) {
      clearInterval(timerId);
      pollTimersRef.current.delete(docId);
    }
  };

  useEffect(() => {
    return () => {
      sseMapRef.current.forEach(es => { try { es.close(); } catch {} });
      sseMapRef.current.clear();
      pollTimersRef.current.forEach(id => clearInterval(id));
      pollTimersRef.current.clear();
    };
  }, []);

  const fetchStudyData = useCallback(async () => {
    try {
      const [subRes, packRes, examRes] = await Promise.all([
        apiClient.get(`${API_BASE_URL}/subjects`),
        apiClient.get(`${API_BASE_URL}/packs`),
        apiClient.get(`${API_BASE_URL}/exams`),
      ]);
      setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
      setPacks(Array.isArray(packRes.data) ? packRes.data : []);
      setExams(Array.isArray(examRes.data) ? examRes.data : []);
    } catch {}
  }, []);

  const fetchDueReviews = useCallback(async () => {
    if (!isLoggedIn) {
      setDueReviews([]);
      return;
    }
    try {
      const res = await apiClient.get(`${API_BASE_URL}/study/reviews/due`);
      setDueReviews(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDueReviews([]);
    }
  }, [isLoggedIn]);

  const fetchArtifacts = useCallback(async () => {
    if (!isLoggedIn) {
      setArtifacts([]);
      return;
    }
    try {
      const res = await apiClient.get(`${API_BASE_URL}/study/artifacts`);
      setArtifacts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setArtifacts([]);
    }
  }, [isLoggedIn]);

  const refreshDashboardData = useCallback(() => {
    fetchStudyData();
    fetchDueReviews();
    fetchArtifacts();
  }, [fetchStudyData, fetchDueReviews, fetchArtifacts]);

  const fetchTopics = useCallback(async (examId) => {
    if (!examId) {
      setTopics([]);
      return;
    }
    try {
      const res = await apiClient.get(`${API_BASE_URL}/exams/${examId}/topics`);
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTopics([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (step === 'dashboard') {
      if (isLoggedIn) {
        fetchDocuments();
        refreshDashboardData();
      }
    }
  }, [step, isLoggedIn, fetchDocuments, refreshDashboardData]);

  useEffect(() => {
    if (selectedExamId) fetchTopics(selectedExamId);
  }, [selectedExamId, fetchTopics]);

  useEffect(() => {
    if (step !== 'dashboard') return;
    if (chatSessions.length === 0) {
      startGeneralSession();
    } else if (!activeSessionId || !chatSessions.some(s => s.id === activeSessionId)) {
      saveActiveSessionId(chatSessions[0].id, chatStorageKey);
      setActiveSessionId(chatSessions[0].id);
    }
  }, [step, chatSessions.length, activeSessionId, startGeneralSession]);

  const applyAuth = useCallback(
    (data) => {
      const uname = data.username || loginData.username;
      setRole(data.role);
      setUsername(uname);
      saveAuth({ role: data.role, username: uname });
      switchToChatUser(uname);
      setStep('dashboard');
      setLoginData({ username: '', password: '' });
      fetchDocuments();
      refreshDashboardData();
    },
    [loginData.username, switchToChatUser, fetchDocuments, refreshDashboardData]
  );

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    clearMessage();
    if (!loginData.username || !loginData.password) {
      return setMessage({ type: 'error', text: 'Please enter both username and password.' });
    }
    setLoading(true);
    try {
      const response = await apiClient.post(`${AUTH_API_URL}/login`, {
        username: loginData.username,
        password: loginData.password,
        user_type: 'admin',
      });
      const data = response.data;
      if (data.role !== 'admin') throw new Error('Admin credentials required.');
      applyAuth(data);
      setMessage({ type: 'success', text: 'Admin login successful!' });
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        (error.message?.includes('Access denied') ? error.message : 'Login failed.');
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    clearMessage();
    if (!loginData.username || !loginData.password) {
      return setMessage({ type: 'error', text: 'Please enter both username and password.' });
    }
    setLoading(true);
    try {
      const response = await apiClient.post(`${AUTH_API_URL}/login`, {
        username: loginData.username,
        password: loginData.password,
        user_type: 'user',
      });
      const data = response.data;
      if (data.role !== 'user') throw new Error('Student credentials required.');
      applyAuth(data);
      setMessage({ type: 'success', text: 'Signed in! Your study data is saved to your account.' });
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed. Check your username and password.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignup = async (e) => {
    e.preventDefault();
    clearMessage();
    const passwordError = validatePassword(signupData.password);
    if (!signupData.username.trim()) {
      return setMessage({ type: 'error', text: 'Username is mandatory.' });
    }
    if (passwordError) return setMessage({ type: 'error', text: passwordError });
    const emailError = validateEmail(signupData.email);
    if (emailError) return setMessage({ type: 'error', text: emailError });
    if (!signupData.name.trim()) {
      return setMessage({ type: 'error', text: 'Full name is mandatory.' });
    }
    setLoading(true);
    try {
      await apiClient.post(`${AUTH_API_URL}/signup`, { ...signupData, role_type: 'user' });
      setMessage({ type: 'success', text: 'Account created! Sign in to access your saved study data.' });
      setStep('student_login');
      setSignupData({
        username: signupData.username,
        password: '',
        name: signupData.name,
        email: signupData.email,
        contact: signupData.contact,
        address: signupData.address,
        designation: 'Student',
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Signup failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post(`${AUTH_API_URL}/logout`);
    } catch {
      /* clear local state even if logout request fails */
    }
    clearAuth();
    setRole(null);
    setUsername(null);
    setStep('dashboard');
    setConfirmLogout(false);
    setLoginData({ username: '', password: '' });
    clearMessage();
    closePanel();
    sseMapRef.current.forEach(es => { try { es.close(); } catch {} });
    sseMapRef.current.clear();
    pollTimersRef.current.forEach(id => clearInterval(id));
    pollTimersRef.current.clear();
    setDocuments([]);
    setSubjects([]);
    setPacks([]);
    setExams([]);
    setTopics([]);
    switchToChatUser('guest');
    fetchDocuments();
    refreshDashboardData();
    if (loadSessions('guest').length === 0) {
      startGeneralSession();
    }
  };

  const getProfileContext = () => profileContextLine(loadStudentProfile());

  const handleOpenArtifact = async (artifactId, typeHint, artifactRow) => {
    try {
      let row = artifactRow;
      if (!row?.contentJson) {
        const res = await apiClient.get(`${API_BASE_URL}/study/artifacts/${artifactId}`);
        row = { ...res.data, contentJson: res.data.content };
      }
      const content = row.contentJson || row.content || '';
      if (typeHint === 'flashcards' || row.type === 'FLASHCARDS') {
        setStudyViewer({
          type: 'flashcards',
          content,
          artifactId: row.id || artifactId,
          title: row.title || 'Flashcards',
        });
      } else if (typeHint === 'quiz' || row.type === 'MCQ_QUIZ') {
        setStudyViewer({ type: 'quiz', content, title: row.title || 'Quiz' });
      } else {
        injectBotMessage(content, row.title || 'Study material');
      }
      closePanel();
    } catch {
      setMessage({ type: 'error', text: 'Could not open saved study material.' });
    }
  };

  const handleStartDueReview = async () => {
    if (!dueReviews.length) return;
    await handleOpenArtifact(dueReviews[0].artifactId, 'flashcards');
  };

  const uploadDocumentFile = useCallback(async (file, { fromComposer = false } = {}) => {
    const validationErr = fileValidationError(file);
    if (validationErr) {
      setMessage({ type: 'error', text: validationErr });
      return null;
    }

    if (fromComposer) {
      setAttachUploading(true);
      setAttachFileName(file.name);
    } else {
      setLoading(true);
      setUploadMessage(`Uploading ${file.name}...`);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newDoc = {
        id: response.data.documentId,
        fileName: file.name,
        sizeInKb: Math.round(file.size / 1024),
        status: 'PROCESSING',
        uploadDate: new Date().toISOString(),
      };
      setDocuments(prev => [newDoc, ...prev]);
      attachStatusListeners(newDoc.id);
      fetchDocuments();

      if (fromComposer) {
        const attachMsg = `📎 "${file.name}" attached and processing. You can ask questions once it's ready — answers will use your document.`;
        const session = createSession({
          mode: 'document',
          documentId: newDoc.id,
          documentName: file.name,
        });
        session.messages = [{ id: 'welcome', sender: 'bot', message: attachMsg }];
        setChatSessions(prev => {
          const next = upsertSession(prev, session);
          saveSessions(next, chatStorageKey);
          saveActiveSessionId(session.id, chatStorageKey);
          setActiveSessionId(session.id);
          return next;
        });
        setMessage({
          type: 'success',
          text: `${file.name} attached — processing for document chat.`,
        });
      } else {
        setUploadMessage(`Success! ${response.data.message || 'File sent for processing.'}`);
      }
      return newDoc.id;
    } catch (error) {
      const errText = error.response?.data?.message || 'Upload failed. Try again.';
      if (fromComposer) setMessage({ type: 'error', text: errText });
      else setUploadMessage(`Upload failed: ${errText}`);
      return null;
    } finally {
      if (fromComposer) {
        setAttachUploading(false);
        setAttachFileName(null);
      } else {
        setLoading(false);
      }
    }
  }, [attachStatusListeners, fetchDocuments, chatStorageKey]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadMessage('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file to upload.');
      return;
    }
    await uploadDocumentFile(selectedFile, { fromComposer: false });
    setSelectedFile(null);
    const input = document.getElementById('file-upload-input');
    if (input) input.value = '';
  };

  const handleComposerAttach = async (file) => {
    await uploadDocumentFile(file, { fromComposer: true });
  };

  const resolveDocIdForChat = () => {
    if (selectedDocId) return selectedDocId;
    if (activePackId) {
      const pack = packs.find(p => p.id === activePackId);
      const first = pack?.packDocuments?.[0]?.documentId;
      return first ?? null;
    }
    return null;
  };

  const injectBotMessage = (text, toolLabel) => {
    updateActiveSession(session => ({
      ...session,
      messages: [
        ...session.messages,
        {
          id: `study_${Date.now()}`,
          sender: 'bot',
          message: toolLabel ? `**${toolLabel}**\n\n${text}` : text,
        },
      ],
    }));
  };

  const runStudyTool = async (toolId) => {
    const docId = resolveDocIdForChat();
    if (!docId && !activePackId) {
      setMessage({ type: 'error', text: 'Select a processed document or study pack first.' });
      return;
    }
    setRunningStudyTool(toolId);
    setStudyLoading(true);
    try {
      const res = await apiClient.post(
        `${API_BASE_URL}/study/${toolId}`,
        { documentId: docId, packId: activePackId }
      );
      const content = res.data.content;
      const artifactId = res.data.artifactId;

      if (toolId === 'flashcards' && artifactId) {
        setStudyViewer({ type: 'flashcards', content, artifactId, title: 'Flashcards' });
        closePanel();
      } else if (toolId === 'mcq-quiz' && artifactId) {
        setStudyViewer({ type: 'quiz', content, title: 'Practice Quiz' });
        closePanel();
      } else {
        const labels = {
          notes: 'Study Notes',
          'exam-summary': 'Exam Summary',
          eli15: 'Explain Simply',
          topics: 'Key Topics',
        };
        const label = labels[toolId] || 'Study Output';
        injectBotMessage(content, label);
        if (toolId === 'notes') downloadText('study-notes.md', content, 'text/markdown');
      }
      setMessage({ type: 'success', text: 'Study material generated!' });
      fetchArtifacts();
      fetchDueReviews();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Study tool failed. Is the document processed?',
      });
    } finally {
      setRunningStudyTool(null);
      setStudyLoading(false);
    }
  };

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId);
    const pack = packs.find(p => p.id === packId);
    if (!pack) return;
    const session = createSession({
      mode: 'document',
      packId,
      packName: pack.name,
      documentId: pack.packDocuments?.[0]?.documentId ?? null,
      documentName: pack.name,
    });
    session.messages = [
      {
        id: 'welcome',
        sender: 'bot',
        message: `Study pack "${pack.name}" is ready with ${(pack.packDocuments || []).length} document(s). Use Study Tools or ask questions across all materials.`,
      },
    ];
    setChatSessions(prev => {
      const next = upsertSession(prev, session);
      saveSessions(next, chatStorageKey);
      saveActiveSessionId(session.id, chatStorageKey);
      setActiveSessionId(session.id);
      return next;
    });
  };

  const handleCreateSubject = async (name) => {
    try {
      await apiClient.post(`${API_BASE_URL}/subjects`, { name });
      fetchStudyData();
    } catch {}
  };

  const handleCreatePack = async (name, documentIds) => {
    try {
      await apiClient.post(
        `${API_BASE_URL}/packs`,
        { name, documentIds }
      );
      fetchStudyData();
      setMessage({ type: 'success', text: 'Study pack created!' });
    } catch {
      setMessage({ type: 'error', text: 'Could not create pack.' });
    }
  };

  const handleDeletePack = async (packId) => {
    try {
      await apiClient.delete(`${API_BASE_URL}/packs/${packId}`);
      if (selectedPackId === packId) setSelectedPackId(null);
      fetchStudyData();
    } catch {}
  };

  const handleCreateExam = async ({ title, examDate, packId: examPackId }) => {
    try {
      const res = await apiClient.post(
        `${API_BASE_URL}/exams`,
        { title, examDate: examDate || null, packId: examPackId || null }
      );
      setExams(prev => [res.data, ...prev]);
      setSelectedExamId(res.data.id);
    } catch {}
  };

  const handleGenerateTopics = async (examId, documentId, packIdForTopics) => {
    setStudyLoading(true);
    try {
      const body = {};
      if (documentId) body.documentId = documentId;
      if (packIdForTopics) body.packId = packIdForTopics;
      const res = await apiClient.post(
        `${API_BASE_URL}/exams/${examId}/topics/generate`,
        body
      );
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessage({ type: 'error', text: 'Could not generate topics.' });
    } finally {
      setStudyLoading(false);
    }
  };

  const handleGenerateRevisionPlan = async ({ examId, packId, days }) => {
    setStudyLoading(true);
    try {
      const res = await apiClient.post(
        `${API_BASE_URL}/study/revision-plan`,
        { examId, packId, days, profileContext: getProfileContext() }
      );
      injectBotMessage(res.data.content, 'Revision plan');
      fetchArtifacts();
      closePanel();
      setMessage({ type: 'success', text: 'Revision plan ready in chat!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Could not generate revision plan.',
      });
    } finally {
      setStudyLoading(false);
    }
  };

  const handleUpdateTopic = async (topicId, status) => {
    try {
      await apiClient.patch(`${API_BASE_URL}/topics/${topicId}`, { status });
      setTopics(prev => prev.map(t => (t.id === topicId ? { ...t, status } : t)));
    } catch {}
  };

  const handleRateCard = async (artifactId, cardIndex, quality) => {
    await apiClient.post(
      `${API_BASE_URL}/study/reviews/rate`,
      { artifactId, cardIndex, quality }
    );
    fetchDueReviews();
  };

  const sendMessage = async (text) => {
    const userMessage = text.trim();
    if (!userMessage || isBotTyping || !activeSession) return;
    const docId = resolveDocIdForChat();
    if (!isGeneralChat && !docId) return;

    const history = buildChatHistory(chatMessages);

    setUserInput('');
    const userMsg = { id: `u_${Date.now()}`, sender: 'user', message: userMessage };

    updateActiveSession(session => {
      const isFirstUser = !session.messages.some(m => m.sender === 'user');
      return {
        ...session,
        title: isFirstUser
          ? userMessage.slice(0, 42) + (userMessage.length > 42 ? '…' : '')
          : session.title,
        messages: [...session.messages, userMsg],
      };
    });

    setIsBotTyping(true);
    const profileContext = getProfileContext();
    try {
      const response = isGeneralChat
        ? await apiClient.post(
            `${API_BASE_URL}/chat`,
            { query: userMessage, history, profileContext }
          )
        : await apiClient.post(
            `${API_BASE_URL}/query`,
            { query: userMessage, documentId: docId, profileContext }
          );
      const botMsg = {
        id: `b_${Date.now()}`,
        sender: 'bot',
        message: response.data.answer,
      };
      updateActiveSession(session => ({
        ...session,
        messages: [...session.messages, botMsg],
      }));
    } catch {
      updateActiveSession(session => ({
        ...session,
        messages: [
          ...session.messages,
          {
            id: `e_${Date.now()}`,
            sender: 'bot',
            message: 'Sorry — I could not reach the AI service. Try again.',
          },
        ],
      }));
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  const handleNewChat = () => {
    startGeneralSession({ forceNew: true });
  };

  const handleNewDocumentChat = () => {
    const first = documents.find(d => d.status === 'PROCESSED');
    if (first) startSessionForDoc(first.id, { forceNew: true });
    else openPanel('documents');
  };

  const handleSelectDocument = (docId) => {
    startSessionForDoc(docId);
    closePanel();
  };

  const handleDeleteDocument = async (docId) => {
    setDeletingDocId(docId);
    try {
      await apiClient.delete(`${API_BASE_URL}/documents/${docId}`);
      cleanupDocListeners(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));

      const remaining = chatSessions.filter(s => s.documentId !== docId);
      const viewingDeleted = activeSession?.documentId === docId;
      setChatSessions(remaining);
      saveSessions(remaining, chatStorageKey);

      if (viewingDeleted) {
        if (remaining.length === 0) {
          startGeneralSession();
        } else {
          saveActiveSessionId(remaining[0].id, chatStorageKey);
          setActiveSessionId(remaining[0].id);
        }
      }

      setMessage({ type: 'success', text: 'Document deleted.' });
    } catch (error) {
      const errText = error.response?.data?.message || 'Could not delete document.';
      setMessage({ type: 'error', text: errText });
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleSelectSession = (sessionId) => {
    persistSessions(chatSessions, sessionId);
  };

  const handleDeleteSession = (sessionId) => {
    const next = deleteSession(chatSessions, sessionId);
    const newActive = activeSessionId === sessionId ? (next[0]?.id ?? null) : activeSessionId;
    persistSessions(next, newActive);
  };

  const renderMessage = (authStyle = false) => {
    if (!message.text) return null;
    const base = authStyle
      ? 'mb-4 flex items-start gap-3 rounded-xl p-3 text-sm whitespace-pre-wrap'
      : 'fixed top-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl p-4 text-sm shadow-xl';
    const classes = authStyle
      ? message.type === 'success'
        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border border-red-200 bg-red-50 text-red-800'
      : message.type === 'success'
        ? 'bg-emerald-600 text-white'
        : 'bg-red-600 text-white';
    const Icon = message.type === 'success' ? CheckCircle : XCircle;
    const dismissBtnClass = authStyle
      ? 'ml-auto shrink-0 rounded p-0.5 opacity-60 hover:opacity-100'
      : 'ml-auto shrink-0 rounded p-0.5 text-white/80 hover:text-white';
    return (
      <motion.div
        key={`${message.type}-${message.text}`}
        role="status"
        aria-live="polite"
        className={`${base} ${classes}`}
        initial={authStyle && reduceMotion ? false : { opacity: 0, x: authStyle ? 0 : 20, height: authStyle ? 0 : undefined }}
        animate={{ opacity: 1, x: 0, height: authStyle ? 'auto' : undefined }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: authStyle ? 0 : 20 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">{message.text}</span>
        <button
          type="button"
          onClick={clearMessage}
          className={dismissBtnClass}
          aria-label="Dismiss notification"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </motion.div>
    );
  };

  const renderLoginForm = (onSubmit, title, subtitle) => (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-5"
      variants={formVariants}
      initial={reduce ? false : 'hidden'}
      animate={reduce ? false : 'show'}
    >
      <motion.div variants={fieldVariants}>
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </motion.div>
      <motion.div variants={fieldVariants}>
        <AuthFormField
          icon={User}
          type="text"
          placeholder="Username"
          value={loginData.username}
          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
          required
        />
      </motion.div>
      <motion.div variants={fieldVariants}>
        <AuthFormField
          icon={Lock}
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          required
        />
      </motion.div>
      <motion.div variants={fieldVariants} className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            setLoginData({ username: '', password: '' });
            setStep('dashboard');
            clearMessage();
          }}
          className="auth-btn-secondary"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to app
        </button>
        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? <Loader className="h-5 w-5 animate-spin" /> : 'Sign in'}
        </button>
      </motion.div>
    </motion.form>
  );

  const chatTopBar = (
    <header className="chat-topbar flex items-center justify-between px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 md:text-base">
            {activeSession?.title || 'Texton AI'}
          </h1>
          <p className="text-xs text-slate-500">
            {isAdmin ? 'Admin · ' : isStudent ? `${username} · ` : 'Guest · '}
            {isGeneralChat
              ? 'General study chat'
              : activePack?.name || activeDoc?.fileName || 'Document chat'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:inline">
          {!isLoggedIn
            ? 'Guest mode'
            : isGeneralChat
              ? 'Study chat'
              : activePackId
                ? 'Study pack · RAG'
                : 'Document · RAG'}
        </span>
        {isLoggedIn && (
          <div className="relative">
            {confirmLogout ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <span className="text-xs text-red-800">Logout?</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="text-xs text-slate-600"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Power className="h-3.5 w-3.5" /> Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );

  const renderStudentSignupForm = () => (
    <motion.form
      onSubmit={handleStudentSignup}
      className="space-y-4"
      variants={formVariants}
      initial={reduce ? false : 'hidden'}
      animate={reduce ? false : 'show'}
    >
      <motion.div variants={fieldVariants}>
        <h3 className="text-2xl font-bold text-slate-900">Create student account</h3>
        <p className="mt-1 text-sm text-slate-500">Save documents, courses, exams, and chat history</p>
      </motion.div>
      <motion.div variants={fieldVariants}>
        <AuthFormField
          icon={User}
          type="text"
          placeholder="Username"
          value={signupData.username}
          onChange={e => setSignupData({ ...signupData, username: e.target.value })}
          required
        />
      </motion.div>
      <motion.div variants={fieldVariants}>
        <AuthFormField
          icon={Lock}
          type="password"
          placeholder="Password"
          value={signupData.password}
          onChange={e => setSignupData({ ...signupData, password: e.target.value })}
          required
        />
        <p className="mt-2 text-xs text-slate-500">
          At least 8 characters with uppercase, number, and special character.
        </p>
      </motion.div>
      <motion.div variants={fieldVariants}>
        <AuthFormField
          icon={User}
          type="text"
          placeholder="Full name"
          value={signupData.name}
          onChange={e => setSignupData({ ...signupData, name: e.target.value })}
          required
        />
      </motion.div>
      <motion.div variants={fieldVariants}>
        <AuthFormField
          icon={Mail}
          type="email"
          placeholder="Email"
          value={signupData.email}
          onChange={e => setSignupData({ ...signupData, email: e.target.value })}
          required
        />
      </motion.div>
      <motion.div variants={fieldVariants} className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            setStep('dashboard');
            clearMessage();
          }}
          className="auth-btn-secondary"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Continue as guest
        </button>
        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? <Loader className="h-5 w-5 animate-spin" /> : 'Create account'}
        </button>
      </motion.div>
    </motion.form>
  );

  if (step === 'student_login') {
    return (
      <AuthSplitLayout userType="Student" step="login">
        <AuthTabSwitcher
          activeTab="login"
          onLogin={() => setStep('student_login')}
          onSignup={() => { setStep('student_signup'); clearMessage(); }}
        />
        <AnimatePresence mode="wait">{renderMessage(true)}</AnimatePresence>
        {renderLoginForm(
          handleStudentLogin,
          'Sign in to save your work',
          'Your documents, courses, exams, and chats stay on your account'
        )}
        <button
          type="button"
          onClick={() => { setStep('dashboard'); clearMessage(); }}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-indigo-600"
        >
          Continue without signing in
        </button>
      </AuthSplitLayout>
    );
  }

  if (step === 'student_signup') {
    return (
      <AuthSplitLayout userType="Student" step="signup">
        <AuthTabSwitcher
          activeTab="signup"
          onLogin={() => { setStep('student_login'); clearMessage(); }}
          onSignup={() => setStep('student_signup')}
        />
        <AnimatePresence mode="wait">{renderMessage(true)}</AnimatePresence>
        {renderStudentSignupForm()}
      </AuthSplitLayout>
    );
  }

  if (step === 'admin_login') {
    return (
      <AuthSplitLayout userType="Admin" step="login">
        <span className="mb-6 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
          Admin Portal
        </span>
        <AnimatePresence mode="wait">{renderMessage(true)}</AnimatePresence>
        {renderLoginForm(
          handleAdminLogin,
          'Admin sign in',
          'Administrators only'
        )}
      </AuthSplitLayout>
    );
  }

  if (step === 'dashboard') {
    return (
      <div className="chat-app-shell flex h-screen overflow-hidden font-sans">
        <ChatSidebar
          sessions={chatSessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onNewDocumentChat={handleNewDocumentChat}
          onDeleteSession={handleDeleteSession}
          documents={documents}
          selectedDocId={selectedDocId}
          onSelectDocument={handleSelectDocument}
          onOpenDocuments={() => openPanel('documents')}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          isAdmin={isAdmin}
          isLoggedIn={isLoggedIn}
          username={username}
          onStudentLogin={!isLoggedIn ? () => { setStep('student_login'); clearMessage(); } : undefined}
          onStudentSignup={!isLoggedIn ? () => { setStep('student_signup'); clearMessage(); } : undefined}
          onAdminLogin={!isAdmin ? () => { setStep('admin_login'); clearMessage(); } : undefined}
          onLogout={isLoggedIn ? handleLogout : undefined}
          processedCount={processedCount}
          packs={packs}
          selectedPackId={selectedPackId}
          onSelectPack={handleSelectPack}
          onOpenStudyHub={() => openPanel('studyHub')}
          dueReviewCount={dueReviewCount}
          onOpenStudyTools={() => openPanel('studyTools')}
        />

        <main className="chat-main relative flex min-w-0 flex-1 flex-col">
          <AnimatePresence>
            {activePanel && <OverlayScrim key="scrim" onClose={closePanel} />}
          </AnimatePresence>

          <ChatWorkspace
            messages={chatMessages}
            isBotTyping={isBotTyping}
            userInput={userInput}
            onUserInputChange={setUserInput}
            onSubmit={handleQuerySubmit}
            chatMode={chatMode}
            documentName={activePack?.name || activeDoc?.fileName}
            hasStudyContext={!!resolveDocIdForChat() || !!activePackId}
            onSuggestionClick={sendMessage}
            topBar={chatTopBar}
            onFileAttach={handleComposerAttach}
            attachUploading={attachUploading}
            attachFileName={attachFileName}
            exams={exams}
            dueReviews={dueReviews}
            dueReviewCount={dueReviewCount}
            processedCount={processedCount}
            activePackName={activePackName}
            packsCount={packs.length}
            onNewChat={handleNewChat}
            onOpenDocuments={() => openPanel('documents')}
            onOpenStudyTools={() => openPanel('studyTools')}
            onOpenStudyHub={() => openPanel('studyHub')}
            onStartDueReview={handleStartDueReview}
          />

          <StudyToolsPanel
            open={activePanel === 'studyTools'}
            onClose={closePanel}
            onRunTool={runStudyTool}
            runningTool={runningStudyTool}
            documentName={activeDoc?.fileName}
            packName={activePack?.name}
            disabled={!resolveDocIdForChat() && !activePackId}
          />

          {studyViewer?.type === 'flashcards' && (
            <div className="absolute inset-0 z-[50] bg-white">
              <FlashcardViewer
                content={studyViewer.content}
                title={studyViewer.title}
                artifactId={studyViewer.artifactId}
                onRate={handleRateCard}
                onClose={() => setStudyViewer(null)}
              />
            </div>
          )}
          {studyViewer?.type === 'quiz' && (
            <div className="absolute inset-0 z-[50] bg-white">
              <QuizViewer
                content={studyViewer.content}
                title={studyViewer.title}
                timed
                onClose={() => setStudyViewer(null)}
              />
            </div>
          )}

          <StudyHubPanel
            open={activePanel === 'studyHub'}
            onClose={closePanel}
            dueReviews={dueReviews}
            artifacts={artifacts}
            onOpenArtifact={handleOpenArtifact}
            onStartDueReview={handleStartDueReview}
            onProfileSaved={() => {}}
            coursesProps={{
              subjects,
              packs,
              documents,
              onCreateSubject: handleCreateSubject,
              onCreatePack: handleCreatePack,
              onSelectPack: id => {
                handleSelectPack(id);
                closePanel();
              },
              onDeletePack: handleDeletePack,
              selectedPackId,
            }}
            examProps={{
              exams,
              topics,
              packs,
              selectedExamId,
              onSelectExam: setSelectedExamId,
              onCreateExam: handleCreateExam,
              onGenerateTopics: handleGenerateTopics,
              onUpdateTopic: handleUpdateTopic,
              onGenerateRevisionPlan: handleGenerateRevisionPlan,
              loading: studyLoading,
              documentId: resolveDocIdForChat(),
            }}
          />

          <AnimatePresence>
            {activePanel === 'documents' && (
              <DocumentsPanel
                documents={documents}
                selectedFile={selectedFile}
                onFileChange={handleFileChange}
                onUpload={handleFileUpload}
                loading={loading}
                uploadMessage={uploadMessage}
                onSelectDoc={handleSelectDocument}
                onDeleteDoc={handleDeleteDocument}
                deletingDocId={deletingDocId}
                onClose={closePanel}
                selectedDocId={selectedDocId}
              />
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence mode="wait">{renderMessage()}</AnimatePresence>
      </div>
    );
  }

  return null;
};

export default App;
