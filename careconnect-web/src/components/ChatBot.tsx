import { useState, useRef, useEffect, useId } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

// ── Scripted fallback responses ────────────────────────────────────────────────
// Used when no API key is configured or the edge function is unreachable.

const WELCOME_MESSAGE =
  "Hi! I'm the CareConnect assistant. I can tell you what CareConnect does and help you get started with signing up or signing in. What would you like to know?";

function getScriptedResponse(message: string): string {
  const msg = message.toLowerCase();

  // Medical / clinical deflection — highest priority
  if (
    /\b(dose|dosage|mg|medication|prescri|drug|medicine|clinical|diagnosis|diagnose|treat|symptom|side effect|blood pressure|diabetes|dementia|alzheimer|insulin|tablet|capsule|pill)\b/.test(msg)
  ) {
    return "I'm not able to give medical, dosage, or clinical advice. For any health questions please talk to your doctor, pharmacist, or caregiver — they're the right people to help. I'm happy to explain what CareConnect does or walk you through signing up!";
  }

  // Privacy / data
  if (/\b(privacy|private|data|share|secure|gdpr|safe)\b/.test(msg)) {
    return 'Your privacy matters. CareConnect stores only what\'s needed to run your daily care plan. Your information is never sold or shared with third parties. We also never give medical advice.';
  }

  // What is / tell me about
  if (
    /\b(what is|what'?s|tell me about|explain|describe|how does|how do|what can)\b/.test(msg) ||
    /careconnect/.test(msg)
  ) {
    return "CareConnect is a daily companion app for people who need a little help remembering their routine, and the caregivers who support them. It includes a daily schedule, medication reminders, memory cards for people and places, and a shared caregiver notes area — all in a calm, easy-to-read design.";
  }

  // Who is it for
  if (/\b(who|for whom|target|audience|use|meant)\b/.test(msg)) {
    return "CareConnect is for two groups: care recipients (people who find it helpful to have their day laid out clearly) and their caregivers (family members or professional carers who want to stay in the loop). You choose your role after signing in, and you can switch at any time.";
  }

  // Sign up
  if (/\b(sign up|signup|register|create account|new account|get started|join)\b/.test(msg)) {
    return "To sign up, click the 'Sign up' or 'Get started' button on this page. You'll enter your name, email address, and a password. Then you'll choose whether you're a care recipient or a caregiver — and that's it! It takes less than two minutes.";
  }

  // Sign in
  if (/\b(sign in|signin|log in|login|existing account|already have)\b/.test(msg)) {
    return "If you already have an account, click 'Sign in' and enter your email and password. If you've forgotten which email you used, try the address you use most often. Once signed in, you'll choose your view and go straight to your dashboard.";
  }

  // Features / what does it do
  if (/\b(feature|schedule|reminder|memory|contact|medication|appointment)\b/.test(msg)) {
    return "CareConnect has five main areas: My Day (your full daily schedule), Medicines (a medication checklist), Memories (cards about people, places, and events), Contacts (emergency and family contacts), and Caregiver Notes (a private log for carers). Everything is designed to be calm and simple.";
  }

  // Cost / free
  if (/\b(cost|price|free|pay|subscription|charge)\b/.test(msg)) {
    return "CareConnect is free to use. There's no credit card required and no subscription fee.";
  }

  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy)\b/.test(msg)) {
    return "Hello! Great to meet you. I can explain what CareConnect does, tell you who it's for, or walk you through signing up or signing in. What would you like to know?";
  }

  // Thanks
  if (/\b(thank|thanks|cheers|great|perfect|helpful)\b/.test(msg)) {
    return "You're very welcome! Is there anything else I can help you with? I can explain how to sign up, what CareConnect does, or answer any other questions about getting started.";
  }

  // Default
  return "I'm here to help you learn about CareConnect and get started. I can explain what it does, who it's for, or walk you through signing up or signing in. What would you like to know?";
}

