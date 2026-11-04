"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { Note } from "@/types/database";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Tag,
  Paperclip,
  Filter,
  Sparkles,
  Upload,
  Edit2,
  X,
  FileCheck2,
  Camera,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function MyNotesPage() {
  const { user, student } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [noteToRename, setNoteToRename] = useState<Note | null>(null);
  const [renamedTitle, setRenamedTitle] = useState("");

  // New Note Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  // File Upload & Preview State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadFileType, setUploadFileType] = useState<"image" | "pdf" | "document" | "none">("none");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  // Student's real enrolled subjects
  const studentSubjects = useMemo(() => {
    return StorageRepository.getSubjects(user?.id);
  }, [user?.id]);

  const activeCourse = student?.course || "CA Intermediate";

  useEffect(() => {
    const list = StorageRepository.getNotes(user?.id);
    setNotes(list);
    if (list.length > 0) {
      setSelectedNote(list[0]);
    }

    if (studentSubjects.length > 0) {
      setNewSubjectName(studentSubjects[0].name);
    }
  }, [user?.id, studentSubjects]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);

    if (file.type.startsWith("image/")) {
      setUploadFileType("image");
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      setUploadFileType("pdf");
      setPreviewUrl("pdf-document");
    } else {
      setUploadFileType("document");
      setPreviewUrl("file-document");
    }
  };

  // Run AI OCR on uploaded handwritten or notebook image
  const handleRunOCR = async () => {
    if (!uploadFile) return;
    setIsProcessingOCR(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/ai/ocr-note", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.text) {
        setNewContent((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
        try {
          confetti({ particleCount: 30, spread: 50 });
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("OCR request failed", err);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedSub = studentSubjects.find((s) => s.name === newSubjectName);
    const tagsArr = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const newNoteItem: Note = {
      id: `note_${user?.id || "guest"}_${Date.now()}`,
      student_id: user?.id || "guest",
      course: activeCourse,
      subject_id: matchedSub?.id || "sub-default",
      subject_name: newSubjectName || "General Curriculum",
      chapter_title: newChapterTitle || "Key Topic",
      title: newTitle.trim(),
      content: newContent.trim() || "No text description provided.",
      tags: tagsArr.length > 0 ? tagsArr : ["Study Notes"],
      attachment_urls: previewUrl && previewUrl !== "pdf-document" ? [previewUrl] : [],
      attachment_type: uploadFileType,
      attachment_name: uploadFile?.name,
      extracted_ocr_text: newContent.trim(),
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newNoteItem, ...notes];
    setNotes(updated);
    StorageRepository.setNotes(updated, user?.id);
    setSelectedNote(newNoteItem);

    // Reset Form
    setShowAddModal(false);
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setUploadFile(null);
    setPreviewUrl("");
    setUploadFileType("none");

    try {
      confetti({ particleCount: 35, spread: 55 });
    } catch {
      // ignore
    }
  };

  const togglePin = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.map((n) => (n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n));
    setNotes(updated);
    StorageRepository.setNotes(updated, user?.id);

    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, is_pinned: !selectedNote.is_pinned });
    }
  };

  const deleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    StorageRepository.setNotes(updated, user?.id);

    if (selectedNote?.id === noteId) {
      setSelectedNote(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleOpenRename = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteToRename(note);
    setRenamedTitle(note.title);
    setShowRenameModal(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteToRename || !renamedTitle.trim()) return;

    const updated = notes.map((n) =>
      n.id === noteToRename.id
        ? { ...n, title: renamedTitle.trim(), updated_at: new Date().toISOString() }
        : n
    );

    setNotes(updated);
    StorageRepository.setNotes(updated, user?.id);

    if (selectedNote?.id === noteToRename.id) {
      setSelectedNote({
        ...selectedNote,
        title: renamedTitle.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    setShowRenameModal(false);
    setNoteToRename(null);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.chapter_title && n.chapter_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject =
      selectedSubjectFilter === "all" ||
      (selectedSubjectFilter === "pinned" && n.is_pinned) ||
      (selectedSubjectFilter === "attachments" && n.attachment_type !== "none") ||
      n.subject_name.toLowerCase() === selectedSubjectFilter.toLowerCase();

    return matchesSearch && matchesSubject;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Notes & Study Material
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>
              Organized for <strong>{activeCourse}</strong>
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>Upload handwritten notebook photos, PDF summaries, and formulas with OCR</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-purple-500 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Upload / Create Note</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, chapters, formulas, or tags..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:block" />
          <button
            onClick={() => setSelectedSubjectFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedSubjectFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            All Notes ({notes.length})
          </button>
          <button
            onClick={() => setSelectedSubjectFilter("pinned")}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedSubjectFilter === "pinned"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span>Pinned</span>
          </button>
          <button
            onClick={() => setSelectedSubjectFilter("attachments")}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedSubjectFilter === "attachments"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Paperclip className="h-3 w-3 text-indigo-400" />
            <span>Files & Photos</span>
          </button>

          {studentSubjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectFilter(sub.name)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition truncate max-w-[150px] ${
                selectedSubjectFilter.toLowerCase() === sub.name.toLowerCase()
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Notes Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Notes Index */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Notes Index ({sortedNotes.length})
          </h2>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {sortedNotes.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 text-xs text-slate-400">
                No notes found matching this filter.
              </div>
            ) : (
              sortedNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                const hasAttachment = note.attachment_type && note.attachment_type !== "none";

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`group cursor-pointer rounded-2xl border p-4 transition flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-white shadow-md dark:border-indigo-500 dark:bg-slate-900 ring-2 ring-indigo-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">
                          {note.subject_name}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenRename(note, e)}
                            title="Rename note"
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-500 transition"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => togglePin(note.id, e)}
                            className={`h-6 w-6 rounded-lg flex items-center justify-center transition ${
                              note.is_pinned
                                ? "text-amber-500"
                                : "text-slate-300 hover:text-slate-600"
                            }`}
                          >
                            <Pin
                              className={`h-3.5 w-3.5 ${note.is_pinned ? "fill-amber-500" : ""}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteNote(note.id, e)}
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {note.title}
                      </h3>

                      {note.chapter_title && (
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {note.chapter_title}
                        </p>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {note.content.replace(/[#*`]/g, "")}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
                      <span>{formatDate(note.created_at)}</span>
                      {hasAttachment && (
                        <span className="flex items-center gap-1 text-indigo-500 font-medium">
                          <Paperclip className="h-3 w-3" />
                          <span>{note.attachment_type}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Full Note Preview & Reader */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-5">
              {/* Header of selected note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {selectedNote.subject_name}
                    </span>
                    {selectedNote.course && (
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {selectedNote.course}
                      </span>
                    )}
                    {selectedNote.chapter_title && (
                      <span className="text-xs text-slate-400 font-medium">
                        • {selectedNote.chapter_title}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                    {selectedNote.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Last modified on {formatDate(selectedNote.updated_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleOpenRename(selectedNote, e)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => togglePin(selectedNote.id, e)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      selectedNote.is_pinned
                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Pin
                      className={`h-3.5 w-3.5 ${
                        selectedNote.is_pinned ? "fill-amber-500" : ""
                      }`}
                    />
                    <span>{selectedNote.is_pinned ? "Pinned" : "Pin"}</span>
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    <Tag className="h-3 w-3 text-slate-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              {/* Uploaded File / Image Preview */}
              {selectedNote.attachment_urls && selectedNote.attachment_urls.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-indigo-400" />
                      <span>Original Uploaded Note Photograph</span>
                    </span>
                    {selectedNote.attachment_name && (
                      <span className="text-[11px] text-slate-400">
                        {selectedNote.attachment_name}
                      </span>
                    )}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedNote.attachment_urls[0]}
                    alt={selectedNote.title}
                    className="max-h-96 w-full object-contain rounded-xl bg-black"
                  />
                </div>
              )}

              {/* Note Content / Markdown Display */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Transcribed & Personal Study Content
                </h3>
                <div className="rounded-2xl bg-slate-50/70 p-5 dark:bg-slate-800/30 font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line border border-slate-100 dark:border-slate-800">
                  {selectedNote.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                Select a note from the left index to view content
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload / Create Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400" />
                <span>Upload Study Material & Create Note</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              {/* File Upload Zone */}
              <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-200">
                  Upload handwritten note photos, notebook pages, or PDFs
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Private storage: files are secured with user-level access
                </p>

                <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {uploadFile && (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-900 p-2.5 text-xs text-left">
                    <span className="font-medium text-emerald-400 truncate flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 shrink-0" />
                      <span>{uploadFile.name}</span>
                    </span>

                    {uploadFileType === "image" && (
                      <button
                        type="button"
                        disabled={isProcessingOCR}
                        onClick={handleRunOCR}
                        className="shrink-0 flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{isProcessingOCR ? "Extracting..." : "Run AI OCR"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. AS 14 Amalgamation Schemes Summary"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <select
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {studentSubjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="General Study Material">General Study Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chapter Topic
                  </label>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="e.g. Schedule III Formatting"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Study Notes Content / Markdown
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write formulas, definitions, key statutory sections, or use Run AI OCR to transcribe uploaded handwriting..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Formula, Exam Question, Revision"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Note Modal */}
      {showRenameModal && noteToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-indigo-400" />
              <span>Rename Note</span>
            </h3>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Title
                </label>
                <input
                  type="text"
                  required
                  value={renamedTitle}
                  onChange={(e) => setRenamedTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
