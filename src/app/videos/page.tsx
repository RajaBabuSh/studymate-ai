"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { getCuratedVideos, CuratedVideo } from "@/lib/videoCatalog";
import { SavedVideo, VideoCategory, TeacherProfile } from "@/types/database";
import { recommendTeachers } from "@/lib/teacherCatalog";
import {
  Video,
  Search,
  Play,
  Heart,
  Plus,
  ExternalLink,
  Filter,
  Award,
  ThumbsUp,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function VideoLearningPage() {
  const { user, student } = useAuth();
  const [userSavedVideos, setUserSavedVideos] = useState<SavedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SavedVideo | CuratedVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Teacher Preferences State
  const [teacherLanguage, setTeacherLanguage] = useState<"all" | "Hindi" | "English" | "Hinglish">("all");
  const [teachingStyle, setTeachingStyle] = useState<TeacherProfile["teaching_style"] | "all">("all");
  const [teacherRatings, setTeacherRatings] = useState<Record<string, boolean>>({});

  // New video modal state
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newChapter, setNewChapter] = useState("");
  const [newCategory, setNewCategory] = useState<VideoCategory>("part_1");

  // Load student's enrolled subjects & saved videos
  const studentSubjects = useMemo(() => {
    return StorageRepository.getSubjects(user?.id);
  }, [user?.id]);

  const activeCourse = student?.course || "CA Intermediate";

  // Curated recommendations for this student's course
  const recommendedVideos = useMemo(() => {
    return getCuratedVideos(activeCourse);
  }, [activeCourse]);

  useEffect(() => {
    const list = StorageRepository.getVideos(user?.id);
    setUserSavedVideos(list);

    if (list.length > 0) {
      setSelectedVideo(list[0]);
    } else if (recommendedVideos.length > 0) {
      setSelectedVideo(recommendedVideos[0]);
    }

    if (studentSubjects.length > 0) {
      setNewSubject(studentSubjects[0].name);
    }

    const ratings = StorageRepository.getTeacherRatings(user?.id);
    setTeacherRatings(ratings);
  }, [user?.id, recommendedVideos, studentSubjects]);

  const recommendedTeachersList = useMemo(() => {
    return recommendTeachers({
      course: activeCourse,
      subjectName: selectedSubjectFilter !== "all" ? selectedSubjectFilter : undefined,
      language: teacherLanguage,
      teachingStyle: teachingStyle,
    });
  }, [activeCourse, selectedSubjectFilter, teacherLanguage, teachingStyle]);

  const handleRateTeacher = (teacherId: string, useful: boolean) => {
    const updated = { ...teacherRatings, [teacherId]: useful };
    setTeacherRatings(updated);
    StorageRepository.rateTeacher(teacherId, useful, user?.id);
  };

  // Combine curated videos with user's saved videos
  const combinedVideos: Array<SavedVideo | CuratedVideo> = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<SavedVideo | CuratedVideo> = [];

    // User's custom and favorited videos first
    userSavedVideos.forEach((v) => {
      seen.add(v.youtube_video_id);
      result.push(v);
    });

    // Then curated course videos
    recommendedVideos.forEach((v) => {
      if (!seen.has(v.youtube_video_id)) {
        result.push({
          ...v,
          student_id: user?.id || "guest",
          progress_seconds: 0,
          is_completed: false,
          is_favorite: false,
          created_at: new Date().toISOString(),
        } as SavedVideo);
      }
    });

    return result;
  }, [userSavedVideos, recommendedVideos, user?.id]);

  const toggleFavorite = (videoItem: SavedVideo | CuratedVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyFav =
      "is_favorite" in videoItem && videoItem.is_favorite;
    const nextFav = !isCurrentlyFav;

    if (nextFav) {
      try {
        confetti({ particleCount: 30, spread: 50 });
      } catch {
        // ignore
      }
    }

    const updatedUserList = [...userSavedVideos];
    const existingIndex = updatedUserList.findIndex(
      (v) => v.youtube_video_id === videoItem.youtube_video_id
    );

    if (existingIndex >= 0) {
      updatedUserList[existingIndex].is_favorite = nextFav;
    } else {
      updatedUserList.push({
        id: `saved-vid-${Date.now()}`,
        student_id: user?.id || "guest",
        course: activeCourse,
        subject_name: videoItem.subject_name,
        chapter_title: videoItem.chapter_title,
        category: (videoItem.category as VideoCategory) || "part_1",
        youtube_video_id: videoItem.youtube_video_id,
        title: videoItem.title,
        channel_title: videoItem.channel_title,
        thumbnail_url: videoItem.thumbnail_url,
        duration_seconds: videoItem.duration_seconds,
        progress_seconds: 0,
        is_completed: false,
        is_favorite: nextFav,
        last_watched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    setUserSavedVideos(updatedUserList);
    StorageRepository.setVideos(updatedUserList, user?.id);

    if (selectedVideo?.youtube_video_id === videoItem.youtube_video_id) {
      setSelectedVideo({
        ...selectedVideo,
        is_favorite: nextFav,
      } as SavedVideo | CuratedVideo);
    }
  };

  const handleSelectVideo = (vid: SavedVideo | CuratedVideo) => {
    setSelectedVideo(vid);

    // Record last watched
    const updated = [...userSavedVideos];
    const existing = updated.find((v) => v.youtube_video_id === vid.youtube_video_id);
    if (existing) {
      existing.last_watched_at = new Date().toISOString();
    } else {
      updated.push({
        id: `vid-${Date.now()}`,
        student_id: user?.id || "guest",
        course: activeCourse,
        subject_name: vid.subject_name,
        chapter_title: vid.chapter_title,
        category: (vid.category as VideoCategory) || "part_1",
        youtube_video_id: vid.youtube_video_id,
        title: vid.title,
        channel_title: vid.channel_title,
        thumbnail_url: vid.thumbnail_url,
        duration_seconds: vid.duration_seconds,
        progress_seconds: Math.floor(vid.duration_seconds * 0.1),
        is_completed: false,
        is_favorite: false,
        last_watched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
    setUserSavedVideos(updated);
    StorageRepository.setVideos(updated, user?.id);
  };

  // Helper to extract YouTube ID
  const extractYouTubeId = (url: string): string => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : url.trim();
  };

  const handleAddCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const ytid = extractYouTubeId(newUrl);
    if (!ytid) return;

    const item: SavedVideo = {
      id: `vid-custom-${Date.now()}`,
      student_id: user?.id || "guest",
      course: activeCourse,
      subject_name: newSubject || "General Curriculum",
      chapter_title: newChapter || "Custom Lesson",
      category: newCategory,
      youtube_video_id: ytid,
      title: newTitle || `Curated Lesson (${ytid})`,
      channel_title: "Student Added Lesson",
      thumbnail_url: `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`,
      duration_seconds: 1200,
      progress_seconds: 0,
      is_completed: false,
      is_favorite: true,
      last_watched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const updated = [item, ...userSavedVideos];
    setUserSavedVideos(updated);
    StorageRepository.setVideos(updated, user?.id);
    setSelectedVideo(item);
    setShowAddModal(false);
    setNewUrl("");
    setNewTitle("");
    setNewChapter("");

    try {
      confetti({ particleCount: 35, spread: 55 });
    } catch {
      // ignore
    }
  };

  // Unique subjects for filter
  const subjectsFilterList = Array.from(
    new Set(combinedVideos.map((v) => v.subject_name))
  );

  const filteredVideos = combinedVideos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.channel_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.chapter_title && v.chapter_title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject =
      selectedSubjectFilter === "all" ||
      v.subject_name.toLowerCase().includes(selectedSubjectFilter.toLowerCase()) ||
      selectedSubjectFilter.toLowerCase().includes(v.subject_name.toLowerCase());

    const isFav = "is_favorite" in v && v.is_favorite;
    const matchesCategory =
      selectedCategoryFilter === "all" ||
      (selectedCategoryFilter === "favorites" && isFav) ||
      v.category === selectedCategoryFilter;

    return matchesSearch && matchesSubject && matchesCategory;
  });

  const isCurrentFav =
    selectedVideo &&
    "is_favorite" in selectedVideo &&
    Boolean(selectedVideo.is_favorite);

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white">
              <Video className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Personalized Video Learning
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>
              Curated lessons tailored for <strong>{activeCourse}</strong>
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>Updated with syllabus chapters & past paper reviews</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-500 hover:to-indigo-500 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Video</span>
        </button>
      </div>

      {/* Phase 11: Video Learning Module On Hold Notification */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/40 p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
          !
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-amber-950 dark:text-amber-100 uppercase tracking-wider">
              Video Learning Module – On Hold for Next Release (Coming Soon)
            </h3>
            <span className="rounded bg-amber-200/60 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
              Active Development
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
            Automated YouTube discovery and chapter video linking is currently on hold while we prioritize verified curriculum accuracy, multi-milestone spaced revisions, and AI Exam Readiness algorithms. All previously saved videos and manual entries remain fully accessible.
          </p>
        </div>
      </div>

      {/* Main Player & Theater Mode */}
      {selectedVideo && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.youtube_video_id}?autoplay=0&rel=0&modestbranding=1`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  {selectedVideo.subject_name}
                </span>
                {selectedVideo.category && (
                  <span className="rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                    {selectedVideo.category.replace("_", " ")}
                  </span>
                )}
                {selectedVideo.chapter_title && (
                  <span className="text-xs text-slate-400 font-medium truncate max-w-xs">
                    • {selectedVideo.chapter_title}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {selectedVideo.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Channel:{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {selectedVideo.channel_title}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => toggleFavorite(selectedVideo, e)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  isCurrentFav
                    ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isCurrentFav ? "fill-rose-500 text-rose-500" : ""}`}
                />
                <span>{isCurrentFav ? "Saved to Favorites" : "Save Lesson"}</span>
              </button>

              <a
                href={`https://www.youtube.com/watch?v=${selectedVideo.youtube_video_id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open on YouTube</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 7: Intelligent YouTube Teacher Recommendations & Ratings */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Recommended Educators & Faculty for {activeCourse}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Verified faculty with proven pedagogical track record; rate whether explanations helped you understand!
            </p>
          </div>

          {/* Teacher Filters: Language & Teaching Style */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={teacherLanguage}
              onChange={(e) => setTeacherLanguage(e.target.value as "all" | "Hindi" | "English" | "Hinglish")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Languages</option>
              <option value="Hinglish">Hinglish</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
            </select>

            <select
              value={teachingStyle}
              onChange={(e) => setTeachingStyle(e.target.value as TeacherProfile["teaching_style"] | "all")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Teaching Styles</option>
              <option value="examples_first">Examples-First</option>
              <option value="slow_detailed">Slow & Detailed</option>
              <option value="visual">Visual Explanations</option>
              <option value="short_revision">Short Revision</option>
            </select>
          </div>
        </div>

        {/* Teachers Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendedTeachersList.map((teacher) => {
            const isUseful = teacherRatings[teacher.id] === true;

            return (
              <div
                key={teacher.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{teacher.name}</span>
                        <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 text-[9px] font-extrabold">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{teacher.channel_name}</p>
                    </div>

                    <span className="rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 text-[10px] font-bold">
                      ★ {teacher.rating}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {teacher.bio}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="rounded bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.2 text-[9px] font-medium">
                      {teacher.language}
                    </span>
                    <span className="rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 text-[9px] font-medium capitalize">
                      {teacher.teaching_style.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400">Explanation useful?</span>
                  <button
                    type="button"
                    onClick={() => handleRateTeacher(teacher.id, !isUseful)}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-bold border transition ${
                      isUseful
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <ThumbsUp className={`h-3 w-3 ${isUseful ? "fill-emerald-500" : ""}`} />
                    <span>{isUseful ? "Useful! (Voted)" : "Helpful"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Category Tabs (Part 1, Part 2, Part 3, Revision, Practice, Mock Tests) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 dark:border-slate-800">
        {[
          { id: "all", label: "All Lessons" },
          { id: "part_1", label: "Part 1 (Fundamentals)" },
          { id: "part_2", label: "Part 2 (Advanced Topics)" },
          { id: "part_3", label: "Part 3 (Case Laws & In-Depth)" },
          { id: "revision", label: "Complete Revision / Marathon" },
          { id: "practice", label: "Past Questions / RTP Drill" },
          { id: "mock_test", label: "Mock Tests & Strategy" },
          { id: "favorites", label: "Favorites" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategoryFilter(tab.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedCategoryFilter === tab.id
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCourse} lessons...`}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Subjects Selector Pills */}
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
            All Subjects
          </button>

          {subjectsFilterList.map((subName) => (
            <button
              key={subName}
              onClick={() => setSelectedSubjectFilter(subName)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition truncate max-w-[170px] ${
                selectedSubjectFilter === subName
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {subName}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Video className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              No lessons match your current filter
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try switching subject or category filter, or click &quot;Add Custom Video&quot; above.
            </p>
          </div>
        ) : (
          filteredVideos.map((vid) => {
            const isSelected = selectedVideo?.youtube_video_id === vid.youtube_video_id;
            const isFav = "is_favorite" in vid && Boolean(vid.is_favorite);

            return (
              <div
                key={vid.youtube_video_id}
                onClick={() => handleSelectVideo(vid)}
                className={`group cursor-pointer rounded-2xl border bg-white p-3 shadow-subtle dark:border-slate-800 dark:bg-slate-900 transition flex flex-col justify-between ${
                  isSelected
                    ? "border-purple-500 ring-2 ring-purple-500/20"
                    : "hover:border-purple-300 dark:hover:border-purple-900"
                }`}
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vid.thumbnail_url}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-9 w-9 rounded-full bg-white/90 text-purple-600 flex items-center justify-center shadow">
                        <Play className="h-4 w-4 fill-purple-600 ml-0.5" />
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(vid, e)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-110 transition"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`}
                      />
                    </button>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider truncate">
                        {vid.subject_name}
                      </span>
                      {vid.category && (
                        <span className="text-[9px] font-semibold text-slate-400 uppercase">
                          • {vid.category.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5">
                      {vid.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">{vid.channel_title}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{Math.round(vid.duration_seconds / 60)} mins</span>
                  {vid.chapter_title && (
                    <span className="truncate max-w-[120px]">{vid.chapter_title}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-purple-600" />
              <span>Add Custom YouTube Study Lesson</span>
            </h3>

            <form onSubmit={handleAddCustomVideo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  YouTube Video URL or Video ID
                </label>
                <input
                  type="text"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule III Balance Sheet Format Breakdown"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  >
                    {studentSubjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="General Study Session">General Study Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as VideoCategory)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="part_1">Part 1 (Fundamentals)</option>
                    <option value="part_2">Part 2 (Advanced Topics)</option>
                    <option value="part_3">Part 3 (Case Laws)</option>
                    <option value="revision">Complete Revision</option>
                    <option value="practice">Practice Questions</option>
                    <option value="mock_test">Mock Tests</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter Topic (Optional)
                </label>
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  placeholder="e.g. Schedule III Presentation"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow"
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
