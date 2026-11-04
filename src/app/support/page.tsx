"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Send,
  BookOpen,
  Calendar,
  Lock,
} from "lucide-react";

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: "How do I add or customize my subjects?",
      a: "Go to 'My Subjects' from the sidebar and click 'Add New Subject'. You can enter the subject name, subject code, and choose a custom color. You can also add chapters and mark them completed or pending anytime.",
    },
    {
      q: "How do I schedule my study sessions in the timetable?",
      a: "Visit 'My Timetable' and click 'Add Study Session'. Select your subject, an optional chapter, pick the date and start time, and set the duration in minutes. You can also use the 'AI Suggestion' button to generate a balanced weekly starting template.",
    },
    {
      q: "Can I edit or delete scheduled sessions?",
      a: "Yes! In 'My Timetable', every session card has Edit (pencil) and Delete (trash) buttons. You can also click the checkbox next to any session to mark it completed directly.",
    },
    {
      q: "How do I track my exam preparation progress?",
      a: "Check 'My Progress' or your main Dashboard. As you mark chapters and tasks completed, your overall completion percentage updates dynamically.",
    },
    {
      q: "Is my student data private and secure?",
      a: "Yes. StudyMate AI isolates data per student account. Your subjects, timetable, notes, and tasks are securely stored and tied only to your active profile.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setSubmitted(true);
    setTicketSubject("");
    setTicketMessage("");
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* HEADER                                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Support Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Get help with subjects, timetables, and exam preparation.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUICK HELP CARDS                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
          <BookOpen className="h-5 w-5 text-indigo-500 mb-2" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">Subject Setup</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Organize chapters and monitor your completion rate.
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
          <Calendar className="h-5 w-5 text-purple-500 mb-2" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">Weekly Routine</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Build a consistent study habit with daily focus blocks.
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
          <Lock className="h-5 w-5 text-emerald-500 mb-2" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">Account Safety</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Manage your credentials and password securely.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FREQUENTLY ASKED QUESTIONS                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CONTACT SUPPORT FORM                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <span>Ask a Question or Send Feedback</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Have an issue or suggestion? We&apos;re here to help you succeed in your exams.
        </p>

        {submitted && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Thank you! Your inquiry has been received. Our team will review it promptly.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject / Topic
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Question about syllabus tracking"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Message
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe what you need help with..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Message</span>
          </button>
        </form>
      </div>
    </div>
  );
}
