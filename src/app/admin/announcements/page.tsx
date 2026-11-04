"use client";

import React, { useState, useEffect } from "react";
import AdminAppShell from "@/components/admin/AdminAppShell";
import { StorageRepository } from "@/lib/storage";
import { Announcement, AnnouncementPriority } from "@/types/database";
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetCourse, setTargetCourse] = useState("all");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [notification, setNotification] = useState<string | null>(null);

  const loadAnnouncements = () => {
    setAnnouncements(StorageRepository.getAnnouncements());
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newAnn: Announcement = {
      id: `ann-${Date.now().toString(36)}`,
      title,
      content,
      target_course: targetCourse,
      priority,
      is_active: true,
      created_at: new Date().toISOString(),
      author_email: "admin@studymate.ai",
    };

    StorageRepository.saveAnnouncement(newAnn);
    loadAnnouncements();
    setShowAddModal(false);
    setTitle("");
    setContent("");
    setNotification(`Announcement published successfully to target: ${targetCourse}.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = (id: string, annTitle: string) => {
    if (confirm(`Delete announcement "${annTitle}"?`)) {
      StorageRepository.deleteAnnouncement(id);
      loadAnnouncements();
      setNotification("Announcement removed.");
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <AdminAppShell pageTitle="Platform Announcements & Student Broadcasts">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Broadcast critical examination date changes, mock test releases, and platform notices
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted broadcasts automatically appear on enrolled students&apos; dashboards and notification bells
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Announcement</span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isUrgent = ann.priority === "urgent";
            const isImportant = ann.priority === "important";

            return (
              <div
                key={ann.id}
                className={`rounded-2xl border p-5 transition shadow-xs ${
                  isUrgent
                    ? "border-rose-200 bg-white"
                    : isImportant
                    ? "border-amber-200 bg-white"
                    : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 shadow-xs ${
                        isUrgent
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : isImportant
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-purple-50 text-purple-600 border border-purple-200"
                      }`}
                    >
                      <Megaphone className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isUrgent
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : isImportant
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {ann.priority}
                        </span>

                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Target: {ann.target_course === "all" ? "All Students" : ann.target_course}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{ann.content}</p>

                      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(ann.created_at).toLocaleDateString()} at{" "}
                          {new Date(ann.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>Author: {ann.author_email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="text-slate-400 hover:text-rose-600 transition"
                    title="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Broadcast Platform Announcement</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Headline / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ICAI Revised Examination Guidelines & Mock Test Availability"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                    <select
                      value={targetCourse}
                      onChange={(e) => setTargetCourse(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none"
                    >
                      <option value="all">All Enrolled Students</option>
                      <option value="CS Executive">CS Executive</option>
                      <option value="CSEET">CSEET</option>
                      <option value="CS Professional">CS Professional</option>
                      <option value="CA Foundation">CA Foundation</option>
                      <option value="CA Intermediate">CA Intermediate</option>
                      <option value="CA Final">CA Final</option>
                      <option value="B.Com">B.Com</option>
                      <option value="BBA">BBA</option>
                      <option value="BCA">BCA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none"
                    >
                      <option value="normal">Normal (Information)</option>
                      <option value="important">Important (Exam Alert)</option>
                      <option value="urgent">Urgent (Immediate Action)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write the complete announcement text..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-500 transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Publish Broadcast</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminAppShell>
  );
}
