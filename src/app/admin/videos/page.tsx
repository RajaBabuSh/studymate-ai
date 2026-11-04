"use client";

import React, { useState, useEffect } from "react";
import AdminAppShell from "@/components/admin/AdminAppShell";
import { StorageRepository } from "@/lib/storage";
import { SavedVideo } from "@/types/database";
import {
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Search,
} from "lucide-react";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [title, setTitle] = useState("");
  const [channelTitle, setChannelTitle] = useState("");
  const [subjectName, setSubjectName] = useState("Corporate Accounting");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const loadVideos = () => {
    const list = StorageRepository.getVideos();
    setVideos(list);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const extractYoutubeId = (input: string): string => {
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : input.trim();
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const vidId = extractYoutubeId(youtubeInput);
    if (!vidId || !title) return;

    const newVideo: SavedVideo = {
      id: `vid-${Date.now().toString(36)}`,
      student_id: "system-catalog",
      subject_name: subjectName,
      youtube_video_id: vidId,
      title,
      channel_title: channelTitle || "Verified Faculty Educator",
      thumbnail_url: `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`,
      duration_seconds: durationMinutes * 60,
      progress_seconds: 0,
      is_completed: false,
      is_favorite: true,
      created_at: new Date().toISOString(),
    };

    const updated = [newVideo, ...videos];
    setVideos(updated);
    StorageRepository.setVideos(updated);
    StorageRepository.addAuditLog(
      "video_created",
      `Added verified video lecture: "${title}" by ${channelTitle} (${vidId})`,
      newVideo.id
    );

    setShowAddModal(false);
    setYoutubeInput("");
    setTitle("");
    setChannelTitle("");
    setNotification(`Video "${title}" indexed into student catalog.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = (id: string, vidTitle: string) => {
    if (confirm(`Remove video "${vidTitle}" from catalog?`)) {
      const updated = videos.filter((v) => v.id !== id);
      setVideos(updated);
      StorageRepository.setVideos(updated);
      StorageRepository.addAuditLog("video_deleted", `Video removed: ${vidTitle}`, id);
      setNotification(`Video removed.`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.channel_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminAppShell pageTitle="Curated Educational Video Catalog">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Curate and manage verified YouTube lectures and marathon revision playlists
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Integrated directly into the student video learning module with peaceful, distraction-free playback
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Video Lecture</span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search lectures, subjects, educators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 focus:outline-none shadow-xs"
          />
        </div>

        {/* Video Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition"
            >
              <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800">
                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 right-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-white">
                  {Math.round(video.duration_seconds / 60)} mins
                </div>
                <div className="absolute top-2 left-2 rounded-md bg-purple-600/90 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Verified Faculty
                </div>
              </div>

              <div className="p-4">
                <span className="rounded-md bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                  {video.subject_name}
                </span>

                <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
                  {video.title}
                </h3>

                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{video.channel_title}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 font-semibold transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Watch Link</span>
                  </a>

                  <button
                    onClick={() => handleDelete(video.id, video.title)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                    title="Remove video"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Video Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add YouTube Study Lecture</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddVideo} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    YouTube URL or Video ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://youtu.be/dQw4w9WgXcQ or dQw4w9WgXcQ"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lecture Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AS 14 Amalgamation Full Concept & Numerical Solved"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Channel / Faculty</label>
                    <input
                      type="text"
                      placeholder="e.g. CA Parveen Sharma"
                      value={channelTitle}
                      onChange={(e) => setChannelTitle(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mapped Subject</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-500 transition shadow-xs cursor-pointer"
                  >
                    Save Lecture
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
