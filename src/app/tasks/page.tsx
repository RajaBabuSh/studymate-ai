"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { StudentTask, Subject } from "@/types/database";
import {
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filter tabs: "all" | "today" | "pending" | "completed"
  const [activeTab, setActiveTab] = useState<"all" | "today" | "pending" | "completed">("all");

  // Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");

  const loadData = useCallback(() => {
    const userId = user?.id;
    setTasks(StorageRepository.getTasks(userId));
    setSubjects(StorageRepository.getSubjects(userId));
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "today") return t.due_date === todayStr;
    if (activeTab === "pending") return !t.is_completed;
    if (activeTab === "completed") return t.is_completed;
    return true;
  });

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          is_completed: !t.is_completed,
          completed_at: !t.is_completed ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const sub = subjects.find((s) => s.id === taskSubjectId);

    const newTask: StudentTask = {
      id: `task-${Date.now()}`,
      student_id: user?.id || "student-active",
      title: taskTitle.trim(),
      subject_id: sub?.id,
      subject_name: sub?.name || undefined,
      due_date: taskDueDate,
      priority: taskPriority,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);

    setTaskTitle("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & ADD BUTTON                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-indigo-600" />
              <span>My Tasks</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Organize your daily study goals, assignments, and revision checklists.
            </p>
          </div>

          <button
            onClick={() => {
              setTaskTitle("");
              setTaskDueDate(todayStr);
              setTaskPriority("medium");
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Task</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FILTER TABS                                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "all"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab("today")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "today"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Today ({tasks.filter((t) => t.due_date === todayStr).length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Pending ({tasks.filter((t) => !t.is_completed).length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "completed"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Completed ({tasks.filter((t) => t.is_completed).length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TASK LIST                                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <CheckSquare className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No tasks in this view</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Create New Task&quot; above to add your first study task.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const isOverdue = !task.is_completed && task.due_date < todayStr;

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    task.is_completed
                      ? "bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-800 opacity-60"
                      : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800/50 dark:border-slate-700/80 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                        task.is_completed
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800"
                      }`}
                    >
                      {task.is_completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 opacity-0" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${
                          task.is_completed
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {task.subject_name && <span>{task.subject_name} •</span>}
                        <span className={isOverdue ? "text-rose-500 font-bold" : ""}>
                          Due: {task.due_date}
                        </span>
                        {isOverdue && <span className="text-rose-500 font-bold">(Overdue)</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        task.priority === "high"
                          ? "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
                          : task.priority === "medium"
                          ? "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD TASK                                               */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Task</h3>

            <form onSubmit={handleAddTask} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete chapter summary notes"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Subject (Optional)
                </label>
                <select
                  value={taskSubjectId}
                  onChange={(e) => setTaskSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">None / General</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
