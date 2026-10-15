import React, { useState, useMemo, useEffect } from 'react';
import { BookWithStats, ReaderLog, GenreGroup, SheetSyncEvent, ReadingStatus } from '../types';
import { 
  FileSpreadsheet, 
  HelpCircle, 
  Download, 
  CheckCircle2, 
  Layers, 
  Code,
  Table as TableIcon,
  Flame,
  AlertCircle,
  Globe2,
  Mail,
  Filter,
  Heart,
  Rocket,
  Palette,
  Lock,
  History,
  ArrowRight,
  ExternalLink,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface CentralSheetViewProps {
  books: BookWithStats[];
  allLogs: ReaderLog[];
  selectedGenreGroup: GenreGroup;
  onSelectGenreGroup: (group: GenreGroup) => void;
  currentUserEmail?: string;
  isReaderOnly?: boolean;
  isAdmin?: boolean;
  onDeleteLog?: (logId: string) => void;
  lastUpdatedLogId?: string | null;
  lastSyncEvent?: SheetSyncEvent | null;
  syncHistory?: SheetSyncEvent[];
}

export const CentralSheetView: React.FC<CentralSheetViewProps> = ({ 
  books, 
  allLogs,
  selectedGenreGroup,
  onSelectGenreGroup,
  currentUserEmail,
  isReaderOnly = false,
  isAdmin = false,
  onDeleteLog,
  lastUpdatedLogId,
  lastSyncEvent,
  syncHistory = [],
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'logs' | 'validation' | 'query_dash'>('logs');
  const [selectedCellFormula, setSelectedCellFormula] = useState<string>('=COUNTIF(Reader_Logs!D:D, Master_Library!A2)');
  const [restrictToEmail, setRestrictToEmail] = useState<boolean>(isReaderOnly);
  const [showSyncHistory, setShowSyncHistory] = useState<boolean>(false);
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [logToDelete, setLogToDelete] = useState<ReaderLog | null>(null);
  const [deletionToast, setDeletionToast] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!logToDelete || !onDeleteLog) return;
    const book = books.find(b => b.id === logToDelete.bookId);
    const bookTitle = book?.title || 'Unknown Title';
    const email = logToDelete.submitterEmail;
    
    onDeleteLog(logToDelete.id);
    setLogToDelete(null);
    setDeletionToast(`Log deleted for ${email} on "${bookTitle}"`);
    setTimeout(() => {
      setDeletionToast(null);
    }, 4500);
  };

  // If a live sync event arrives from Reading Hub, automatically focus the logs tab and cell formula
  useEffect(() => {
    if (lastSyncEvent) {
      setActiveTab('logs');
      setSelectedCellFormula(`=${lastSyncEvent.sheetTab || 'Reader_Logs'}!${lastSyncEvent.cellRef || 'G2'} (Status = "${lastSyncEvent.updatedStatus}")`);
    }
  }, [lastSyncEvent]);

  // Export current active tab or logs as CSV
  const handleExportCsv = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'master') {
      filename = `Master_Library_${selectedGenreGroup.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['DocID', 'Book Title', 'Author', 'Genre Group', 'Sub-Genre', 'Release Date', 'Submitter Email', 'Country', 'Active Readers'];
      const rows = filteredBooks.map(b => [
        `"${b.docId}"`,
        `"${b.title.replace(/"/g, '""')}"`,
        `"${b.author.replace(/"/g, '""')}"`,
        `"${b.genreGroup}"`,
        `"${b.subGenre}"`,
        `"${b.releaseDate}"`,
        `"${b.submittedByEmail || ''}"`,
        `"${b.submittedByCountry || ''}"`,
        b.activeReaders
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      filename = `Reader_Logs_${selectedGenreGroup.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['Row', 'Timestamp', 'Submitter Email', 'Country', 'Book Title', 'Genre Group', 'Status', 'Release Date', 'Rating', 'Top 2?', 'Notes / DNF Reason'];
      const rows = filteredLogs.map((l, idx) => {
        const book = books.find(b => b.id === l.bookId);
        return [
          idx + 2,
          `"${l.lastUpdated}"`,
          `"${l.submitterEmail}"`,
          `"${l.submitterCountry}"`,
          `"${(book?.title || 'Unknown').replace(/"/g, '""')}"`,
          `"${book?.genreGroup || ''}"`,
          `"${l.status}"`,
          `"${l.releaseDate}"`,
          l.rating || '',
          l.isTopTwo ? 'YES' : 'No',
          `"${(l.dnfReason ? 'DNF: ' + l.dnfReason : (l.notes || '')).replace(/"/g, '""')}"`
        ];
      });
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter books and logs based on genre group and optional email-tied restriction
  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedGenreGroup !== 'All Genres') {
      result = result.filter(b => b.genreGroup === selectedGenreGroup);
    }
    if (restrictToEmail && currentUserEmail) {
      result = result.filter(b => b.readerLogs.some(l => l.submitterEmail.toLowerCase() === currentUserEmail.toLowerCase()));
    }
    return result;
  }, [books, selectedGenreGroup, restrictToEmail, currentUserEmail]);

  const filteredLogs = useMemo(() => {
    let result = allLogs;
    if (selectedGenreGroup !== 'All Genres') {
      result = result.filter(l => {
        const book = books.find(b => b.id === l.bookId);
        return book?.genreGroup === selectedGenreGroup;
      });
    }
    if (restrictToEmail && currentUserEmail) {
      result = result.filter(l => l.submitterEmail.toLowerCase() === currentUserEmail.toLowerCase());
    }
    return result;
  }, [allLogs, books, selectedGenreGroup, restrictToEmail, currentUserEmail]);

  return (
    <div className="space-y-4">
      {/* Google Sheets Header Bar */}
      <div className="bg-[#0f9d58] text-white p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg text-[#0f9d58] shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">Best_Of_Reading_Master_Database.gsheet</h2>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">Central Database</span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Captures <strong>Email, Country, Release Date, and Status</strong> directly across Romance &amp; YA, Sci-Fi &amp; Fantasy, Comics &amp; Manga.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Genre Group Filter in Sheet View */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl text-xs backdrop-blur-xs">
            <span className="text-emerald-100 text-[11px] px-2 font-medium">Filter:</span>
            {(['All Genres', 'Romance & YA', 'Science Fiction & Fantasy', 'Comics & Manga'] as GenreGroup[]).map(g => (
              <button
                key={g}
                onClick={() => onSelectGenreGroup(g)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedGenreGroup === g
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-emerald-100 hover:bg-white/10'
                }`}
              >
                {g === 'All Genres' && 'All'}
                {g === 'Romance & YA' && 'Romance'}
                {g === 'Science Fiction & Fantasy' && 'Sci-Fi'}
                {g === 'Comics & Manga' && 'Manga'}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <button
            onClick={handleExportCsv}
            className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Download active sheet table as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowDriveModal(true)}
            className="bg-emerald-900/80 hover:bg-emerald-900 text-white font-semibold text-xs px-3 py-1.5 rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Where is this sheet located and how to open it in Google Drive"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>Where in Drive?</span>
          </button>
        </div>
      </div>

      {/* Formula Bar Simulation */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs shadow-2xs">
        <div className="font-bold text-slate-400 font-mono select-none px-2 py-1 bg-slate-100 rounded">
          fx
        </div>
        <div className="font-mono text-slate-800 flex-1 overflow-x-auto whitespace-nowrap">
          {selectedCellFormula}
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
          Showing: {selectedGenreGroup}
        </span>
      </div>

      {/* Real-Time Live Sync Alert from Reading Hub */}
      {lastSyncEvent && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="font-bold text-emerald-900 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Live Status Update Synced to Google Sheet:
            </span>
            <span className="text-slate-800">
              <strong>{lastSyncEvent.email}</strong> updated status for <em>"{lastSyncEvent.bookTitle}"</em> to{' '}
              <strong className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-bold border border-emerald-300">
                {lastSyncEvent.updatedStatus}
              </strong>
              {lastSyncEvent.previousStatus && lastSyncEvent.previousStatus !== lastSyncEvent.updatedStatus && (
                <span className="text-slate-500 ml-1">
                  (was: <span className="line-through">{lastSyncEvent.previousStatus}</span>)
                </span>
              )}
              {' '}→ Written to cell <strong className="font-mono text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">{lastSyncEvent.sheetTab}!{lastSyncEvent.cellRef || 'G?'}</strong> (Row {lastSyncEvent.rowNumber || 2}) at {lastSyncEvent.timestamp}.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('logs');
                setSelectedCellFormula(`=${lastSyncEvent.sheetTab || 'Reader_Logs'}!${lastSyncEvent.cellRef || 'G2'}`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              Highlight Cell {lastSyncEvent.cellRef}
            </button>
            {syncHistory.length > 0 && (
              <button
                onClick={() => setShowSyncHistory(!showSyncHistory)}
                className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
              >
                <History className="w-3 h-3 text-emerald-700" />
                <span>Sync Log ({syncHistory.length})</span>
              </button>
            )}
            <span className="text-[10px] font-mono text-emerald-800 bg-white/90 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
              Google Sheets API (v4) • Synced
            </span>
          </div>
        </div>
      )}

      {/* Expandable Live Sync History Log */}
      {showSyncHistory && syncHistory.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              Recent Live Status Changes Synced from Reading Hub Tabs
            </span>
            <button
              onClick={() => setShowSyncHistory(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto font-mono text-[11px]">
            {syncHistory.map((ev, i) => (
              <div key={i} className="py-1.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{ev.sheetTab}!{ev.cellRef}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-blue-300">{ev.email}</span>
                  <span className="text-slate-400">set</span>
                  <span className="text-white font-sans font-bold">"{ev.bookTitle}"</span>
                  <span className="text-slate-400">to</span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/40">
                    {ev.updatedStatus}
                  </span>
                </div>
                <span className="text-slate-500 shrink-0">{ev.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row-Level Security (RLS) Email Filter Control */}
      {currentUserEmail && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              Row-Level Restriction:
            </span>
            <span className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {currentUserEmail}
            </span>
            {restrictToEmail ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                🔒 Active (Showing only records tied to {currentUserEmail})
              </span>
            ) : (
              <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">
                Unrestricted (Showing all records)
              </span>
            )}
          </div>

          <button
            onClick={() => {
              const next = !restrictToEmail;
              setRestrictToEmail(next);
              if (next) {
                setSelectedCellFormula(`=FILTER(Reader_Logs!A2:L, LOWER(Reader_Logs!B2:B) = "${currentUserEmail.toLowerCase()}")`);
              } else {
                setSelectedCellFormula('=COUNTIF(Reader_Logs!D:D, Master_Library!A2)');
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              restrictToEmail
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            {restrictToEmail ? (
              <>
                <Lock className="w-3 h-3" />
                Email Filter: Active (Click to Show All)
              </>
            ) : (
              <>
                <Filter className="w-3 h-3 text-indigo-600" />
                Restrict Sheet to My Email Only
              </>
            )}
          </button>
        </div>
      )}

      {/* Sheet Workbook Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Tab 1: Master_Library */}
        {activeTab === 'master' && (
          <div className="overflow-x-auto">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-600 flex justify-between">
              <span>TAB: Master_Library (DocIDs, Titles, Authors, Genre Groups, Release Dates, Submitter Details)</span>
              <span>{filteredBooks.length} rows ({selectedGenreGroup})</span>
            </div>
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100/80 text-slate-600 text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-200 w-12 text-center text-slate-400">Row</th>
                  <th className="py-2 px-3 border-r border-slate-200">DocID</th>
                  <th className="py-2 px-3 border-r border-slate-200">Book Title</th>
                  <th className="py-2 px-3 border-r border-slate-200">Author</th>
                  <th className="py-2 px-3 border-r border-slate-200">Genre Group</th>
                  <th className="py-2 px-3 border-r border-slate-200">Sub-Genre</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-700">Release Date</th>
                  <th className="py-2 px-3 border-r border-slate-200">Submitter Email</th>
                  <th className="py-2 px-3 border-r border-slate-200">Country</th>
                  <th className="py-2 px-3 text-center">Readers (=COUNTIF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((b, idx) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedCellFormula(`=COUNTIF(Reader_Logs!D:D, "${b.docId}")`)}
                  >
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-400 bg-slate-50/50">
                      {idx + 2}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-blue-700">
                      {b.docId}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {b.coverImageUrl && (
                          <img
                            src={b.coverImageUrl}
                            alt={b.title}
                            className="w-6 h-8 rounded object-cover shadow-2xs shrink-0 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="font-serif font-bold text-stone-900">{b.title}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-serif italic text-stone-800">
                      {b.author}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.genreGroup === 'Romance & YA'
                          ? 'bg-pink-100 text-pink-800'
                          : b.genreGroup === 'Science Fiction & Fantasy'
                          ? 'bg-indigo-100 text-indigo-800'
                          : b.genreGroup === 'Comics & Manga'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {b.genreGroup}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-500 text-[11px]">
                      {b.subGenre}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-center font-semibold text-slate-800">
                      {b.releaseDate}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-blue-700">
                      {b.submittedByEmail || 'mbeckley@google.com'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                      {b.submittedByCountry || 'United States'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          b.isCapped ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {b.activeReaders} {b.activeReaders === 1 ? 'reader' : 'readers'}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-semibold flex-wrap justify-center">
                          {b.totalFinished > 0 && (
                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                              {b.totalFinished} Finished
                            </span>
                          )}
                          {b.totalDnf > 0 && (
                            <span className="text-rose-700 bg-rose-50 px-1 rounded border border-rose-200">
                              {b.totalDnf} DNF
                            </span>
                          )}
                          {(b.activeReaders - b.totalFinished - b.totalDnf) > 0 && (
                            <span className="text-blue-700 bg-blue-50 px-1 rounded border border-blue-200">
                              {b.activeReaders - b.totalFinished - b.totalDnf} Reading
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Reader_Logs (CAPTURING EMAIL, COUNTRY, RELEASE DATE, STATUS) */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <div className="bg-emerald-50/70 px-4 py-2 border-b border-emerald-200 text-xs font-semibold text-emerald-900 flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                TAB: Reader_Logs — Capturing Submitter Email, Country, Release Date, and Status
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <Trash2 className="w-3 h-3 text-rose-600" /> Admin Delete Enabled
                  </span>
                )}
                <span>{filteredLogs.length} entries ({selectedGenreGroup})</span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100/90 text-slate-600 text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-200 w-12 text-center text-slate-400">Row</th>
                  <th className="py-2 px-3 border-r border-slate-200">Timestamp</th>
                  <th className="py-2 px-3 border-r border-slate-200 font-bold text-blue-900">Email Address</th>
                  <th className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">Country</th>
                  <th className="py-2 px-3 border-r border-slate-200">Book Title</th>
                  <th className="py-2 px-3 border-r border-slate-200">Genre Group</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-900">Status</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-900">Release Date</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center">Rating</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center">Top 2?</th>
                  <th className={`py-2 px-3 ${isAdmin ? 'border-r border-slate-200' : ''}`}>Reader Notes / DNF Reason</th>
                  {isAdmin && (
                    <th className="py-2 px-3 text-center font-bold text-rose-700 w-16" title="Admin option to delete this individual log">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => {
                  const book = books.find(b => b.id === log.bookId);
                  const isLiveSynced = lastUpdatedLogId === log.id || (lastSyncEvent && lastSyncEvent.logId === log.id);

                  return (
                    <tr 
                      key={log.id} 
                      className={`transition-all cursor-pointer ${
                        isLiveSynced
                          ? 'bg-emerald-100/70 border-l-4 border-l-emerald-600 font-medium ring-1 ring-emerald-400'
                          : 'hover:bg-blue-50/40'
                      }`}
                      onClick={() => setSelectedCellFormula(`=IF(G${idx + 2}="Finished", I${idx + 2}>=4, "IN_PROGRESS")`)}
                    >
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-400 bg-slate-50/50">
                        {idx + 2}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">
                        {log.lastUpdated}
                      </td>
                      {/* REQUIRED FIELD: EMAIL */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-semibold text-blue-700">
                        {log.submitterEmail}
                      </td>
                      {/* REQUIRED FIELD: COUNTRY */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Globe2 className="w-3 h-3 text-slate-400" />
                          {log.submitterCountry}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-serif font-bold text-stone-900">
                        {book?.title || 'Unknown Title'}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          book?.genreGroup === 'Romance & YA'
                            ? 'bg-pink-100 text-pink-800'
                            : book?.genreGroup === 'Science Fiction & Fantasy'
                            ? 'bg-indigo-100 text-indigo-800'
                            : book?.genreGroup === 'Comics & Manga'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {book?.genreGroup || 'Fiction'}
                        </span>
                      </td>
                      {/* REQUIRED FIELD: STATUS */}
                      <td 
                        className="py-2.5 px-3 border-r border-slate-200 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCellFormula(`=Reader_Logs!G${idx + 2} (Status: "${log.status}" updated by ${log.submitterEmail})`);
                        }}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'Finished'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : log.status === 'DNF'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : log.isStaleHold
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {log.status}
                          </span>
                          {isLiveSynced && (
                            <span className="text-[9px] font-bold text-emerald-950 bg-emerald-300 px-1.5 py-0.5 rounded-full animate-pulse border border-emerald-400 font-mono shadow-2xs">
                              ⚡ Cell G{idx + 2} Synced
                            </span>
                          )}
                        </div>
                      </td>
                      {/* REQUIRED FIELD: RELEASE DATE */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-semibold text-slate-700">
                        {log.releaseDate}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">
                        {log.rating ? `${log.rating} ★` : '—'}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                        {log.isTopTwo ? (
                          <span className="text-amber-600 font-bold flex items-center justify-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-amber-500" /> YES
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className={`py-2.5 px-3 text-slate-600 text-[11px] ${isAdmin ? 'border-r border-slate-200' : ''}`}>
                        {log.dnfReason ? (
                          <span className="text-rose-700 font-medium">DNF: {log.dnfReason}</span>
                        ) : (
                          log.notes || '—'
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setLogToDelete(log)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer group"
                            title={`Delete log for ${log.submitterEmail} on "${book?.title}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5 group-hover:scale-115 transition-transform text-rose-500" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Validation_Engine */}
        {activeTab === 'validation' && (
          <div className="overflow-x-auto">
            <div className="bg-amber-50/80 px-4 py-2.5 border-b border-amber-200 text-xs text-amber-900 flex justify-between items-center">
              <span className="font-semibold">
                TAB: Validation_Engine — 5-Reader Volume Caps &amp; Real-time Formula Calculation
              </span>
              <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                Formula: =COUNTIF(Reader_Logs!E:E, Title)
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100/90 text-slate-600 text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-200 w-12 text-center text-slate-400">Row</th>
                  <th className="py-2 px-3 border-r border-slate-200">DocID</th>
                  <th className="py-2 px-3 border-r border-slate-200">Title</th>
                  <th className="py-2 px-3 border-r border-slate-200">Genre Group</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center">Release Date</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center">Reader Count (=COUNTIF)</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center">Cap Status</th>
                  <th className="py-2 px-3 text-center">Top 2 Ratio (Conviction)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((b, idx) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedCellFormula(`=IF(F${idx + 2}>=5, "CAPPED - WAITLIST", "OPEN ("&(5-F${idx + 2})&" SLOTS)")`)}
                  >
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-400 bg-slate-50/50">
                      {idx + 2}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-blue-700">
                      {b.docId}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
                      {b.title}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">
                      {b.genreGroup}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-700">
                      {b.releaseDate}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">
                      <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {b.activeReaders} / 5
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        b.isCapped
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : b.isUnderRead
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {b.isCapped ? '⛔ CAPPED (Waitlist)' : `✅ OPEN (${5 - b.activeReaders} slots)`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded font-bold border border-indigo-200">
                        {Math.round(b.convictionScore * 100)}% ({b.topTwoVotes}/{b.activeReaders})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: QUERY & Genre Filters */}
        {activeTab === 'query_dash' && (
          <div className="p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-emerald-600" />
                Dedicated Sheet Tab: Genre Lead Query Engine
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Native Google Sheets formulas to extract and isolate data for Romance &amp; YA, Science Fiction &amp; Fantasy, and Comics &amp; Manga leads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-pink-900">Romance &amp; YA Lead Query</span>
                <div className="p-2.5 bg-slate-900 text-pink-300 font-mono text-[11px] rounded-lg overflow-x-auto">
                  =FILTER(Reader_Logs!A2:K, Reader_Logs!F2:F = "Romance &amp; YA")
                </div>
                <p className="text-[11px] text-slate-500">
                  Filters all submissions, email addresses, and country data for Dev Sodagar’s Romance &amp; YA review squad.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-indigo-900">Science Fiction &amp; Fantasy Quorum Query</span>
                <div className="p-2.5 bg-slate-900 text-indigo-300 font-mono text-[11px] rounded-lg overflow-x-auto">
                  =QUERY(Validation_Engine!A2:H, "SELECT C, E, F WHERE D = 'Science Fiction &amp; Fantasy' AND F &lt; 3")
                </div>
                <p className="text-[11px] text-slate-500">
                  Isolates SFF books with &lt;3 readers to assign urgent cross-readers before December voting.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-amber-900">Comics &amp; Manga Shortlist Query</span>
                <div className="p-2.5 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-lg overflow-x-auto">
                  =QUERY(Master_Library!A2:J, "SELECT C, D, G, J WHERE E = 'Comics &amp; Manga' ORDER BY J DESC")
                </div>
                <p className="text-[11px] text-slate-500">
                  Ranks Comics &amp; Manga titles by reader consensus and Top 2 conviction.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-blue-900">Global Country Distribution Query</span>
                <div className="p-2.5 bg-slate-900 text-blue-300 font-mono text-[11px] rounded-lg overflow-x-auto">
                  =QUERY(Reader_Logs!A2:H, "SELECT D, COUNT(C) GROUP BY D LABEL COUNT(C) 'Submissions'")
                </div>
                <p className="text-[11px] text-slate-500">
                  Aggregates submissions by country (US, UK, Ireland, Canada, Japan, etc.) for gTech regional fulfillment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tab Bar (Google Sheets Style) */}
        <div className="bg-slate-100 border-t border-slate-200 px-3 py-2 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('logs');
              setSelectedCellFormula('=Reader_Logs!A2:K');
            }}
            className={`px-4 py-1.5 rounded-t text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-white text-emerald-800 font-bold border-t-2 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>📝 Reader_Logs</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Form Append
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('master');
              setSelectedCellFormula('=Master_Library!A2:J');
            }}
            className={`px-4 py-1.5 rounded-t text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'master'
                ? 'bg-white text-emerald-800 font-bold border-t-2 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>📋 Master_Library</span>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 flex items-center gap-0.5">
              🛡️ Protected (Leads)
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('validation');
              setSelectedCellFormula('=COUNTIF(Reader_Logs!E:E, Title)');
            }}
            className={`px-4 py-1.5 rounded-t text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'validation'
                ? 'bg-white text-amber-900 font-bold border-t-2 border-amber-500 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>⚡ Validation_Engine</span>
            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 flex items-center gap-0.5">
              🔒 Admin Only
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('query_dash');
              setSelectedCellFormula('=FILTER(Reader_Logs!A2:K, Reader_Logs!F2:F = "Romance & YA")');
            }}
            className={`px-4 py-1.5 rounded-t text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'query_dash'
                ? 'bg-white text-blue-900 font-bold border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>📊 Genre_Lead_Queries</span>
            <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
              Leads
            </span>
          </button>
        </div>
      </div>

      {/* Where in Google Drive? Guide Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Where to Find &amp; How to Connect This Google Sheet</h3>
                  <p className="text-xs text-slate-500 font-mono">Best_Of_Reading_Master_Database.gsheet</p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  1. Live In-App Spreadsheet (Active Right Now)
                </span>
                <p className="text-emerald-900 text-xs">
                  This entire tab (<strong>Central Google Sheet</strong>) acts as the live runtime database. Every time a reader submits a request or updates their reading progress in <strong>My Reading Hub</strong>, it instantly updates the cells in <code>Reader_Logs</code> and recalculates <code>Master_Library</code> and <code>Validation_Engine</code>.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <span className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  2. Deploy into your Google Drive (Personal or Shared Drive)
                </span>
                <p className="text-blue-900 text-xs">
                  To create and manage this spreadsheet directly within your corporate Google Drive workspace:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-blue-900 text-xs">
                  <li>
                    Open <strong><a href="https://sheets.new" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700">sheets.new</a></strong> in your browser to create a new spreadsheet and name it <strong>Best_Of_Reading_Master_Database</strong>.
                  </li>
                  <li>
                    In this app, click the <strong>Apps Script Backend</strong> tab and copy the complete <code>Code.gs</code> script.
                  </li>
                  <li>
                    In your Google Sheet, open <strong>Extensions &gt; Apps Script</strong>, paste the code, and click <strong>Save &amp; Run `initialSetup()`</strong>.
                  </li>
                  <li>
                    The script will automatically build all 5 tabs (<code>Reader_Logs</code>, <code>Master_Library</code>, <code>Validation_Engine</code>, <code>Genre_Lead_Queries</code>, <code>gTech_Pipeline</code>) with headers, cell formatting, validation rules, and formulas.
                  </li>
                </ol>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-slate-600" />
                  3. Instant CSV Export
                </span>
                <p className="text-slate-600 text-xs">
                  You can click the <strong>Export CSV</strong> button at the top of this view at any time to download the entire database as a standard CSV file, which can be imported directly into Google Drive via <strong>File &gt; Import &gt; Upload</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDriveModal(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Log Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Reader Log Entry</h3>
                <p className="text-xs text-slate-500 font-mono">Central Google Sheet Row Removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this reader log? This will update the active reader count for this book and recalculate all lead dashboard stats.
            </p>

            {/* Log details summary card */}
            {(() => {
              const book = books.find(b => b.id === logToDelete.bookId);
              return (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-medium">Reader:</span>
                    <span className="font-mono font-semibold text-slate-900 text-right">{logToDelete.submitterEmail}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-medium">Book Title:</span>
                    <span className="font-bold text-slate-900 text-right">{book?.title || 'Unknown Title'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Country / Date:</span>
                    <span className="text-slate-700">{logToDelete.submitterCountry} • {logToDelete.lastUpdated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Status / Rating:</span>
                    <span className="font-semibold text-slate-800">
                      {logToDelete.status} {logToDelete.rating ? `(${logToDelete.rating}★)` : ''} {logToDelete.isTopTwo ? '• Top 2' : ''}
                    </span>
                  </div>
                  {logToDelete.notes && (
                    <div className="pt-1 border-t border-slate-200/60 text-slate-600 italic text-[11px]">
                      "{logToDelete.notes}"
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Log</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Toast Notification */}
      {deletionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5">
          <div className="bg-rose-500/20 text-rose-400 p-1.5 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </div>
          <span className="font-medium">{deletionToast}</span>
          <button onClick={() => setDeletionToast(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
