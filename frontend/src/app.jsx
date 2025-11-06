import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Power, ArrowLeft, Loader2 as Loader, Lock, User, Mail, CheckCircle, XCircle, Send, Upload, Bot, FileText } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';
const AUTH_API_URL = 'http://localhost:8080/auth';

const PasswordRequirements = () => (
  <div className="text-xs text-gray-600 mt-1 p-2 bg-blue-100 rounded-md border border-blue-200">
    Password must be at least 8 characters long and contain:
    <ul className="list-disc list-inside mt-1 space-y-0.5">
      <li>One uppercase letter</li>
      <li>One number</li>
      <li>One special character (@, #, $, etc.)</li>
    </ul>
  </div>
);

const ChatMessage = ({ message, sender }) => (
  <div className={`flex w-full ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
    <div className={`max-w-3/4 rounded-3xl p-4 shadow-xl text-sm transition-all ${
      sender === 'user'
        ? 'bg-indigo-600 text-white rounded-br-md hover:bg-indigo-700'
        : 'bg-white text-gray-800 rounded-tl-md border border-gray-200 hover:shadow-lg'
    }`}>
      {message}
    </div>
  </div>
);

const DocumentTable = ({ documents, setSelectedDocId }) => (
  <div className="overflow-x-auto bg-white p-6 rounded-2xl shadow-2xl border border-gray-100">
    <h2 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center">
      <FileText className="w-7 h-7 mr-3 text-indigo-600" />
      Uploaded Documents
    </h2>

    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-indigo-50 border-b-2 border-indigo-200">
        <tr>
          {['File Name', 'Size', 'Status', 'Date Uploaded', 'Actions'].map((header) => (
            <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {documents.length === 0 ? (
          <tr><td colSpan="5" className="p-6 text-center text-gray-500 italic">No documents found. Upload one to start!</td></tr>
        ) : (
          documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-indigo-50 transition duration-300 ease-in-out">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">{doc.fileName}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{doc.sizeInKb ?? doc.size} KB</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <span className={`px-3 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                  doc.status === 'PROCESSED'
                    ? 'bg-green-500 text-white'
                    : doc.status === 'FAILED'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-400 text-gray-900 animate-pulse'
                }`}>
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {doc.uploadDate?.substring(0, 10) ?? ''}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => setSelectedDocId(doc.id)}
                  disabled={doc.status !== 'PROCESSED'}
                  className={`text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-md ${
                    doc.status !== 'PROCESSED'
                      ? 'bg-gray-400 cursor-not-allowed opacity-70'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Ask AI
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const App = () => {
  const [step, setStep] = useState('user_type');
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [userType, setUserType] = useState(null);
  const [message, setMessage] = useState({ type: null, text: null });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Documents');

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [signupData, setSignupData] = useState({
    username: '', password: '', name: '', email: '', contact: '', address: '', designation: 'User'
  });
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const messagesEndRef = useRef(null);
  const sseMapRef = useRef(new Map());      // docId -> EventSource
  const pollTimersRef = useRef(new Map());  // docId -> intervalId

  const clearMessage = () => setMessage({ type: null, text: null });

  const validatePassword = (password) => {
    const specialCharacters = /[!@#$%^&*()<>?/|~:]/;
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one capital letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (!specialCharacters.test(password)) return "Password must contain at least one special character.";
    return null;
  };
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Please enter a valid email address.";
  const getExpectedRole = (type) => (type === "Admin" ? "admin" : "user");
  const formatRole = (roleName) => (!roleName ? 'Guest' : roleName.charAt(0).toUpperCase() + roleName.slice(1));

  // --- API helpers ---
  const authHeader = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/documents`, { headers: authHeader() });
      const list = Array.isArray(res.data) ? res.data : [];
      setDocuments(list);

      // (re)attach SSE/polling for any docs that are PROCESSING
      list.forEach(d => {
        if (d.status === 'PROCESSING') {
          attachStatusListeners(d.id);
        } else {
          cleanupDocListeners(d.id); // ensure we don't keep polling/SSE for processed
        }
      });
    } catch (e) {
      // keep quiet in UI, but log
      console.error('Failed to load documents', e);
    }
  }, [token, authHeader]);

  // SSE + polling manager
  const attachStatusListeners = useCallback((docId) => {
    // SSE first (preferred)
    if (!sseMapRef.current.has(docId)) {
      try {
        const es = new EventSource(`${API_BASE_URL}/documents/${docId}/stream?token=${encodeURIComponent(token)}`);
        sseMapRef.current.set(docId, es);

        es.onmessage = (evt) => {
          // expect payload like: { documentId, status }
          try {
            const payload = JSON.parse(evt.data);
            if (payload?.status) {
              setDocuments(prev =>
                prev.map(d => d.id === docId ? { ...d, status: payload.status } : d)
              );
              if (payload.status === 'PROCESSED' || payload.status === 'FAILED') {
                cleanupDocListeners(docId);
              }
            }
          } catch {
            // non-JSON fallback: treat full text as status
            const statusText = String(evt.data || '').trim();
            if (statusText) {
              setDocuments(prev =>
                prev.map(d => d.id === docId ? { ...d, status: statusText } : d)
              );
              if (statusText === 'PROCESSED' || statusText === 'FAILED') {
                cleanupDocListeners(docId);
              }
            }
          }
        };

        es.onerror = () => {
          // SSE may be blocked (ownership/auth), so fallback to polling
          es.close();
          sseMapRef.current.delete(docId);
          ensurePolling(docId);
        };
      } catch {
        ensurePolling(docId);
      }
    }

    // start polling as backup immediately too (ensures UI moves even if SSE is delayed)
    ensurePolling(docId);
  }, [token]);

  const ensurePolling = (docId) => {
    if (pollTimersRef.current.has(docId)) return;
    const id = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/documents`, { headers: authHeader() });
        const list = Array.isArray(res.data) ? res.data : [];
        const updated = list.find(d => d.id === docId);
        if (updated) {
          setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
          if (updated.status === 'PROCESSED' || updated.status === 'FAILED') {
            cleanupDocListeners(docId);
          }
        }
      } catch (e) {
        // stop polling on persistent errors
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
      // on unmount cleanup all
      sseMapRef.current.forEach(es => { try { es.close(); } catch {} });
      sseMapRef.current.clear();
      pollTimersRef.current.forEach(id => clearInterval(id));
      pollTimersRef.current.clear();
    };
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isBotTyping]);

  // When doc selected, move to Chat and greet
  useEffect(() => {
    if (selectedDocId) {
      setActiveTab('Chat');
      const doc = documents.find(d => d.id === selectedDocId);
      if (doc) {
        setChatHistory([
          { sender: 'bot', message: `Hello! I'm your AI assistant. I am now analyzing '${doc.fileName}'. What questions do you have about its content?` }
        ]);
      }
    }
  }, [selectedDocId, documents]);

  // After login, load documents
  useEffect(() => {
    if (step === 'dashboard' && token) {
      fetchDocuments();
    }
  }, [step, token, fetchDocuments]);

  // --- Auth handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessage();
    if (!loginData.username || !loginData.password) {
      return setMessage({ type: 'error', text: 'Please enter both username and password.' });
    }
    setLoading(true);
    try {
      const expectedRole = getExpectedRole(userType);
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        username: loginData.username,
        password: loginData.password,
        user_type: expectedRole
      });
      const data = response.data;
      if (data.role !== expectedRole) {
        throw new Error(`Access denied. Portal does not match user role (${data.role}).`);
      }
      setToken(data.access_token);
      setRole(data.role);
      setStep('dashboard');
      setMessage({ type: 'success', text: 'Login successful!' });
    } catch (error) {
      const msg = error.response?.data?.error
        || (error.message?.includes("Access denied") ? error.message : 'Login failed. Please check credentials.');
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessage();
    const passwordError = validatePassword(signupData.password);
    if (!signupData.username) return setMessage({ type: 'error', text: 'Username is mandatory.' });
    if (passwordError) return setMessage({ type: 'error', text: passwordError });
    const emailError = validateEmail(signupData.email);
    if (emailError) return setMessage({ type: 'error', text: emailError });
    if (!signupData.name) return setMessage({ type: 'error', text: 'Full Name is mandatory.' });

    const role_type = 'user';
    setLoading(true);
    try {
      await axios.post(`${AUTH_API_URL}/signup`, { ...signupData, role_type });
      setMessage({ type: 'success', text: 'Account created successfully! Please log in.' });
      setStep('login');
      setSignupData({ username: '', password: '', name: '', email: '', contact: '', address: '', designation: 'User' });
    } catch (error) {
      const msg = error.response?.data?.error || 'Signup failed.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setUserType(null);
    setStep('user_type');
    setConfirmLogout(false);
    setLoginData({ username: '', password: '' });
    clearMessage();
    // cleanup listeners too
    sseMapRef.current.forEach(es => { try { es.close(); } catch {} });
    sseMapRef.current.clear();
    pollTimersRef.current.forEach(id => clearInterval(id));
    pollTimersRef.current.clear();
    setDocuments([]);
    setSelectedDocId(null);
  };

  // --- Upload & Query ---
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadMessage('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file to upload.');
      return;
    }
    setLoading(true);
    setUploadMessage(`Uploading ${selectedFile.name}...`);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeader(),
        },
      });

      setUploadMessage(`Success! ${response.data.message || 'File sent for processing.'}`);

      // Optimistically add placeholder row (PROCESSING)
      const newDoc = {
        id: response.data.documentId,
        fileName: selectedFile.name,
        sizeInKb: Math.round(selectedFile.size / 1024),
        status: 'PROCESSING',
        uploadDate: new Date().toISOString(),
      };
      setDocuments(prev => [newDoc, ...prev]);

      // attach listeners
      attachStatusListeners(newDoc.id);

      // refresh full list once
      fetchDocuments();

    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage(`Upload failed: ${error.response?.data?.message || 'Server connection error.'}`);
    } finally {
      setLoading(false);
      setSelectedFile(null);
      const input = document.getElementById('file-upload-input');
      if (input) input.value = '';
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedDocId) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setChatHistory(prev => [...prev, { sender: 'user', message: userMessage }]);
    setIsBotTyping(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/query`, {
        query: userMessage,
        documentId: selectedDocId,
      }, { headers: authHeader() });

      setChatHistory(prev => [...prev, { sender: 'bot', message: response.data.answer }]);
    } catch (error) {
      console.error("Query error:", error);
      setChatHistory(prev => [...prev, { sender: 'bot', message: `Error: Could not connect to AI service. Check backend connection (Gemini/ChromaDB/Spring Boot).` }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  // --- UI builders ---
  const renderMessage = () => {
    if (!message.text) return null;
    const base = "p-3 mt-4 rounded-lg shadow-lg text-sm flex items-start mb-4 whitespace-pre-wrap";
    const classes = message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
    const Icon = message.type === 'success' ? CheckCircle : XCircle;
    return (
      <div className={`${base} ${classes} animate-in fade-in duration-500`}>
        <Icon className="w-5 h-5 mr-3 mt-0.5" />
        {message.text}
      </div>
    );
  };

  const renderUploadControl = () => (
    <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 hover:shadow-indigo-300/50">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center">
        <Upload className="w-7 h-7 mr-3 text-indigo-600" />
        Document Ingestion
      </h2>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <input
          id="file-upload-input"
          type="file"
          onChange={handleFileChange}
          className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
          accept=".pdf,.docx,.txt"
        />
        <button
          onClick={handleFileUpload}
          disabled={!selectedFile || loading}
          className={`px-8 py-3 rounded-xl text-white font-bold transition duration-300 ease-in-out transform hover:scale-[1.02] shadow-lg flex items-center justify-center ${
            !selectedFile || loading
              ? 'bg-gray-400 cursor-not-allowed opacity-70'
              : 'bg-green-600 hover:bg-green-700 shadow-green-300/50'
          }`}
        >
          {loading ? <Loader className="animate-spin" /> : 'Upload & Process'}
        </button>
      </div>
      {uploadMessage && (
        <p className={`mt-4 text-base font-medium ${
          uploadMessage.includes('Success') ? 'text-green-600' : 'text-red-600'
        } animate-fadeIn`}>
          {uploadMessage}
        </p>
      )}
    </div>
  );

  const renderChatInterface = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl border border-gray-100">
      <div className="p-4 border-b border-indigo-200 bg-indigo-100 rounded-t-2xl">
        <h2 className="text-2xl font-extrabold text-indigo-800 flex items-center">
          <Bot className="w-7 h-7 mr-3 text-indigo-600" />
          Intelligent Document Q&A
        </h2>
        {selectedDocId ? (
          <p className="text-sm text-indigo-700 mt-1 font-mono bg-indigo-200/50 p-1 rounded-md inline-block">
            Active: {documents.find(d => d.id === selectedDocId)?.fileName}
          </p>
        ) : (
          <p className="text-sm text-red-600 mt-1">
            Please select a PROCESSED document from the Document Management tab.
          </p>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-gray-50">
        {chatHistory.map((msg, index) => (
          <ChatMessage key={index} message={msg.message} sender={msg.sender} />
        ))}
        {isBotTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white text-gray-500 rounded-3xl rounded-tl-md border border-gray-200 p-4 shadow-xl italic">
              <Loader className="inline mr-2 h-5 w-5 text-indigo-600 animate-spin" />
              Gemini AI is generating response...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleQuerySubmit} className="p-4 border-t border-gray-300 bg-white rounded-b-2xl">
        <div className="flex space-x-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isBotTyping || !selectedDocId}
            placeholder={selectedDocId ? "Ask a question about the document..." : "Select a document to chat..."}
            className="flex-grow p-4 border border-gray-300 rounded-xl text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
          />
          <button
            type="submit"
            disabled={isBotTyping || !userInput.trim() || !selectedDocId}
            className={`px-6 py-3 rounded-xl text-white font-bold transition duration-300 shadow-md flex items-center justify-center transform hover:scale-105 ${
              isBotTyping || !userInput.trim() || !selectedDocId
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-400/50'
            }`}
          >
            <Send className="w-5 h-5 mr-1" />
            Send
          </button>
        </div>
      </form>
    </div>
  );

  const renderDashboard = () => (
    <div className="text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Welcome, {formatRole(role)}!</h2>
        <div className="w-48">
          {confirmLogout ? (
            <div className="bg-red-200 p-3 rounded-lg shadow-xl border border-red-300 text-red-800">
              <p className="text-sm font-semibold mb-2">Are you sure?</p>
              <div className="flex space-x-2">
                <button
                  onClick={handleLogout}
                  className="flex-1 text-xs py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-md transition duration-200"
                >
                  Yes, Logout
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 text-xs py-1.5 bg-gray-400 text-gray-800 hover:bg-gray-500 rounded-md transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
            >
              <Power className="w-5 h-5 mr-2" /> Logout
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-300 mb-6 w-full">
        {['Documents', 'Chat'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-lg font-medium transition duration-200 ${
              activeTab === tab ? 'border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            {tab === 'Documents' && <FileText className="w-5 h-5 mr-2 inline" />}
            {tab === 'Chat' && <Bot className="w-5 h-5 mr-2 inline" />}
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[50vh] pt-4">
        {activeTab === 'Documents' && (
          <div className="space-y-6">
            {renderUploadControl()}
            <DocumentTable documents={documents} setSelectedDocId={setSelectedDocId} />
          </div>
        )}

        {activeTab === 'Chat' && (
          <div className="h-[75vh]">
            {renderChatInterface()}
          </div>
        )}

        {renderMessage()}
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <h3 className="text-2xl font-semibold text-gray-800">Sign In</h3>
      <div className="relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Username"
          value={loginData.username}
          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
          className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
          required
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
          required
        />
      </div>
      <div className="flex justify-between space-x-4 pt-4">
        <button
          type="button"
          onClick={() => {
            setUserType(null);
            setLoginData({ username: '', password: '' });
            setStep('user_type');
            clearMessage();
          }}
          className="btn w-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-200 flex items-center justify-center py-2.5 rounded-full font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn w-full bg-blue-600 text-white hover:bg-blue-700 transition duration-200 flex items-center justify-center py-2.5 rounded-full font-medium"
        >
          {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Sign In'}
        </button>
      </div>
    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSignup} className="space-y-4">
      <h3 className="text-2xl font-semibold text-gray-800">Create Account</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative col-span-2">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Username"
            value={signupData.username}
            onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
            className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
            required
          />
        </div>
        <div className="relative col-span-2">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="password"
            placeholder="Password"
            value={signupData.password}
            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
            className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
            required
          />
        </div>
      </div>
      <PasswordRequirements />
      <div className="relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Full Name"
          value={signupData.name}
          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
          className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="email"
            placeholder="Email"
            value={signupData.email}
            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Contact Number"
          value={signupData.contact}
          onChange={(e) => setSignupData({ ...signupData, contact: e.target.value })}
          className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
        />
      </div>
      <textarea
        placeholder="Address"
        value={signupData.address}
        onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
        className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 h-24"
      />
      <input
        type="text"
        placeholder="Designation (e.g., Engineer, Manager)"
        value={signupData.designation}
        onChange={(e) => setSignupData({ ...signupData, designation: e.target.value })}
        className="w-full bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition duration-200"
      />
      <div className="flex justify-between space-x-4 pt-4">
        <button
          type="button"
          onClick={() => { setStep('login'); clearMessage(); }}
          className="btn w-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-200 flex items-center justify-center py-2.5 rounded-full font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Sign In
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn w-full bg-green-600 text-white hover:bg-green-700 transition duration-200 flex items-center justify-center py-3 rounded-full font-medium"
        >
          {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Create Account'}
        </button>
      </div>
    </form>
  );

  const renderContent = () => {
    switch (step) {
      case 'user_type':
        return (
          <div className="space-y-6 w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-blue-200 animate-in fade-in duration-700">
            <h3 className="text-2xl font-semibold text-gray-900 text-center">Access Portal</h3>
            <p className="text-gray-700 text-center">Select your role to proceed:</p>
            <div className="flex flex-col space-y-4">
              {["General User", "Admin"].map(type => (
                <button
                  key={type}
                  onClick={() => setUserType(type)}
                  className={`w-full py-3 px-4 rounded-xl font-bold transition duration-200 text-white shadow-md ${
                    userType === type ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-400/50' : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={() => userType && setStep('login')}
              disabled={!userType}
              className={`w-full btn py-3 mt-4 rounded-full font-medium transition duration-200 ${
                !userType ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Continue to Login
            </button>
          </div>
        );
      case 'login':
      case 'signup': {
        const isLogin = step === 'login';
        const isAdminPortal = userType === 'Admin';
        return (
          <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-blue-200 animate-in fade-in duration-700">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{userType} Portal</h2>
            {renderMessage()}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => { setStep('login'); clearMessage(); }}
                className={`px-6 py-2 rounded-l-full font-semibold transition duration-200 ${
                  isLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                } ${isAdminPortal ? 'rounded-r-full' : ''}`}
              >
                Sign In
              </button>
              {!isAdminPortal && (
                <button
                  onClick={() => { setStep('signup'); clearMessage(); }}
                  className={`px-6 py-2 rounded-r-full font-semibold transition duration-200 ${
                    !isLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Sign Up
                </button>
              )}
            </div>
            {isLogin ? renderLoginForm() : !isAdminPortal ? renderSignupForm() : (
              <div className="text-center p-8 bg-gray-100 rounded-lg text-gray-700 border border-gray-300">
                <Lock className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="font-semibold">Administrative accounts cannot be created via this portal.</p>
                <p className="text-sm mt-1">Please use existing credentials to access the Admin Dashboard.</p>
              </div>
            )}
          </div>
        );
      }
      case 'dashboard':
        return (
          <div className="w-full max-w-7xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-blue-200 animate-in fade-in duration-700">
            {renderDashboard()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-50 font-sans relative">
      <header className="mb-8 mt-4 text-center">
        <h1 className="text-5xl font-extrabold text-indigo-700 flex items-center justify-center">
          <Bot className="w-10 h-10 mr-3 text-indigo-500" />
          Texton.ai
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Intelligent Document Platform</p>
      </header>

      {renderContent()}

      <footer className="mt-12 mb-4 text-center text-gray-500 text-xs">
        Built with React, Spring Boot, and Gemini AI.
      </footer>
    </div>
  );
};

export default App;
