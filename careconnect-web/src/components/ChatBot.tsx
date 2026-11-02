import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  AlertTriangle,
  BookOpen,
  Bot,
  Calendar,
  CalendarDays,
  Home,
  MessageCircle,
  Phone,
  Pill,
  RotateCcw,
  Send,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface ChatBotProps {
  variant?: 'embedded' | 'floating';
}

interface QuickLink {
  label: string;
  description: string;
  route: string;
  Icon: LucideIcon;
}

const WELCOME_MESSAGE =
  "Hi! I'm the CareConnect Assistant. I can help you find things in CareConnect and explain how app features work. I cannot give medical advice.";

const QUICK_LINKS: QuickLink[] = [
  {
    label: 'Home',
    description: 'Return to your dashboard',
    route: '/app',
    Icon: Home,
  },
  {
    label: 'My Day',
    description: 'View your routine and meal log',
    route: '/app/schedule',
    Icon: Calendar,
  },
  {
    label: 'Medicines',
    description: 'View today’s medicines',
    route: '/app/medications',
    Icon: Pill,
  },
  {
    label: 'Appointments',
    description: 'View upcoming appointments',
    route: '/app/appointments',
    Icon: CalendarDays,
  },
  {
    label: 'Memories',
    description: 'View About Me and memories',
    route: '/app/memories',
    Icon: BookOpen,
  },
  {
    label: 'Contacts',
    description: 'Find people who can help',
    route: '/app/contacts',
    Icon: Phone,
  },
];

const QUICK_QUESTIONS = [
  'Where are my medicines?',
  'How do I record a meal?',
  'Where is my About Me information?',
  'How do I check in?',
];

function getScriptedResponse(message: string): string {
  const msg = message.trim().toLowerCase();

  // Emergency assistance takes priority.
  if (
    /\b(emergency|911|999|ambulance|heart attack|stroke|can't breathe|cannot breathe|not breathing|unconscious|severe bleeding|immediate danger|fell and can't get up|fell and cannot get up)\b/.test(
      msg,
    )
  ) {
    return "If you or someone else may be in immediate danger, call local emergency services now. In the United States call 911; in the United Kingdom call 999. CareConnect cannot contact emergency services for you.";
  }

  if (
    /\b(my day|schedule|routine|breakfast|lunch|dinner|meal)\b/.test(
      msg,
    )
  ) {
    return "Open My Day to see your daily routine. Meal sections let you choose common foods, reuse your usual foods, type what you ate, and add notes.";
  }

  if (
    /\b(medicine|medicines|medication|medications|pill list|medicine list)\b/.test(
      msg,
    ) &&
    /\b(where|find|open|show|see|view|list|page|screen|go)\b/.test(
      msg,
    )
  ) {
    return "Open Medicines to see today's medicine list, medication status, notes, and feedback.";
  }

  if (
    /\b(appointment|appointments|doctor visit|visit)\b/.test(
      msg,
    )
  ) {
    return "Open Appointments to see your upcoming visits and appointment information.";
  }

  if (
    /\b(memory|memories|about me|my information|personal information|remember who i am)\b/.test(
      msg,
    )
  ) {
    return "Open Memories to see your About Me information and important people, places, and memories.";
  }

  if (
    /\b(contact|contacts|caregiver|family|phone number|call someone)\b/.test(
      msg,
    )
  ) {
    return "Open Contacts to find caregiver, family, and other support contact information.";
  }

  if (
    /\b(check in|checked in|let caregiver know|i am okay|i'm okay)\b/.test(
      msg,
    )
  ) {
    return "Use the Check In action on Home to let your caregiver know you checked in. CareConnect records the time of your check-in.";
  }

  if (
    /\b(food|ate|eat|meal notes|usual foods|food suggestions)\b/.test(
      msg,
    )
  ) {
    return "Go to My Day and find Breakfast, Lunch, or Dinner. You can tap food choices, select foods you have entered before, type another food, and leave notes.";
  }

  // Medical / clinical boundary.
  if (
    /\b(dose|dosage|how much|mg|milligram|change my medicine|stop taking|skip my medicine|take extra|double dose|side effect|diagnosis|diagnose|treat|treatment|symptom|blood pressure|blood sugar|insulin|prescription advice|medical advice|clinical advice)\b/.test(
      msg,
    )
  ) {
    return "I can't provide medical, dosage, diagnosis, or treatment advice. Please contact your doctor, pharmacist, caregiver, or another qualified health professional. If this may be an emergency, call local emergency services.";
  }

  if (
    /\b(what can you do|how can you help|help me|what do you do|assistant)\b/.test(
      msg,
    )
  ) {
    return "I can help you find My Day, Medicines, Appointments, Memories, Contacts, meal logging, check-in, and other CareConnect features.";
  }

  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening|howdy)\b/.test(
      msg,
    )
  ) {
    return "Hello! Try asking me something like, “Where are my medicines?”, “How do I record a meal?”, or “Where is my About Me information?”";
  }

  if (
    /\b(thank|thanks|thank you|helpful|perfect|great)\b/.test(
      msg,
    )
  ) {
    return "You're welcome. I'm here whenever you need help finding or using a CareConnect feature.";
  }

  return "I can help with CareConnect navigation and app features. Try asking about My Day, Medicines, Appointments, Memories, Contacts, meal logging, or check-in.";
}

