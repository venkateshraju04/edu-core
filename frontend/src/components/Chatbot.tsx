import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Minimize2 } from 'lucide-react';
import { chatApi } from '../services/api';
import { useAuth } from '../App';

/* ─── types ────────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/* ─── simple markdown-ish renderer ─────────────────────── */

function renderContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Bold
    let rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Emoji bullets
    if (/^[•●]/.test(rendered.trim())) {
      return (
        <div
          key={idx}
          className="ml-2 py-0.5"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      );
    }
    if (rendered.trim() === '') return <br key={idx} />;
    return (
      <div
        key={idx}
        className="py-0.5"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
  });
}

/* ─── typing indicator ─────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

/* ─── suggestion chips ─────────────────────────────────── */

const SUGGESTIONS = [
  'How many students?',
  'Fee summary',
  'Pending admissions',
  'List departments',
];

/* ─── main component ───────────────────────────────────── */

export default function Chatbot() {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && role) {
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hey ${user?.name?.split(' ')[0] ?? 'there'}! 👋 I'm your EduCore assistant. Ask me anything about your school — students, teachers, fees, admissions, and more!`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, [isOpen, role]);

  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msgText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatApi.send(msgText);
      const reply = response.data?.reply ?? "Sorry, I didn't get a response. Please try again.";

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Oops! Something went wrong. Please make sure the backend server is running and try again. 🔧',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
  };

  // Don't render on login page (no role) — placed after all hooks
  if (!role) return null;

  return (
    <>
      {/* ── Floating Action Button ──────────────────────── */}
      <button
        id="chatbot-toggle"
        onClick={toggleOpen}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-blue-600 to-indigo-700
          text-white shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-xl hover:shadow-blue-500/25
          active:scale-95
          ${isOpen ? 'rotate-0' : 'animate-pulse'}
        `}
        style={{
          animation: isOpen ? 'none' : undefined,
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-200" />
        ) : (
          <MessageCircle className="w-6 h-6 transition-transform duration-200" />
        )}
        {/* Notification dot */}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping" />
        )}
      </button>

      {/* ── Chat Window ─────────────────────────────────── */}
      <div
        className={`
          fixed bottom-24 right-6 z-50
          w-[400px] max-h-[600px]
          bg-white rounded-2xl
          shadow-2xl shadow-slate-900/20
          border border-slate-200/80
          flex flex-col
          transition-all duration-300 ease-out
          origin-bottom-right
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
          }
        `}
        role="dialog"
        aria-label="EduCore Chatbot"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">EduCore Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-100 text-xs">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleOpen}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-[300px] max-h-[400px] scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 py-1.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-slate-600 to-slate-800'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-md shadow-blue-500/10'
                    : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'
                }`}
              >
                {renderContent(msg.content)}
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips (only when few messages) */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition border border-blue-200/50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition">
            <input
              ref={inputRef}
              id="chatbot-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 py-2"
              autoComplete="off"
            />
            <button
              id="chatbot-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            Powered by EduCore · Ask about students, fees, admissions & more
          </p>
        </div>
      </div>
    </>
  );
}