// ── Edge function call ─────────────────────────────────────────────────────────

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callAssistantApi(history: ApiMessage[]): Promise<string | null> {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        Apikey: ANON_KEY,
      },
      body: JSON.stringify({ messages: history }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { reply?: string; useFallback?: boolean };
    if (data.useFallback || !data.reply) return null;
    return data.reply;
  } catch {
    return null;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [sending, setSending] = useState(false);

  const launcherRef  = useRef<HTMLButtonElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const listEndRef   = useRef<HTMLDivElement>(null);
  const panelRef     = useRef<HTMLDivElement>(null);

  const panelLabelId   = useId();
  const messageLiveId  = useId();

  // Focus input when panel opens; return focus to launcher on close
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      launcherRef.current?.focus();
    }
  }, [open]);

  // Scroll to latest message
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Escape closes the panel (no trap — user can also Tab out freely)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    // Build history for the API call (exclude the init welcome)
    const history: ApiMessage[] = [
      ...messages
        .filter((m) => m.id !== 'init')
        .map((m) => ({ role: m.role, content: m.content } as ApiMessage)),
      { role: 'user', content: text },
    ];

    // Try API first; fall back to scripted
    const apiReply = await callAssistantApi(history);
    const reply = apiReply ?? getScriptedResponse(text);

    setMessages((prev) => [
      ...prev,
      { id: `a_${Date.now()}`, role: 'assistant', content: reply },
    ]);
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* ── Floating launcher button ─────────────────────────────────────── */}
      <button
        ref={launcherRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Need help getting started? Open assistant'}
        aria-expanded={open}
        aria-controls="chatbot-panel"
        className={[
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-full shadow-lg',
          'flex items-center justify-center',
          'transition-all duration-200',
          open
            ? 'bg-neutral-700 hover:bg-neutral-800'
            : 'bg-calm-600 hover:bg-calm-700',
        ].join(' ')}
      >
        {open ? (
          <X className="w-6 h-6 text-white" aria-hidden="true" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" aria-hidden="true" />
        )}
      </button>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      {open && (
        <div
          id="chatbot-panel"
          ref={panelRef}
          role="dialog"
          aria-labelledby={panelLabelId}
          className={[
            'fixed bottom-24 right-4 md:right-6 z-50',
            'w-[calc(100vw-2rem)] max-w-sm',
            'bg-white rounded-xl border-2 border-neutral-200 shadow-2xl',
            'flex flex-col',
            'page-enter',
          ].join(' ')}
          style={{ maxHeight: 'min(480px, calc(100vh - 8rem))' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-full bg-calm-600 flex items-center justify-center"
                aria-hidden="true"
              >
                <Bot className="w-4 h-4 text-white" />
              </span>
              <h2 id={panelLabelId} className="font-semibold text-neutral-800 text-base leading-tight">
                CareConnect Assistant
              </h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Scope notice */}
          <div className="px-4 py-2 bg-calm-50 border-b border-calm-100 flex-shrink-0">
            <p className="text-xs text-calm-700 font-medium">
              I can explain CareConnect and help you get started. I cannot give medical advice.
            </p>
          </div>

          {/* Message list */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            aria-label="Conversation"
          >
            {/* Live region: new messages announced to screen readers */}
            <div
              id={messageLiveId}
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions"
              className="sr-only"
            >
              {messages.length > 0 && messages[messages.length - 1].role === 'assistant'
                ? messages[messages.length - 1].content
                : ''}
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <span
                  aria-hidden="true"
                  className={[
                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white mt-0.5',
                    msg.role === 'assistant' ? 'bg-calm-600' : 'bg-neutral-500',
                  ].join(' ')}
                >
                  {msg.role === 'assistant'
                    ? <Bot className="w-3.5 h-3.5" />
                    : <User className="w-3.5 h-3.5" />}
                </span>

                {/* Bubble */}
                <div
                  className={[
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'assistant'
                      ? 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                      : 'bg-calm-600 text-white rounded-tr-none',
                  ].join(' ')}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-2 flex-row" role="status" aria-label="Assistant is typing">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-calm-600 flex items-center justify-center text-white mt-0.5" aria-hidden="true">
                  <Bot className="w-3.5 h-3.5" />
                </span>
                <div className="bg-neutral-100 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={listEndRef} aria-hidden="true" />
          </div>

          {/* Input row */}
          <div className="flex-shrink-0 border-t border-neutral-200 px-3 py-3 flex items-center gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Type your question
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              autoComplete="off"
              disabled={sending}
              aria-label="Type your question and press Enter to send"
              className="flex-1 min-h-[2.75rem] rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-calm-600 focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="flex-shrink-0 w-11 h-11 rounded-lg bg-calm-600 text-white flex items-center justify-center hover:bg-calm-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