function AssistantConversation() {
  const navigate = useNavigate();

  const inputId = useId();
  const liveId = useId();

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [input, setInput] =
    useState('');

  const [messages, setMessages] =
    useState<ChatMessage[]>([
      {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGE,
      },
    ]);

  function addQuestion(question: string) {
    const time = Date.now();

    const userMessage: ChatMessage = {
      id: `user-${time}`,
      role: 'user',
      content: question,
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${time + 1}`,
      role: 'assistant',
      content:
        getScriptedResponse(question),
    };

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);
  }

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const text = input.trim();

    if (!text) {
      return;
    }

    addQuestion(text);
    setInput('');

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function clearConversation() {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: WELCOME_MESSAGE,
      },
    ]);

    setInput('');
    inputRef.current?.focus();
  }

  const latestAssistantMessage =
    [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === 'assistant',
      )?.content ?? '';

  return (
    <>
      <div
        id={liveId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {latestAssistantMessage}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-9 h-9 rounded-full bg-calm-600 flex items-center justify-center"
            aria-hidden="true"
          >
            <Bot className="w-5 h-5 text-white" />
          </span>

          <div>
            <p className="font-bold text-neutral-800">
              CareConnect Assistant
            </p>

            <p className="text-xs text-neutral-500">
              App help and navigation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearConversation}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          aria-label="Clear assistant conversation"
        >
          <RotateCcw
            className="w-4 h-4"
            aria-hidden="true"
          />
          Clear
        </button>
      </div>

      <div
        aria-label="CareConnect Assistant conversation"
        className="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-4 max-h-72 overflow-y-auto space-y-3"
      >
        {messages.map(
          (message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === 'user'
                  ? 'flex-row-reverse'
                  : 'flex-row'
              }`}
            >
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'assistant'
                    ? 'bg-calm-600'
                    : 'bg-neutral-600'
                } text-white`}
                aria-hidden="true"
              >
                {message.role ===
                'assistant' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </span>

              <div
                className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none'
                    : 'bg-calm-600 text-white rounded-tr-none'
                }`}
              >
                {message.content}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-neutral-700 mb-2">
          Try asking
        </p>

        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map(
            (question) => (
              <button
                key={question}
                type="button"
                onClick={() =>
                  addQuestion(question)
                }
                className="rounded-lg border-2 border-calm-200 bg-calm-50 px-3 py-2 text-sm font-medium text-calm-700 hover:border-calm-500 hover:bg-calm-100"
              >
                {question}
              </button>
            ),
          )}
        </div>
      </div>

      <form
        onSubmit={submit}
        className="mt-4"
      >
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-neutral-700 mb-1.5"
        >
          Ask the assistant
        </label>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
            placeholder="Example: Where are my appointments?"
            autoComplete="off"
            className="flex-1 min-w-0 rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-calm-600 text-white px-4 py-2.5 font-semibold min-w-[3rem] hover:bg-calm-700 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message to CareConnect Assistant"
          >
            <Send
              className="w-5 h-5"
              aria-hidden="true"
            />

            <span className="hidden sm:inline">
              Send
            </span>
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
        The CareConnect Assistant helps
        with application features and
        navigation. It does not provide
        medical, dosage, diagnosis, or
        treatment advice.
      </p>

      <button
        type="button"
        onClick={() =>
          navigate('/app/help')
        }
        className="mt-4 text-sm font-semibold text-calm-700 underline underline-offset-2"
      >
        Open full Help screen
      </button>
    </>
  );
}

