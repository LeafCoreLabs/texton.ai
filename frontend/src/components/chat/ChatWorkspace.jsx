import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import StudentHomeDashboard from '../study/StudentHomeDashboard';
import TypingIndicator from './TypingIndicator';
import { PANEL_FADE, PANEL_SPRING } from '../../utils/panelMotion';

const ChatWorkspace = ({
  messages,
  isBotTyping,
  userInput,
  onUserInputChange,
  onSubmit,
  chatMode,
  documentName,
  hasStudyContext,
  onSuggestionClick,
  topBar,
  onFileAttach,
  attachUploading,
  attachFileName,
  exams,
  dueReviews,
  dueReviewCount,
  processedCount,
  activePackName,
  packsCount,
  onNewChat,
  onOpenDocuments,
  onOpenStudyTools,
  onOpenStudyHub,
  onStartDueReview,
}) => {
  const messagesEndRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const hasUserMessages = messages.some(m => m.sender === 'user');
  const showWelcome = !hasUserMessages && !isBotTyping;
  const isGeneral = chatMode === 'general';
  const canChat = isGeneral || !!documentName || !!hasStudyContext;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [messages, isBotTyping, reduceMotion]);

  return (
    <div className="relative z-0 flex h-full min-h-0 flex-1 flex-col bg-white">
      {topBar}
      <div className="chat-thread flex-1 overflow-y-auto chat-scrollbar-light">
        <AnimatePresence mode="wait">
          {showWelcome ? (
            <motion.div
              key="welcome"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={reduceMotion ? { duration: 0 } : PANEL_FADE}
            >
              <StudentHomeDashboard
                mode={chatMode}
                documentName={!isGeneral ? documentName : null}
                exams={exams}
                dueReviewCount={dueReviewCount}
                processedCount={processedCount}
                activePackName={activePackName}
                packsCount={packsCount}
                onSuggestionClick={onSuggestionClick}
                onNewChat={onNewChat}
                onOpenDocuments={onOpenDocuments}
                onOpenStudyTools={onOpenStudyTools}
                onOpenStudyHub={onOpenStudyHub}
                onStartDueReview={onStartDueReview}
                reduceMotion={reduceMotion}
              />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : PANEL_FADE}
            >
              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id ?? index}
                  message={msg.message}
                  sender={msg.sender}
                  reduceMotion={reduceMotion}
                />
              ))}
              <AnimatePresence>
                {isBotTyping && (
                  <motion.div
                    key="typing"
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
                    transition={reduceMotion ? { duration: 0 } : PANEL_SPRING}
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>
      <ChatComposer
        value={userInput}
        onChange={onUserInputChange}
        onSubmit={onSubmit}
        disabled={isBotTyping || (!canChat && !onFileAttach)}
        placeholder={
          isGeneral
            ? 'Message Texton AI...'
            : documentName
              ? 'Ask about your document...'
              : 'Select a document or start a general chat...'
        }
        chatMode={chatMode}
        documentName={!isGeneral ? documentName : null}
        onFileAttach={onFileAttach}
        attachUploading={attachUploading}
        attachFileName={attachFileName}
      />
    </div>
  );
};

export default ChatWorkspace;
