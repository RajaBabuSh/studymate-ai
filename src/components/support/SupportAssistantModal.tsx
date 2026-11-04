"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  LifeBuoy,
  ShieldCheck,
  ChevronRight,
  Ticket,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { SupportChatMessage, SupportTicket } from "@/types/database";

const CONTEXT_PROMPTS: Record<string, string[]> = {
  "/dashboard": [
    "How is my Exam Readiness score calculated?",
    "Why is my revision completion percentage low?",
    "How do I mark today's study sessions complete?",
  ],
  "/timetable": [
    "How do I edit or reschedule a study slot?",
    "Why are numerical chapters scheduled in the morning?",
    "How do I keep approved sessions when regenerating?",
  ],
  "/subjects": [
    "How do I add custom chapters to my syllabus?",
    "How do I log a Revision 1 or Revision 2 milestone?",
    "What is the difference between Numerical and Theory chapters?",
  ],
  "/tests": [
    "What is the difference between Test Performance and Test Coverage?",
    "Can I retake a practice test multiple times?",
    "How do diagnostic questions target my weak topics?",
  ],
  "/exam-planner": [
    "What triggers a RED warning alert?",
    "How does the weak subject 40% buffer work?",
    "How do I change my examination date?",
  ],
};

const DEFAULT_PROMPTS = [
  "How does StudyMate AI organize my study timetable?",
  "How do I select or change my enrolled course?",
  "How can I report a technical issue to an administrator?",
];

