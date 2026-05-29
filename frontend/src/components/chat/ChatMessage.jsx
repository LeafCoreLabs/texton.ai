import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { PANEL_SPRING } from '../../utils/panelMotion';
import MarkdownMessage from './MarkdownMessage';

const ChatMessage = ({ message, sender, reduceMotion }) => {
  const isUser = sender === 'user';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : PANEL_SPRING}
      className={`group flex gap-4 px-4 py-6 md:px-8 ${
        isUser ? 'bg-white' : 'bg-slate-50'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
            : 'bg-white border border-slate-200 text-indigo-600'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {isUser ? 'You' : 'Texton AI'}
        </p>
        <div className={isUser ? 'chat-prose text-[15px] leading-relaxed text-slate-800' : ''}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message}</p>
          ) : (
            <MarkdownMessage content={message} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