export default function ChatBot({
  variant = 'embedded',
}: ChatBotProps) {
  const [open, setOpen] =
    useState(false);

  const launcherRef =
    useRef<HTMLButtonElement>(null);

  const panelRef =
    useRef<HTMLDivElement>(null);

  const wasOpen =
    useRef(false);

  const dialogTitleId =
    useId();

  // Correct focus handling:
  // focus moves to the panel only after opening,
  // and returns to the launcher only after an actual close.
  useEffect(() => {
    if (
      variant !== 'floating'
    ) {
      return;
    }

    if (open) {
      wasOpen.current = true;

      requestAnimationFrame(() => {
        const input =
          panelRef.current?.querySelector<HTMLInputElement>(
            'input',
          );

        input?.focus();
      });

      return;
    }

    if (wasOpen.current) {
      launcherRef.current?.focus();
      wasOpen.current = false;
    }
  }, [open, variant]);

  useEffect(() => {
    if (
      variant !== 'floating' ||
      !open
    ) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        event.preventDefault();
        setOpen(false);
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () =>
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
  }, [open, variant]);

  // ==========================================================
  // FLOATING CHATBOT
  // ==========================================================
  if (variant === 'floating') {
    return (
      <>
        <button
          ref={launcherRef}
          type="button"
          onClick={() =>
            setOpen(
              (current) =>
                !current,
            )
          }
          aria-label={
            open
              ? 'Close CareConnect Assistant'
              : 'Open CareConnect Assistant'
          }
          aria-expanded={open}
          aria-controls="careconnect-floating-assistant"
          className={[
            'fixed right-4 md:right-6 bottom-20',
            'z-50 w-14 h-14 rounded-full shadow-xl',
            'flex items-center justify-center',
            'border-2 border-white',
            'transition-colors',
            open
              ? 'bg-neutral-700 hover:bg-neutral-800'
              : 'bg-calm-600 hover:bg-calm-700',
          ].join(' ')}
        >
          {open ? (
            <X
              className="w-6 h-6 text-white"
              aria-hidden="true"
            />
          ) : (
            <MessageCircle
              className="w-6 h-6 text-white"
              aria-hidden="true"
            />
          )}
        </button>

        {open && (
          <div
            id="careconnect-floating-assistant"
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby={
              dialogTitleId
            }
            className="fixed right-4 md:right-6 bottom-36 z-50 w-[calc(100vw-2rem)] max-w-md bg-white rounded-2xl border-2 border-neutral-200 shadow-2xl overflow-hidden"
            style={{
              maxHeight:
                'min(34rem, calc(100vh - 12rem))',
            }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 bg-white">
              <div className="flex items-center gap-2">
                <span
                  className="w-9 h-9 rounded-full bg-calm-600 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Bot className="w-5 h-5 text-white" />
                </span>

                <h2
                  id={dialogTitleId}
                  className="font-bold text-neutral-800"
                >
                  CareConnect Assistant
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
                aria-label="Close CareConnect Assistant"
              >
                <X
                  className="w-5 h-5"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="overflow-y-auto p-4 max-h-[calc(100vh-16rem)]">
              <AssistantConversation />
            </div>
          </div>
        )}
      </>
    );
  }

  // ==========================================================
  // EMBEDDED HELP + ASSISTANT
  // ==========================================================
  return (
    <section
      aria-labelledby={dialogTitleId}
      className="card border-2 border-calm-200 bg-white p-0 overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-calm-200 bg-calm-50">
        <div className="flex items-start gap-4">
          <span
            className="w-12 h-12 rounded-full bg-calm-100 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <MessageCircle className="w-6 h-6 text-calm-700" />
          </span>

          <div>
            <h2
              id={dialogTitleId}
              className="text-xl font-bold text-neutral-800"
            >
              Help & CareConnect Assistant
            </h2>

            <p className="mt-1 text-neutral-600">
              Choose where you want to
              go or ask the assistant
              for help using CareConnect.
            </p>
          </div>
        </div>
      </div>

      <div
        role="note"
        aria-label="Emergency information"
        className="mx-5 sm:mx-6 mt-5 rounded-xl border-2 border-alert-200 bg-alert-50 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-6 h-6 text-alert-700 flex-shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-bold text-alert-800">
              Need emergency help?
            </p>

            <p className="mt-1 text-sm text-alert-800">
              If someone may be in
              immediate danger, call
              local emergency services
              now — 911 in the U.S. or
              999 in the U.K.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-800 mb-3">
          Go to
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
<QuickNavigation />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <AssistantConversation />
      </div>
    </section>
  );
}

function QuickNavigation() {
  const navigate = useNavigate();

  return (
    <>
      {QUICK_LINKS.map(
        ({
          label,
          description,
          route,
          Icon,
        }) => (
          <button
            key={route}
            type="button"
            onClick={() => navigate(route)}
            className="text-left rounded-xl border-2 border-neutral-200 bg-white p-4 hover:border-calm-400 hover:bg-calm-50 transition-colors min-h-[5.5rem]"
          >
            <div className="flex items-start gap-3">
              <Icon
                className="w-6 h-6 text-calm-700 flex-shrink-0"
                aria-hidden="true"
              />

              <div>
                <span className="block font-bold text-neutral-800">
                  {label}
                </span>

                <span className="block mt-1 text-sm text-neutral-500 leading-snug">
                  {description}
                </span>
              </div>
            </div>
          </button>
        ),
      )}
    </>
  );
}