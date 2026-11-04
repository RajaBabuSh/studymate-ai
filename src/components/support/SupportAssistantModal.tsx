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
    };

    StorageRepository.saveSupportChatMessage(studentMsg, user?.id);
    setMessages((prev) => [...prev, studentMsg]);
    setInputValue("");
    setIsTyping(true);

    // Provide context-aware AI response based on StudyMate platform features
    setTimeout(() => {
      let replyText = "";
      let suggestedActions: SupportChatMessage["suggested_actions"] = [];

      const lowerQ = query.toLowerCase();

      if (lowerQ.includes("readiness") || lowerQ.includes("score")) {
        replyText =
          "Your Exam Readiness Index synthesizes syllabus completion percentage, average practice test score, and consistency streak days into a holistic 0-100 metric.";
        suggestedActions = [
          { label: "Take Practice Test", action_id: "open_tests" },
          { label: "Check Weak Chapters", action_id: "open_academic" },
        ];
      } else if (lowerQ.includes("course") || lowerQ.includes("degree")) {
        replyText = `Your active enrolled degree is ${student?.course || "CS Executive"}. You can switch to any other course (CA, B.Com, BBA, BCA, or Other) anytime in Settings.`;
        suggestedActions = [{ label: "Open Settings", action_id: "open_settings" }];
      } else if (lowerQ.includes("timetable") || lowerQ.includes("schedule")) {
        replyText =
          "The timetable allocates high-difficulty numerical topics to your peak morning slots and places rapid active-recall revision in the evening.";
        suggestedActions = [{ label: "Study Planner", action_id: "open_planner" }];
      } else if (lowerQ.includes("issue") || lowerQ.includes("bug") || lowerQ.includes("error")) {
        replyText =
          "I can log a direct support ticket for our engineering and academic team. Please click below to log a priority ticket.";
        suggestedActions = [{ label: "Create Support Ticket", action_id: "create_ticket" }];
      } else {
        replyText = `Here to assist you with ${student?.course || "your curriculum"}. Explore your Planner for daily sessions, or log a ticket if you need faculty assistance.`;
        suggestedActions = [
          { label: "View Planner", action_id: "open_planner" },
          { label: "Log Ticket", action_id: "create_ticket" },
        ];
      }

      const botMsg: SupportChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: "assistant",
        text: replyText,
        timestamp: new Date().toISOString(),
        suggested_actions: suggestedActions,
      };

      StorageRepository.saveSupportChatMessage(botMsg, user?.id);
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    const newTicket: SupportTicket = {
      id: `tkt-${Date.now().toString().slice(-5)}`,
      student_id: user?.id || "guest",
      student_email: user?.email || student?.email || "student@studymate.ai",
      subject: ticketSubject.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      message: ticketMessage.trim(),
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    StorageRepository.saveSupportTicket(newTicket, user?.id);
    setMyTickets((prev) => [newTicket, ...prev]);

    // Send confirmation in chat
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
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Open StudyMate Academic Support Assistant"
      >
        <Sparkles className="h-4 w-4 animate-pulse text-purple-200" />
        <span className="hidden sm:inline">Support Assistant</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[550px] max-h-[85vh] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white shadow-2xl flex flex-col overflow-hidden animate-slide-up transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a13] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>StudyMate Support Assistant</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Online
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Context: {pathname}</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-xs px-3">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 py-2.5 px-3 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === "chat"
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-300"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>AI Guidance</span>
            </button>
            <button
              onClick={() => setActiveTab("ticket")}
              className={`flex items-center gap-1.5 py-2.5 px-3 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === "ticket"
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-300"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Ticket className="h-3.5 w-3.5" />
              <span>Log Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab("my_tickets")}
              className={`flex items-center gap-1.5 py-2.5 px-3 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === "my_tickets"
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-300"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Tickets ({myTickets.length})</span>
            </button>
          </div>

          {/* Tab 1: AI Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0b0f19]">
              {ticketSuccess && (
                <div className="m-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
                        className="rounded-xl border border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200 p-2.5 text-[11px]"
                      >
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
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
                            ? "bg-purple-600 text-white rounded-br-xs"
                            : "bg-slate-100 border border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 rounded-bl-xs"
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
                              className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-500/40 dark:bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition flex items-center gap-1 cursor-pointer"
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
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 p-2 rounded-xl w-36">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce delay-100" />
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce delay-200" />
                    <span className="text-[10px] ml-1">Analyzing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Context Prompt Shortcuts */}
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a13] p-2 overflow-x-auto flex gap-1.5 scrollbar-none">
                {currentPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="shrink-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-700 dark:hover:text-white transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a13] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or report an issue..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition shrink-0 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Create Support Ticket */}
          {activeTab === "ticket" && (
            <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-[#0b0f19] text-xs space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Submit Administrator Support Ticket</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Have an issue with curriculum, dates, or application errors? Our administration team will review and resolve your request.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) =>
                      setTicketCategory(e.target.value as SupportTicket["category"])
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="curriculum">Curriculum / Missing Chapters</option>
                    <option value="timetable">AI Timetable & Scheduling</option>
                    <option value="exam_readiness">Exam Readiness & Scores</option>
                    <option value="account">Account & Privacy</option>
                    <option value="technical">Technical Error / Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) =>
                      setTicketPriority(e.target.value as SupportTicket["priority"])
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="low">Low - General query</option>
                    <option value="medium">Medium - Guidance required</option>
                    <option value="high">High - Exam in next 7 days</option>
                    <option value="urgent">Urgent - Blocking issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject / Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need to adjust chapter count for Paper 2"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Explanation</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what occurred, your target course, and how we can assist..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Back to Chat
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white hover:bg-purple-500 transition cursor-pointer"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: My Tickets History */}
          {activeTab === "my_tickets" && (
            <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-[#0b0f19] text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white">Logged Tickets & Inquiries</h4>
                <button
                  onClick={() => setActiveTab("ticket")}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  + New Ticket
                </button>
              </div>

              {myTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No support tickets logged yet.</p>
                </div>
              ) : (
                myTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{t.subject}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          t.status === "resolved"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                            : t.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{t.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                      <span>Category: {t.category}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
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