export default function SupportAssistantModal() {
  const pathname = usePathname();
  const { user, student } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "ticket" | "my_tickets">("chat");
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Ticket Form
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketCategory, setTicketCategory] = useState<SupportTicket["category"]>("curriculum");
  const [ticketPriority, setTicketPriority] = useState<SupportTicket["priority"]>("medium");
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChat = useCallback(() => {
    const list = StorageRepository.getSupportChatMessages(user?.id);
    setMessages(list);
    const tickets = StorageRepository.getSupportTickets(user?.id);
    setMyTickets(tickets);
  }, [user?.id]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const currentPrompts = CONTEXT_PROMPTS[pathname] || DEFAULT_PROMPTS;

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const studentMsg: SupportChatMessage = {
      id: `msg-student-${Date.now()}`,
      sender: "student",
      text: query,
      timestamp: new Date().toISOString(),
      page_context: pathname,
    };

    StorageRepository.saveSupportChatMessage(studentMsg, user?.id);
    const updatedMessages = [...messages, studentMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAssistantResponse(query, pathname, student?.course);
      const assistantMsg: SupportChatMessage = {
        id: `msg-asst-${Date.now()}`,
        sender: "assistant",
        text: response.text,
        suggested_actions: response.actions,
        timestamp: new Date().toISOString(),
        page_context: pathname,
      };

      StorageRepository.saveSupportChatMessage(assistantMsg, user?.id);
      setMessages([...updatedMessages, assistantMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now().toString(36)}`,
      student_id: user?.id || "guest",
      student_email: user?.email || student?.email || "student@studymate.ai",
      subject: ticketSubject,
      message: ticketMessage,
      category: ticketCategory,
      status: "open",
      priority: ticketPriority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    StorageRepository.saveSupportTicket(newTicket, user?.id);
    const updated = StorageRepository.getSupportTickets(user?.id);
    setMyTickets(updated);

    // Also add confirmation to chat
    const confirmMsg: SupportChatMessage = {
      id: `msg-tkt-${Date.now()}`,
      sender: "system",
      text: `Support Ticket #${newTicket.id} has been logged. An academic administrator will review your inquiry. You can track status in the "My Tickets" tab.`,
      timestamp: new Date().toISOString(),
    };
    StorageRepository.saveSupportChatMessage(confirmMsg, user?.id);
    setMessages((prev) => [...prev, confirmMsg]);

    setTicketSubject("");
    setTicketMessage("");
    setTicketSuccess(`Support Ticket #${newTicket.id} submitted successfully.`);
    setActiveTab("chat");
    setTimeout(() => setTicketSuccess(null), 4000);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-violet-900/40 hover:scale-105 active:scale-95 transition-all"
        title="Open StudyMate Academic Support Assistant"
      >
        <Sparkles className="h-4 w-4 animate-pulse text-violet-200" />
        <span className="hidden sm:inline">Support Assistant</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[550px] max-h-[85vh] rounded-3xl border border-slate-700 bg-[#0b0f19] text-white shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#070a13] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>StudyMate Support Assistant</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                    Online
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Context: {pathname}</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/60 text-xs px-3">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 py-2.5 px-3 font-semibold border-b-2 transition ${
                activeTab === "chat"
                  ? "border-violet-500 text-violet-300"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>AI Guidance</span>
            </button>
            <button
              onClick={() => setActiveTab("ticket")}
              className={`flex items-center gap-1.5 py-2.5 px-3 font-semibold border-b-2 transition ${
                activeTab === "ticket"
                  ? "border-violet-500 text-violet-300"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Ticket className="h-3.5 w-3.5" />
              <span>Log Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab("my_tickets")}
              className={`flex items-center gap-1.5 py-2.5 px-3 font-semibold border-b-2 transition ${
                activeTab === "my_tickets"
                  ? "border-violet-500 text-violet-300"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <span>Tickets ({myTickets.length})</span>
            </button>
          </div>

          {/* Tab 1: AI Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#0b0f19]">
              {ticketSuccess && (
                <div className="m-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{ticketSuccess}</span>
                </div>
              )}

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m) => {
                  const isUser = m.sender === "student";
                  const isSys = m.sender === "system";

                  if (isSys) {
                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 text-violet-200 text-[11px]"
                      >
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                          <span>{m.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] leading-relaxed ${
                          isUser
                            ? "bg-violet-600 text-white rounded-br-xs"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs"
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>

                      {/* Suggested actions if any */}
                      {m.suggested_actions && m.suggested_actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.suggested_actions.map((act) => (
                            <button
                              key={act.action_id}
                              onClick={() => {
                                if (act.action_id === "create_ticket") {
                                  setActiveTab("ticket");
                                } else {
                                  handleSendMessage(act.label);
                                }
                              }}
                              className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-300 hover:bg-violet-500/20 transition flex items-center gap-1"
                            >
                              <span>{act.label}</span>
                              <ChevronRight className="h-2.5 w-2.5" />
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="mt-1 text-[9px] text-slate-500 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl w-36">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce delay-100" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce delay-200" />
                    <span className="text-[10px] ml-1">Analyzing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Context Prompt Shortcuts */}
              <div className="border-t border-slate-800 bg-[#070a13] p-2 overflow-x-auto flex gap-1.5 scrollbar-none">
                {currentPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-violet-500/40 hover:text-white transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-slate-800 bg-[#070a13] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or report an issue..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Create Support Ticket */}
          {activeTab === "ticket" && (
            <div className="flex-1 overflow-y-auto p-5 bg-[#0b0f19] text-xs space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">Submit Administrator Support Ticket</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Have an issue with curriculum, dates, or application errors? Our administration team will review and resolve your request.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Issue Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) =>
                      setTicketCategory(e.target.value as SupportTicket["category"])
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="curriculum">Curriculum / Missing Chapters</option>
                    <option value="timetable">AI Timetable & Scheduling</option>
                    <option value="exam_readiness">Exam Readiness & Scores</option>
                    <option value="account">Account & Privacy</option>
                    <option value="technical">Technical Error / Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) =>
                      setTicketPriority(e.target.value as SupportTicket["priority"])
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="low">Low - General query</option>
                    <option value="medium">Medium - Guidance required</option>
                    <option value="high">High - Exam in next 7 days</option>
                    <option value="urgent">Urgent - Blocking issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject / Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need to adjust chapter count for Paper 2"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Detailed Explanation</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what occurred, your target course, and how we can assist..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className="rounded-xl border border-slate-700 px-3.5 py-2 text-slate-300"
                  >
                    Back to Chat
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-500 transition"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: My Tickets History */}
          {activeTab === "my_tickets" && (
            <div className="flex-1 overflow-y-auto p-4 bg-[#0b0f19] text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs">Logged Support Tickets</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {myTickets.length} records
                </span>
              </div>

              {myTickets.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>You have not logged any support tickets yet.</p>
                </div>
              ) : (
                myTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-white text-xs">{tkt.subject}</h5>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          tkt.status === "resolved"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : tkt.status === "in_progress"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {tkt.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2">{tkt.message}</p>

                    {tkt.admin_response && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-200">
                        <span className="font-bold text-emerald-400 block mb-0.5">
                          Administrator Response:
                        </span>
                        <p>{tkt.admin_response}</p>
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Category: {tkt.category}</span>
                      <span>{new Date(tkt.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Intelligent Academic Guidance Knowledge Base
 */
function generateAssistantResponse(
  query: string,
  pathname: string,
  studentCourse?: string
): { text: string; actions?: Array<{ label: string; action_id: string; target_url?: string }> } {
  const q = query.toLowerCase();

  if (q.includes("readiness") || q.includes("score") || q.includes("calculated")) {
    return {
      text: "Your Exam Readiness score uses a transparent multi-factor algorithm: Syllabus Completion (30%) + Revision Milestones (25%) + Test Marks (25%) + Test Coverage (10%) + Timeline Buffer (10%). It does not rely on arbitrary guesses. You can boost readiness by completing Chapter Practice Tests and logging Revision 1 & 2 milestones.",
      actions: [
        { label: "View Chapter Tracker", action_id: "nav_subjects", target_url: "/subjects" },
        { label: "Take a Practice Test", action_id: "nav_tests", target_url: "/tests" },
      ],
    };
  }

  if (q.includes("revision") || q.includes("milestone") || q.includes("revised")) {
    return {
      text: "StudyMate AI enforces independent tracking: completing a chapter's first study does NOT automatically mark it revised! Go to 'Chapter Intelligence' (/subjects), click '+ Log Revision', and select whether you completed Revision 1 (rapid concept recap) or Revision 2 (deep problem practice).",
      actions: [
        { label: "Open Chapter Intelligence", action_id: "nav_subjects", target_url: "/subjects" },
      ],
    };
  }

  if (q.includes("test") || q.includes("coverage") || q.includes("marks")) {
    return {
      text: "Test Coverage is the percentage of chapters where you have taken at least one test. Test Performance is your average percentage score across all completed tests. You can generate numerical drills, MCQs, or case studies on the Smart Tests page (/tests).",
      actions: [
        { label: "Generate Smart Test", action_id: "nav_tests", target_url: "/tests" },
      ],
    };
  }

  if (q.includes("numerical") || q.includes("theory") || q.includes("morning")) {
    return {
      text: "Numerical chapters (like Accounting, Taxation PGBP, Costing) demand high analytical focus and are scheduled in morning peak alertness slots. Theory chapters (like Company Law, Auditing) receive structured active recall, short markdown notes, and 3-day spaced recall slots.",
      actions: [
        { label: "View Subject Strategies", action_id: "nav_subjects", target_url: "/subjects" },
      ],
    };
  }

  if (q.includes("regenerate") || q.includes("timetable") || q.includes("keep") || q.includes("approved")) {
    return {
      text: "On the AI Timetable generator (/timetable), you can regenerate your schedule anytime. When regenerating, toggle 'Keep Existing Completed Sessions' so your already studied slots remain intact. The AI will then distribute the remaining chapters without conflicts.",
      actions: [
        { label: "Open Timetable Generator", action_id: "nav_timetable", target_url: "/timetable" },
      ],
    };
  }

  if (q.includes("red warning") || q.includes("warning") || q.includes("error")) {
    return {
      text: "A RED warning is triggered if your daily study workload exceeds your available hours (preventing burnout), or if an upcoming examination lacks a mock test or sufficient revision checkpoints. You can choose 'Accept AI Correction' or 'Keep My Existing Plan'.",
      actions: [
        { label: "Check Exam Planner", action_id: "nav_planner", target_url: "/exam-planner" },
      ],
    };
  }

  if (q.includes("custom") || q.includes("add chapter") || q.includes("upload")) {
    return {
      text: "Students can add their own personalized custom chapters without altering the official curriculum! In 'Chapter Intelligence' (/subjects), click '+ Add Custom Chapter'. You can also upload a syllabus photo or PDF to have the AI automatically extract and verify chapters.",
      actions: [
        { label: "Add Custom Chapter", action_id: "nav_subjects", target_url: "/subjects" },
      ],
    };
  }

  if (q.includes("ticket") || q.includes("contact") || q.includes("admin") || q.includes("help") || q.includes("issue")) {
    return {
      text: "If you are encountering a technical error or need curriculum changes approved, you can log a direct support ticket with our academic administrators using the 'Log Ticket' tab above.",
      actions: [
        { label: "Open Ticket Form", action_id: "create_ticket" },
      ],
    };
  }

  // Default context response
  return {
    text: `I'm here to support your ${studentCourse || "academic"} preparation journey! You can track chapter completion, schedule revisions, take diagnostic practice tests, or log an administrative support ticket anytime.`,
    actions: [
      { label: "How is Exam Readiness calculated?", action_id: "explain_readiness" },
      { label: "Log an Issue Ticket", action_id: "create_ticket" },
    ],
  };
}
