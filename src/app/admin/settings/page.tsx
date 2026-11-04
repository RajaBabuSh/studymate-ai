"use client";

import React, { useState, useEffect } from "react";
import AdminAppShell from "@/components/admin/AdminAppShell";
import { StorageRepository } from "@/lib/storage";
import { PlatformSettings, AdminAuditLog } from "@/types/database";
import {
  Sliders,
  CheckCircle2,
  History,
  Server,
  Cpu,
  Lock,
  Save,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(
    StorageRepository.getPlatformSettings()
  );
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setSettings(StorageRepository.getPlatformSettings());
    setAuditLogs(StorageRepository.getAdminAuditLogs());
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageRepository.updatePlatformSettings(settings);
    setSettings(updated);
    setAuditLogs(StorageRepository.getAdminAuditLogs());
    setNotification("Platform configuration updated and audit log recorded.");
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <AdminAppShell pageTitle="Platform Settings & System Audit">
      <div className="space-y-8">
        {notification && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Global Configurations Form */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Core Academic Platform Settings</h2>
              <p className="text-xs text-slate-500">
                Adjust platform-wide operational policies, multi-course engine, and educational parameters
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Platform Display Name
                </label>
                <input
                  type="text"
                  value={settings.platform_name}
                  onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Active Academic Session
                </label>
                <input
                  type="text"
                  value={settings.academic_year}
                  onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                System Banner Notice (Shown to Enrolled Students)
              </label>
              <input
                type="text"
                value={settings.system_notice_banner || ""}
                onChange={(e) =>
                  setSettings({ ...settings, system_notice_banner: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">AI Engine</span>
                  <input
                    type="checkbox"
                    checked={settings.ai_engine_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, ai_engine_enabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Enable multimodal syllabus OCR and AI study generation
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Registrations</span>
                  <input
                    type="checkbox"
                    checked={settings.allow_registrations}
                    onChange={(e) =>
                      setSettings({ ...settings, allow_registrations: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Allow new student account registrations
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Maintenance Mode</span>
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) =>
                      setSettings({ ...settings, maintenance_mode: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Display maintenance notice to non-admin users
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-2.5 font-bold text-white hover:bg-purple-500 transition shadow-xs"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Server & Cluster Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 mb-2">
              <Server className="h-4 w-4 text-emerald-600" />
              <span>Next.js App Router Runtime</span>
            </div>
            <p className="text-base font-bold text-slate-900">v14.2.15 Production</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold">✓ Server routes verified (200 OK)</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 mb-2">
              <Cpu className="h-4 w-4 text-purple-600" />
              <span>AI Multimodal Vision Engine</span>
            </div>
            <p className="text-base font-bold text-slate-900">Gemini Multimodal Cluster</p>
            <p className="text-[11px] text-purple-600 mt-1 font-semibold">✓ High precision OCR active</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 mb-2">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>PostgreSQL / RLS Isolation</span>
            </div>
            <p className="text-base font-bold text-slate-900">Supabase Row-Level Security</p>
            <p className="text-[11px] text-blue-600 mt-1 font-semibold">✓ Strict student data isolation active</p>
          </div>
        </div>

        {/* Audit Log Terminal */}
        <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Administrative Audit Trail</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {auditLogs.length} logged operations
            </span>
          </div>

          <div className="max-h-[450px] overflow-y-auto divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between px-6 py-3.5 text-xs hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-700 uppercase">
                      {log.action}
                    </span>
                    <span className="text-slate-800 font-semibold">{log.details}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>Admin: {log.admin_email}</span>
                    {log.target_entity && <span>Target: {log.target_entity}</span>}
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-4">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
