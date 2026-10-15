import React from 'react';
import { UserRole, AppTabId, TabAccessRule, UserPersona } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  UserCheck, 
  Key, 
  Users, 
  AlertCircle, 
  FileSpreadsheet, 
  Code, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';

interface AccessControlPanelProps {
  currentPersona: UserPersona;
  personas: UserPersona[];
  onSelectPersona: (persona: UserPersona) => void;
  tabRules: TabAccessRule[];
  onToggleTabRole: (tabId: AppTabId, role: UserRole) => void;
  onNavigateTab: (tabId: AppTabId) => void;
}

const ROLE_LABELS: Record<UserRole, { label: string; badgeClass: string; desc: string }> = {
  READER: {
    label: 'Standard Reader',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'Can submit books via Google Form and log reading ratings/progress.',
  },
  GENRE_LEAD: {
    label: 'Genre Group Lead',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: 'Manages genre shortlists, monitors under-read titles, and dispatches genre-specific nudges.',
  },
  COORDINATOR_ADMIN: {
    label: 'Coordinator Admin',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    desc: 'Full administrative access across all tabs, gTech fulfillment batches, and Apps Script backend.',
  },
};

export const AccessControlPanel: React.FC<AccessControlPanelProps> = ({
  currentPersona,
  personas,
  onSelectPersona,
  tabRules,
  onToggleTabRole,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide border border-indigo-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Role-Based Access Control (RBAC) &amp; Tab Permissions
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Access Control &amp; Security Levels</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Restrict different functional tabs based on user identity (<strong>Standard Reader</strong>, <strong>Genre Group Lead</strong>, or <strong>Coordinator Admin</strong>).
              Test how the UI adapts in real time by switching active personas below.
            </p>
          </div>

          {/* Current Active Persona Badge */}
          <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-md text-xs space-y-1 shrink-0">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Currently Logged In As:
            </span>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              {currentPersona.name}
            </div>
            <div className="font-mono text-indigo-200 text-[11px]">{currentPersona.email}</div>
            <div className="pt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_LABELS[currentPersona.role].badgeClass}`}>
                {ROLE_LABELS[currentPersona.role].label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Quick Persona Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Simulate User Personas (Test Access Levels)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any user to test the platform from their permission tier. Notice how tabs unlock or lock based on role.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {personas.map((p) => {
            const isSelected = p.email === currentPersona.email;
            return (
              <button
                key={p.email}
                onClick={() => onSelectPersona(p)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${ROLE_LABELS[p.role].badgeClass}`}>
                      {p.role === 'COORDINATOR_ADMIN' ? 'Admin' : p.role === 'GENRE_LEAD' ? 'Lead' : 'Reader'}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-blue-700">{p.email}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{p.badgeLabel}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Office: {p.country}</span>
                  {isSelected ? (
                    <span className="font-bold text-indigo-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
                    </span>
                  ) : (
                    <span className="text-slate-400 hover:text-indigo-600">Switch to User →</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tab Permission Matrix (Interactive Access Configuration) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-600" />
              Tab Access Level Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define which specific user roles are permitted to view and interact with each tab.
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
            Interactive Enforcement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Tab Name</th>
                <th className="py-3 px-3">Purpose &amp; Scope</th>
                <th className="py-3 px-3 text-center">Standard Reader</th>
                <th className="py-3 px-3 text-center">Genre Group Lead</th>
                <th className="py-3 px-3 text-center">Coordinator Admin</th>
                <th className="py-3 px-3 text-center">Your Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tabRules.map((rule) => {
                const isUserAllowed = rule.allowedRoles.includes(currentPersona.role);
                return (
                  <tr key={rule.tabId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {rule.tabLabel}
                        {!isUserAllowed && <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">#{rule.tabId}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                      {rule.description}
                    </td>

                    {/* Checkbox for Standard Reader */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onToggleTabRole(rule.tabId, 'READER')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          rule.allowedRoles.includes('READER')
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-400'
                        }`}
                        title="Toggle Reader Access"
                      >
                        {rule.allowedRoles.includes('READER') ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Checkbox for Genre Lead */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onToggleTabRole(rule.tabId, 'GENRE_LEAD')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          rule.allowedRoles.includes('GENRE_LEAD')
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-400'
                        }`}
                        title="Toggle Genre Lead Access"
                      >
                        {rule.allowedRoles.includes('GENRE_LEAD') ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Checkbox for Coordinator Admin */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onToggleTabRole(rule.tabId, 'COORDINATOR_ADMIN')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          rule.allowedRoles.includes('COORDINATOR_ADMIN')
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-400'
                        }`}
                        title="Toggle Admin Access"
                      >
                        {rule.allowedRoles.includes('COORDINATOR_ADMIN') ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Current User Access Indicator */}
                    <td className="py-3.5 px-3 text-center">
                      {isUserAllowed ? (
                        <button
                          onClick={() => onNavigateTab(rule.tabId)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Authorized
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Interactive RBAC Boundary Test Sandbox */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Live RBAC Security Boundary Sandbox
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test how the permission boundary enforces tab restrictions. Click any simulation to test immediate role enforcement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              const reader = personas.find(p => p.role === 'READER');
              if (reader) onSelectPersona(reader);
              onNavigateTab('gtech');
            }}
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left transition-colors cursor-pointer space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-800">
              <span>Test 1: Reader → gTech</span>
              <Lock className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-[11px] text-slate-600">
              Switches to <strong>David Chen (Reader)</strong> and attempts to access the gTech Buganizer pipeline.
            </p>
            <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
              Expects: Access Denied Gate
            </span>
          </button>

          <button
            onClick={() => {
              const lead = personas.find(p => p.role === 'GENRE_LEAD');
              if (lead) onSelectPersona(lead);
              onNavigateTab('appsscript');
            }}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition-colors cursor-pointer space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Test 2: Lead → Code.gs</span>
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-600">
              Switches to <strong>Dev Sodagar (Lead)</strong> and attempts to edit production Apps Script code.
            </p>
            <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Expects: Access Denied Gate
            </span>
          </button>

          <button
            onClick={() => {
              const admin = personas.find(p => p.role === 'COORDINATOR_ADMIN');
              if (admin) onSelectPersona(admin);
              onNavigateTab('dashboard');
            }}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-colors cursor-pointer space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>Test 3: Admin → All Tabs</span>
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-600">
              Switches to <strong>Meg Beckley / Leo Orringer (Admin)</strong> with full unrestricted clearance.
            </p>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Expects: Full Unlocked Access
            </span>
          </button>
        </div>
      </div>

      {/* 3. Google Workspace Deployment Guide for Tab Restrictions */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">
            How Tab Restrictions Map to Native Google Workspace Security
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              1. Protected Google Sheets
            </span>
            <p className="leading-relaxed">
              In Google Sheets: <em>Data &gt; Protect sheets and ranges</em>. Protect <code>Validation_Engine</code> and <code>Master_Library</code> so only Genre Leads &amp; Admins can edit formulas.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-600" />
              2. Apps Script Execution Context
            </span>
            <p className="leading-relaxed">
              In Google Apps Script: <code>Session.getActiveUser().getEmail()</code> inspects the caller. Functions like <code>generateBuganizerBatch()</code> reject callers who are not listed in the Admin role dictionary.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-purple-600" />
              3. Google Form Domain Permissions
            </span>
            <p className="leading-relaxed">
              Google Form settings: restrict responses strictly to <code>@google.com</code> domain accounts with verified email collection, preventing external unauthorized submissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
