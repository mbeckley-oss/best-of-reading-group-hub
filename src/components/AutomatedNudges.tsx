import React, { useState } from 'react';
import { NudgeTemplate, BookWithStats, ReaderLog } from '../types';
import { 
  Mail, 
  Clock, 
  Send, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Calendar, 
  Users, 
  MessageSquare, 
  Flame,
  Terminal,
  RefreshCw
} from 'lucide-react';

interface AutomatedNudgesProps {
  templates: NudgeTemplate[];
  books: BookWithStats[];
  allLogs: ReaderLog[];
}

export const AutomatedNudges: React.FC<AutomatedNudgesProps> = ({
  templates,
  books,
  allLogs,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([
    '2026-09-28 09:00:00 — Stale Hold Bot: Scanned 26 active holds.',
    '2026-09-28 09:00:01 — Flagged 2 holds inactive > 14 days (jordan_b, david_c).',
    '2026-09-28 09:00:02 — Validation Engine updated: 2 slots marked as "Potentially Open".',
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastDispatchedMessage, setLastDispatchedMessage] = useState<string | null>(null);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Stale holds readers
  const staleHoldsLogs = allLogs.filter(l => l.isStaleHold);

  const handleSimulateRun = (template: NudgeTemplate) => {
    setIsSimulating(true);
    setLastDispatchedMessage(null);

    setTimeout(() => {
      const now = new Date().toLocaleTimeString();
      let logMsg = '';
      if (template.triggerType === 'STALE_HOLD') {
        logMsg = `${now} — Stale Hold Bot: Dispatched 2 reminder emails to [jordan_b@google.com, david_c@google.com].`;
      } else if (template.triggerType === 'OCTOBER_WINDOW') {
        logMsg = `${now} — October Window Bot: Dispatched urgent cross-reading announcement to #best-of-reading Chat channel.`;
      } else if (template.triggerType === 'HIDDEN_GEM_ALERT') {
        logMsg = `${now} — Hidden Gem Bot: Generated digest featuring "Martyr!" (67% Top 2 conviction).`;
      } else {
        logMsg = `${now} — Dispatched ${template.title} simulation to eligible readers.`;
      }

      setDispatchLogs(prev => [logMsg, ...prev]);
      setIsSimulating(false);
      setLastDispatchedMessage(`Successfully executed "${template.title}" time-driven trigger!`);
      setTimeout(() => setLastDispatchedMessage(null), 5000);
    }, 800);
  };

  // Preview replacement
  const renderPreviewBody = () => {
    if (!selectedTemplate) return '';
    let body = selectedTemplate.templateBody;
    const sampleBook = books[0] || { title: 'James', author: 'Percival Everett' };
    const sampleLog = staleHoldsLogs[0] || { submitterName: 'Jordan Bell', submitterLdap: 'jordan_b', submitterEmail: 'jordan_b@google.com', submitterCountry: 'Australia', lastUpdated: '2026-08-20' };

    body = body.replace(/{{READER_NAME}}/g, sampleLog.submitterName || 'Jordan Bell');
    body = body.replace(/{{SUBMITTER_EMAIL}}/g, sampleLog.submitterEmail || 'jordan_b@google.com');
    body = body.replace(/{{SUBMITTER_COUNTRY}}/g, sampleLog.submitterCountry || 'Australia');
    body = body.replace(/{{READER_LDAP}}/g, sampleLog.submitterLdap || 'jordan_b');
    body = body.replace(/{{GENRE_GROUP}}/g, sampleBook.genreGroup || 'Fiction');
    body = body.replace(/{{BOOK_TITLE}}/g, sampleBook.title);
    body = body.replace(/{{BOOK_AUTHOR}}/g, sampleBook.author);
    body = body.replace(/{{LAST_UPDATED}}/g, sampleLog.lastUpdated || '2026-08-20');
    body = body.replace(/{{FORM_URL}}/g, 'https://forms.gle/best-of-reading-2026');

    return body;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Time-Driven Apps Script Email Bots
              </span>
              <span className="text-xs text-slate-400">Automated Community Engagement</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Automated Nudges &amp; Hold Verification</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Eliminates manual admin gatekeeping. Google Apps Script cron triggers monitor the sheet and nudge readers automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Stale Holds Flagged: <strong className="text-amber-700">{staleHoldsLogs.length} readers</strong>
            </span>
          </div>
        </div>

        {lastDispatchedMessage && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {lastDispatchedMessage}
          </div>
        )}

        {/* Nudge Rule Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-5">
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    tpl.triggerType === 'STALE_HOLD'
                      ? 'bg-amber-100 text-amber-800'
                      : tpl.triggerType === 'OCTOBER_WINDOW'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {tpl.frequency}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <h4 className="font-bold text-slate-900 text-sm mt-2">{tpl.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    Eligible: <strong className="text-slate-900">{tpl.eligibleCount}</strong>
                  </span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1">
                    Preview <Eye className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Template Live Preview & Test Run Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Email Simulator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Bot Message Preview
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedTemplate.title}
              </h3>
            </div>

            <button
              onClick={() => handleSimulateRun(selectedTemplate)}
              disabled={isSimulating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Executing Trigger...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Test Run Apps Script Trigger
                </>
              )}
            </button>
          </div>

          {/* Email Envelope Header */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 text-slate-700 font-sans">
            <div>
              <span className="text-slate-400 font-medium">From: </span>
              <span className="font-semibold text-slate-800">Best Of Reading Leads &lt;best-of-leads@google.com&gt;</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">To: </span>
              <span className="font-mono text-blue-700">jordan_b@google.com (Sample Target Reader)</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Subject: </span>
              <span className="font-semibold text-slate-900">{selectedTemplate.defaultSubject.replace('{{BOOK_TITLE}}', books[0]?.title || 'James')}</span>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
            {renderPreviewBody()}
          </div>
        </div>

        {/* Right 1 Col: Execution Logs & Stale Hold Watchlist */}
        <div className="space-y-4">
          {/* Stale Hold Watchlist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              14-Day Inactivity Watchlist ({staleHoldsLogs.length})
            </h4>
            <p className="text-xs text-slate-500">
              Readers with no updates in &gt;14 days. These spots are flagged as "Potentially Open" to prevent placeholder holds.
            </p>

            <div className="divide-y divide-slate-100">
              {staleHoldsLogs.map((log) => {
                const book = books.find(b => b.id === log.bookId);
                return (
                  <div key={log.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-700">{log.submitterEmail}</span>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded">
                        Inactive ({log.submitterCountry})
                      </span>
                    </div>
                    <div className="font-medium text-slate-800">{book?.title}</div>
                    <div className="text-[11px] text-slate-500 italic">"{log.notes}"</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trigger Execution Console */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 shadow-sm space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
                Trigger Execution Console
              </span>
              <span className="text-[10px]">Google Apps Script</span>
            </div>

            <div className="h-44 overflow-y-auto space-y-1.5 pt-1 text-slate-300">
              {dispatchLogs.map((log, i) => (
                <div key={i} className="leading-snug">
                  <span className="text-emerald-500">&gt; </span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
