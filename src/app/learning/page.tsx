"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import {
  Subject,
  Chapter,
  FlashcardItem,
  StudentDoubtItem,
} from "@/types/database";
import {
  BookOpen,
  RotateCcw,
  Layers,
  HelpCircle,
  FileText,
  Scale,
  Calculator,
  CheckCircle2,
  Check,
  ChevronRight,
  Plus,
} from "lucide-react";

export default function LearningRevisionPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "revision" | "flashcards" | "mcqs" | "statutes" | "summaries" | "doubts"
  >("revision");

  // Core Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [doubts, setDoubts] = useState<StudentDoubtItem[]>([]);

  // Flashcard Player State
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // MCQ Practice State
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState<Record<number, boolean>>({});

  // New Doubt Modal State
  const [showDoubtModal, setShowDoubtModal] = useState(false);
  const [newDoubtSubject, setNewDoubtSubject] = useState("");
  const [newDoubtQuestion, setNewDoubtQuestion] = useState("");

  // New Flashcard Modal State
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardSubject, setNewCardSubject] = useState("");
  const [newCardChapter, setNewCardChapter] = useState("");
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");

  useEffect(() => {
    const loadedSubs = StorageRepository.getSubjects(user?.id);
    const loadedChaps = StorageRepository.getChapters(user?.id);
    const loadedCards = StorageRepository.getFlashcards(user?.id);
    const loadedDoubts = StorageRepository.getDoubts(user?.id);

    setSubjects(loadedSubs);
    setChapters(loadedChaps);
    setFlashcards(loadedCards);
    setDoubts(loadedDoubts);
  }, [user]);

  // Handle Revision Milestone completion (Feature 9)
  const handleCompleteRevisionMilestone = (
    chapterId: string,
    milestone: "revision_1" | "revision_2" | "revision_3"
  ) => {
    StorageRepository.addChapterRevision(
      chapterId,
      milestone,
      `Completed ${milestone} revision review.`,
      45,
      user?.id
    );
    const updatedChaps = StorageRepository.getChapters(user?.id);
    setChapters(updatedChaps);
  };

  // Add Doubt Handler (Feature 55)
  const handleAddDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtQuestion.trim()) return;

    const newDbt: StudentDoubtItem = {
      id: `dbt-${Date.now()}`,
      student_id: user?.id || "guest-id",
      subject_name: newDoubtSubject || "General Academic",
      chapter_title: "General Topics",
      question: newDoubtQuestion.trim(),
      status: "open",
      created_at: new Date().toISOString(),
    };

    StorageRepository.saveDoubt(newDbt, user?.id);
    setDoubts([newDbt, ...doubts]);
    setNewDoubtQuestion("");
    setShowDoubtModal(false);
  };

  // Toggle Doubt Status
  const handleToggleDoubt = (doubtId: string, currentStatus: "open" | "clarified") => {
    const nextStatus = currentStatus === "open" ? "clarified" : "open";
    StorageRepository.updateDoubtStatus(
      doubtId,
      nextStatus,
      nextStatus === "clarified" ? "Resolved through faculty session." : undefined,
      user?.id
    );
    setDoubts(StorageRepository.getDoubts(user?.id));
  };

  // Add Flashcard Handler (Feature 46)
  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim()) return;

    const newCard: FlashcardItem = {
      id: `fc-${Date.now()}`,
      student_id: user?.id || "guest-id",
      subject_name: newCardSubject || "General Revision",
      chapter_title: newCardChapter || "Key Concepts",
      front: newCardFront.trim(),
      back: newCardBack.trim(),
      mastery_level: "learning",
      last_reviewed_at: new Date().toISOString(),
    };

    StorageRepository.saveFlashcard(newCard, user?.id);
    setFlashcards([newCard, ...flashcards]);
    setNewCardFront("");
    setNewCardBack("");
    setShowAddCardModal(false);
  };

  const currentCard = flashcards[currentCardIdx] || null;

  // Sample Curated MCQs (Feature 49)
  const curatedMCQs = [
    {
      id: 1,
      subject: "Company Law & Practice",
      question:
        "Under Section 103 of the Companies Act, 2013, what is the quorum required for a general meeting of a public company if the number of members as on the date of meeting is 2,400?",
      options: [
        "5 members personally present",
        "15 members personally present",
        "30 members personally present",
        "10% of total voting power",
      ],
      correctAnswer: 1, // 15 members
      explanation:
        "As per Section 103(1)(a)(ii), if the number of members is between 1,000 and 5,000, 15 members personally present shall be the quorum.",
    },
    {
      id: 2,
      subject: "Jurisprudence, Interpretation & General Laws",
      question:
        "Which canon of statutory interpretation directs that words of an ambiguous statute should be interpreted in the light of the mischief it intended to cure?",
      options: [
        "The Literal Rule",
        "The Mischief Rule (Heydon's Case)",
        "The Golden Rule",
        "Rule of Ejusdem Generis",
      ],
      correctAnswer: 1,
      explanation:
        "The Mischief Rule (laid down in Heydon's Case, 1584) emphasizes interpreting provisions to suppress the mischief and advance the intended remedy.",
    },
    {
      id: 3,
      subject: "Tax Laws & Practice",
      question:
        "Under Section 43B(h) of the Income-tax Act, 1961, within what timeframe must payment to a Micro or Small Enterprise be made to avoid tax disallowance?",
      options: [
        "Within 180 days from invoice date",
        "Before the due date of filing ITR under Section 139(1)",
        "Within the time agreed in writing (max 45 days) or 15 days if no agreement",
        "Within 90 days from the end of the financial year",
      ],
      correctAnswer: 2,
      explanation:
        "Section 43B(h) mandates payment within the period specified under Section 15 of MSMED Act (max 45 days where agreed, 15 days without agreement).",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
              <BookOpen className="h-3.5 w-3.5" />
              Learning & Revision Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Active Recall, Flashcards & Multi-Stage Revision
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reinforce conceptual retention through 3-tier revision milestones, MCQs, case law provisions, and formula banks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCardModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-all dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900"
          >
            <Plus className="h-3.5 w-3.5" /> New Flashcard
          </button>
          <button
            onClick={() => setShowDoubtModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 shadow-xs transition-all"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Ask / Log Doubt
          </button>
        </div>
      </div>

      {/* Primary Submenu Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("revision")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "revision"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          Revision Tracker (1st, 2nd, 3rd)
        </button>

        <button
          onClick={() => setActiveTab("flashcards")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "flashcards"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" />
          Flashcards & Active Recall ({flashcards.length})
        </button>

        <button
          onClick={() => setActiveTab("mcqs")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "mcqs"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          MCQ Practice Drills
        </button>

        <button
          onClick={() => setActiveTab("statutes")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "statutes"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Scale className="h-4 w-4" />
          Case Laws & Formula Bank
        </button>

        <button
          onClick={() => setActiveTab("summaries")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "summaries"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" />
          One-Page Chapter Summaries
        </button>

        <button
          onClick={() => setActiveTab("doubts")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "doubts"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Doubt Tracker ({doubts.filter((d) => d.status === "open").length} Open)
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: REVISION TRACKER (1st, 2nd, 3rd) (Features 9, 19, 58) */}
      {/* ========================================================= */}
      {activeTab === "revision" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Three-Tier Revision Milestone Matrix (Features 9, 19, 58)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Track multi-stage spaced repetition for each completed lesson. Complete Revision 1 within 48h, Revision 2 after 7 days, and Revision 3 before mock exams.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    <th className="py-3 px-4">Subject & Chapter Title</th>
                    <th className="py-3 px-4 text-center">1st Revision</th>
                    <th className="py-3 px-4 text-center">2nd Revision</th>
                    <th className="py-3 px-4 text-center">3rd Revision (Mastery)</th>
                    <th className="py-3 px-4 text-right">Overall Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {chapters.slice(0, 12).map((ch) => {
                    const sub = subjects.find((s) => s.id === ch.subject_id);
                    const rev1 = ch.revision_history?.find((r) => r.milestone === "revision_1");
                    const rev2 = ch.revision_history?.find((r) => r.milestone === "revision_2");
                    const rev3 = ch.revision_history?.find((r) => r.milestone === "revision_3");

                    return (
                      <tr key={ch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{ch.title}</div>
                          <div className="text-xs text-violet-600 dark:text-violet-400">{sub?.name}</div>
                        </td>

                        {/* Revision 1 */}
                        <td className="py-3 px-4 text-center">
                          {rev1 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              ✓ Done
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCompleteRevisionMilestone(ch.id, "revision_1")}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:text-slate-400"
                            >
                              Log Rev 1
                            </button>
                          )}
                        </td>

                        {/* Revision 2 */}
                        <td className="py-3 px-4 text-center">
                          {rev2 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              ✓ Done
                            </span>
                          ) : (
                            <button
                              disabled={!rev1}
                              onClick={() => handleCompleteRevisionMilestone(ch.id, "revision_2")}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${
                                !rev1
                                  ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:text-slate-400"
                              }`}
                            >
                              Log Rev 2
                            </button>
                          )}
                        </td>

                        {/* Revision 3 */}
                        <td className="py-3 px-4 text-center">
                          {rev3 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              ⭐ Mastered
                            </span>
                          ) : (
                            <button
                              disabled={!rev2}
                              onClick={() => handleCompleteRevisionMilestone(ch.id, "revision_3")}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${
                                !rev2
                                  ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:text-slate-400"
                              }`}
                            >
                              Log Rev 3
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span
                            className={`text-xs font-bold ${
                              rev3
                                ? "text-emerald-600"
                                : rev2
                                ? "text-violet-600"
                                : rev1
                                ? "text-amber-500"
                                : "text-slate-400"
                            }`}
                          >
                            {rev3 ? "100% Solid" : rev2 ? "70% Strong" : rev1 ? "40% Basic" : "0% Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FLASHCARDS & ACTIVE RECALL (Features 46, 47) */}
      {/* ========================================================= */}
      {activeTab === "flashcards" && (
        <div className="space-y-6">
          <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
              <span>Active Recall Session</span>
              <span>
                Card {flashcards.length > 0 ? currentCardIdx + 1 : 0} of {flashcards.length}
              </span>
            </div>

            {currentCard ? (
              <div>
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-64 p-8 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-400 transition-all dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-2">
                    {isFlipped ? "Answer / Statutory Principle (Click to Flip)" : "Question / Prompt (Click to Reveal Answer)"}
                  </span>
                  <div className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                  <div className="mt-4 text-xs font-medium text-slate-500">
                    Subject: {currentCard.subject_name} • Lesson: {currentCard.chapter_title}
                  </div>
                </div>

                {/* Rating & Navigation */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIdx((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    Previous Card
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      Mastered
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
                  >
                    Next Card
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No flashcards created yet. Click &quot;New Flashcard&quot; to build your active recall deck.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MCQ PRACTICE DRILLS (Feature 49) */}
      {/* ========================================================= */}
      {activeTab === "mcqs" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Chapter-Wise MCQ Practice & Self-Assessment (Features 48, 49)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Instant evaluation with detailed statutory rationales.
            </p>

            <div className="space-y-6">
              {curatedMCQs.map((item) => {
                const selectedOpt = mcqAnswers[item.id];
                const isSub = mcqSubmitted[item.id];
                const isCorrect = selectedOpt === item.correctAnswer;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1">
                      {item.subject}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                      {item.id}. {item.question}
                    </div>

                    <div className="space-y-2 mb-4">
                      {item.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        let optStyle = "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";

                        if (isSub) {
                          if (optIdx === item.correctAnswer) {
                            optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
                          } else if (isChosen) {
                            optStyle = "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200";
                          }
                        } else if (isChosen) {
                          optStyle = "border-violet-600 bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200";
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => {
                              if (!isSub) {
                                setMcqAnswers((prev) => ({ ...prev, [item.id]: optIdx }));
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${optStyle}`}
                          >
                            <span>{opt}</span>
                            {isSub && optIdx === item.correctAnswer && (
                              <Check className="h-4 w-4 text-emerald-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!isSub ? (
                      <button
                        disabled={selectedOpt === undefined}
                        onClick={() =>
                          setMcqSubmitted((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold ${
                          selectedOpt === undefined
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800"
                            : "bg-violet-600 text-white hover:bg-violet-700"
                        }`}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <div className="font-bold mb-0.5">
                          {isCorrect ? "✅ Correct!" : "❌ Incorrect Answer"}
                        </div>
                        <div>{item.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: STATUTES & FORMULA BANK (Features 50, 51, 52) */}
      {/* ========================================================= */}
      {activeTab === "statutes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Landmark Case Laws */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Scale className="h-5 w-5 text-indigo-600" />
                Landmark Case Laws (Feature 50)
              </h3>
              <div className="space-y-3">
                {[
                  {
                    name: "Salomon v. Salomon & Co. Ltd. (1897)",
                    sub: "Company Law",
                    principle: "Established the doctrine of Corporate Personality and Separate Legal Entity distinct from its shareholders.",
                  },
                  {
                    name: "Foss v. Harbottle (1843)",
                    sub: "Company Law",
                    principle: "Rule of majority: proper plaintiff rule in respect of a wrong alleged to be done to a company.",
                  },
                  {
                    name: "Kesavananda Bharati v. State of Kerala (1973)",
                    sub: "JIGL",
                    principle: "Laid down the inviolable Basic Structure Doctrine restricting Parliament's amending powers under Art 368.",
                  },
                ].map((c, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="font-bold text-xs text-slate-800 dark:text-white">{c.name}</div>
                    <div className="text-[11px] text-violet-600 font-semibold mb-1">{c.sub}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{c.principle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formula Bank */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Calculator className="h-5 w-5 text-emerald-600" />
                Formula Revision Bank (Feature 52)
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: "Weighted Average Cost of Capital (WACC)",
                    expr: "Ko = (We * Ke) + (Wd * Kd * (1 - t)) + (Wp * Kp)",
                    sub: "Corporate Accounting & FM",
                  },
                  {
                    title: "Operating Leverage (DOL)",
                    expr: "DOL = Contribution / EBIT  [or  % change in EBIT / % change in Sales]",
                    sub: "Financial Management",
                  },
                  {
                    title: "Economic Order Quantity (EOQ)",
                    expr: "EOQ = √ ( 2 * A * S / C )",
                    sub: "Costing & Materials Management",
                  },
                ].map((f, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="font-bold text-xs text-slate-800 dark:text-white">{f.title}</div>
                    <div className="text-[11px] text-emerald-600 font-semibold mb-1">{f.sub}</div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-900 font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                      {f.expr}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ONE-PAGE SUMMARIES (Feature 53 & 54) */}
      {/* ========================================================= */}
      {activeTab === "summaries" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              One-Page Executive Chapter Summaries & Mind Maps (Features 53, 54)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Synthesized one-page cheat sheets condensing comprehensive chapters into statutory flowcharts and essential provisions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Company Formation, MOA & AOA Synthesis",
                  sub: "Company Law & Practice",
                  points: [
                    "Incorporation via SPICe+ (Part A for name reservation, Part B for incorporation)",
                    "Doctrine of Ultra Vires (Ashbury Railway Carriage case)",
                    "Doctrine of Indoor Management & Turquand Rule exception",
                    "Alteration of Object Clause: Special resolution + filing with ROC within 30 days",
                  ],
                },
                {
                  title: "Constitution of India: Fundamental Rights Cheat Sheet",
                  sub: "Jurisprudence (JIGL)",
                  points: [
                    "Article 12: Definition of 'State' (Electricity Board, LIC, CSIR included)",
                    "Article 13: Laws inconsistent with FRs are void (Doctrine of Eclipse & Severability)",
                    "Article 14: Equality before law & rule against arbitrariness",
                    "Article 21: Right to Life & Personal Liberty (Maneka Gandhi procedure established by law)",
                  ],
                },
              ].map((sum, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{sum.title}</div>
                  <div className="text-xs text-violet-600 font-semibold mb-3">{sum.sub}</div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {sum.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: DOUBT TRACKER (Feature 55) */}
      {/* ========================================================= */}
      {activeTab === "doubts" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Doubt Management Tracker (Feature 55)
                </h3>
                <p className="text-xs text-slate-500">
                  Track questions raised during revision and review faculty answers.
                </p>
              </div>
              <button
                onClick={() => setShowDoubtModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                + Ask Question
              </button>
            </div>

            <div className="space-y-3">
              {doubts.map((dbt) => (
                <div
                  key={dbt.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="text-xs text-violet-600 font-semibold">{dbt.subject_name}</div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                      {dbt.question}
                    </div>
                    {dbt.resolution_notes && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 p-2.5 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <span className="font-bold text-emerald-600">Faculty Clarification: </span>
                        {dbt.resolution_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dbt.status === "clarified"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {dbt.status === "clarified" ? "Clarified" : "Open Doubt"}
                    </span>
                    <button
                      onClick={() => handleToggleDoubt(dbt.id, dbt.status)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white dark:border-slate-700 dark:text-slate-300"
                    >
                      {dbt.status === "clarified" ? "Reopen" : "Mark Clarified"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Doubt Modal */}
      {showDoubtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Log Conceptual Doubt
            </h3>
            <form onSubmit={handleAddDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newDoubtSubject}
                  onChange={(e) => setNewDoubtSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  What is your doubt or question?
                </label>
                <textarea
                  rows={4}
                  required
                  value={newDoubtQuestion}
                  onChange={(e) => setNewDoubtQuestion(e.target.value)}
                  placeholder="e.g. In AS 14, how is amalgamation in the nature of merger vs purchase distinguished regarding reserves?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDoubtModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Save Doubt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Flashcard Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Create New Revision Flashcard
            </h3>
            <form onSubmit={handleAddFlashcard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newCardSubject}
                  onChange={(e) => setNewCardSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Chapter / Topic
                </label>
                <input
                  type="text"
                  value={newCardChapter}
                  onChange={(e) => setNewCardChapter(e.target.value)}
                  placeholder="e.g. General Meetings"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Front (Question / Prompt)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  placeholder="e.g. Quorum requirements for public company under Sec 103?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Back (Statutory Answer / Explanation)
                </label>
                <textarea
                  rows={3}
                  required
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  placeholder="e.g. <1000 members: 5; 1000-5000: 15; >5000: 30 personally present."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
