import React from 'react';
import { UserRole, AppTabId, UserPersona } from '../types';
import { Lock, ShieldAlert, UserCheck, ArrowRight, Key } from 'lucide-react';

interface AccessDeniedGateProps {
  tabName: string;
  tabId: AppTabId;
  currentPersona: UserPersona;
  requiredRoles: UserRole[];
  onSwitchToAdmin: () => void;
  onOpenPermissions: () => void;
}

export const AccessDeniedGate: React.FC<AccessDeniedGateProps> = ({
  tabName,
  tabId,
  currentPersona,
  requiredRoles,
  onSwitchToAdmin,
  onOpenPermissions,
}) => {
  const roleNameMap: Record<UserRole, string> = {
    READER: 'Standard Reader',
    GENRE_LEAD: 'Genre Group Lead',
    COORDINATOR_ADMIN: 'Coordinator Admin',
  };

  return (
    <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldAlert className="w-3.5 h-3.5" />
          Access Level Restricted
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          "{tabName}" is Restricted
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
          You are currently logged in as <strong className="text-slate-800">{currentPersona.name}</strong> ({currentPersona.email}) with the role of{' '}
          <span className="font-semibold text-rose-700">{roleNameMap[currentPersona.role]}</span>.
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Required Permission Level:</span>
          <span className="font-bold text-slate-900">
            {requiredRoles.map((r) => roleNameMap[r]).join(' or ')}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
          <span className="text-slate-500 font-medium">Why is this tab locked?</span>
          <span className="text-slate-600 text-right">
            {tabId === 'my_reading' && 'Personal reading activity and private reviews tied to authorized email.'}
            {tabId === 'gtech' && 'Direct submission of bulk license fulfillment batches to Buganizer.'}
            {tabId === 'appsscript' && 'Backend production script code and Google Cloud project credentials.'}
            {tabId === 'nudges' && 'Dispatches mass automated email bot reminders to reader lists.'}
            {tabId === 'dashboard' && 'Lead-only review scores, DNF analytics, and quorum flags.'}
            {tabId === 'sheet' && 'Direct write access to Central Google Sheet schema.'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onSwitchToAdmin}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          Simulate as Coordinator Admin (Meg Beckley)
        </button>

        <button
          onClick={onOpenPermissions}
          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Key className="w-4 h-4" />
          Manage Tab Access Rules
        </button>
      </div>
    </div>
  );
};
