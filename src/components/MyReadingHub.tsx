import React, { useState } from 'react';
import { BookWithStats, ReaderLog, UserPersona, ReadingStatus, SheetSyncEvent } from '../types';
import { 
  UserCheck, 
  Lock, 
  BookOpen, 
  Star, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Globe2, 
  Sparkles,
  ExternalLink,
  Edit3,
  BookMarked,
  Hourglass,
  CheckCircle,
  XCircle,
  ArrowRight,
  Filter,
  FileSpreadsheet,
  Bookmark,
  Flame
} from 'lucide-react';
import bookStillLifeUrl from '../assets/images/open_book_still_life_1790743798565.jpg';

interface MyReadingHubProps {
  currentPersona: UserPersona;
  books: BookWithStats[];
  allLogs: ReaderLog[];
  onUpdateLog: (bookId: string, logData: any) => void;
  onNavigateToForm: () => void;
  onNavigateToSheet?: () => void;
  lastSyncEvent?: SheetSyncEvent | null;
  syncHistory?: SheetSyncEvent[];
}

interface StatusSectionConfig {
  status: ReadingStatus;
  title: string;
  badgeLabel: string;
  description: string;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  badgeBg: string;
  emptyText: string;
}

const STATUS_SECTIONS: StatusSectionConfig[] = [
  {
    status: 'Requested',
    title: 'Requested Books',
    badgeLabel: 'Requested',
    description: 'Submitted requests waiting for gTech Play Books license fulfillment or arrival.',
    icon: Hourglass,
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-800',
    accentBorder: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    emptyText: 'No books currently in requested status.',
  },
  {
    status: 'Reading',
    title: 'Currently Reading',
    badgeLabel: 'Currently Reading',
    description: 'Books actively in progress. Update your notes or log reading milestones.',
    icon: BookOpen,
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-800',
    accentBorder: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    emptyText: 'No books currently in progress. Start reading from your requested titles!',
  },
  {
    status: 'Finished',
    title: 'Finished & Evaluated',
    badgeLabel: 'Finished',
    description: 'Books completed with star ratings, detailed reviews, and Top 2 of the Year votes.',
    icon: CheckCircle,
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-800',
    accentBorder: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    emptyText: 'No completed books yet. When you finish a book, mark it here to submit your review rating!',
  },
  {
    status: 'DNF',
    title: 'Did Not Finish (DNF)',
    badgeLabel: 'DNF',
    description: 'Books stepped away from with reason logging to help Leads evaluate viability.',
    icon: XCircle,
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-800',
    accentBorder: 'border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    emptyText: 'No books marked as DNF.',
  },
];

export const MyReadingHub: React.FC<MyReadingHubProps> = ({
  currentPersona,
  books,
  allLogs,
  onUpdateLog,
  onNavigateToForm,
  onNavigateToSheet,
  lastSyncEvent,
}) => {
  const [filterSection, setFilterSection] = useState<'ALL' | ReadingStatus>('ALL');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editStatus, setEditStatus] = useState<ReadingStatus>('Reading');
  const [editIsTopTwo, setEditIsTopTwo] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDnfReason, setEditDnfReason] = useState<string>('');

  // Strict email-tied restriction: Only filter logs belonging to the authenticated email
  const userLogs = allLogs.filter(
    (log) => log.submitterEmail.toLowerCase() === currentPersona.email.toLowerCase()
  );

  const totalClaimed = userLogs.length;
  const finishedCount = userLogs.filter((l) => l.status === 'Finished').length;
  const readingCount = userLogs.filter((l) => l.status === 'Reading').length;
  const requestedCount = userLogs.filter((l) => l.status === 'Requested').length;
  const dnfCount = userLogs.filter((l) => l.status === 'DNF').length;
  const topTwoCount = userLogs.filter((l) => l.isTopTwo).length;

  const handleStartEdit = (log: ReaderLog, defaultStatus?: ReadingStatus) => {
    setEditingLogId(log.id);
    const targetStatus = defaultStatus || log.status;
    setEditStatus(targetStatus);
    setEditRating(log.rating || 5);
    setEditIsTopTwo(!!log.isTopTwo);
    setEditNotes(log.notes || '');
    setEditDnfReason(log.dnfReason || '');
  };

  const handleSaveEdit = (bookId: string) => {
    onUpdateLog(bookId, {
      logId: editingLogId,
      submitterEmail: currentPersona.email,
      submitterCountry: currentPersona.country,
      status: editStatus,
      rating: editStatus === 'Finished' ? editRating : undefined,
      isTopTwo: editStatus === 'Finished' ? editIsTopTwo : false,
      notes: editNotes,
      dnfReason: editStatus === 'DNF' ? editDnfReason : undefined,
    });
    setEditingLogId(null);
  };

  const handleQuickStatusMove = (log: ReaderLog, newStatus: ReadingStatus) => {
    onUpdateLog(log.bookId, {
      logId: log.id,
      submitterEmail: currentPersona.email,
      submitterCountry: currentPersona.country,
      status: newStatus,
      rating: newStatus === 'Finished' ? 5 : undefined,
      isTopTwo: false,
    });
  };

  const sectionsToRender = filterSection === 'ALL'
    ? STATUS_SECTIONS
    : STATUS_SECTIONS.filter(s => s.status === filterSection);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Book-Themed Personal Reading Journal & Bookshelf Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E0D7C7] shadow-sm bg-stone-950 text-white">
        <div className="absolute inset-0">
          <img
            src={bookStillLifeUrl}
            alt="Cozy reading desk"
            className="w-full h-full object-cover object-right opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/40" />
        </div>

        <div className="relative z-10 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-serif tracking-wide border border-amber-400/30">
              <Bookmark className="w-3.5 h-3.5 text-amber-300" />
              <span>Personal Reading Logbook &amp; Quota Tracker</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-amber-50">
              My Reading Shelf &amp; Activity
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
              Restricted exclusively to records tied to your email: <strong className="text-amber-200 font-mono bg-white/10 px-2 py-0.5 rounded">{currentPersona.email}</strong>.
              Update your reading progress, write critical reviews, and cast your Top 2 of the Year votes.
            </p>
          </div>

          <div className="bg-[#FFFDF9]/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md text-xs space-y-1.5 shrink-0 self-start md:self-auto font-sans">
            <span className="text-[10px] font-serif font-bold text-amber-200/90 uppercase tracking-widest block">
              Ex Libris / Reader ID:
            </span>
            <div className="font-bold text-sm sm:text-base text-amber-50 font-serif flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              {currentPersona.name}
            </div>
            <div className="flex items-center gap-2 text-stone-300 text-[11px] pt-1">
              <Globe2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Office: {currentPersona.country}</span>
              <span>•</span>
              <span className="font-mono text-emerald-300 font-bold">{userLogs.length} Book Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Central Google Sheet Live Sync Confirmation */}
      {lastSyncEvent && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Central Google Sheet Updated Live</span>
                <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-full font-bold">
                  Sync OK • {lastSyncEvent.timestamp}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Tab <strong>Reader_Logs</strong> Row <strong className="font-mono text-emerald-950 font-bold">{lastSyncEvent.rowNumber || 2}</strong> (Cell <strong className="font-mono text-emerald-950 bg-emerald-200/80 px-1.5 py-0.5 rounded font-bold">{lastSyncEvent.cellRef || 'G?'}</strong>) status for <em>"{lastSyncEvent.bookTitle}"</em> has updated to{' '}
                <strong className="bg-emerald-200/90 text-emerald-950 px-1.5 py-0.5 rounded font-bold">
                  {lastSyncEvent.updatedStatus}
                </strong>{' '}
                under your account (<strong>{lastSyncEvent.email}</strong>).
                {lastSyncEvent.previousStatus && lastSyncEvent.previousStatus !== lastSyncEvent.updatedStatus && (
                  <span className="text-emerald-700 ml-1">
                    (Shifted from <em>{lastSyncEvent.previousStatus}</em>)
                  </span>
                )}
              </p>
            </div>
          </div>

          {onNavigateToSheet && (
            <button
              onClick={onNavigateToSheet}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Inspect in Central Sheet →</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Personal KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Claimed</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalClaimed}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all statuses</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Requested</span>
            <Hourglass className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{requestedCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting fulfillment</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
            <span>In Progress</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">{readingCount}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">Currently Reading</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Finished</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{finishedCount}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Reviews submitted</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center justify-between">
            <span>Top 2 Votes</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1">{topTwoCount} / 2</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {topTwoCount === 2 ? 'All votes cast' : `${2 - topTwoCount} remaining`}
          </div>
        </div>
      </div>

      {/* Status Section Filter Bar & Action Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Jump to Section:
          </span>

          <button
            onClick={() => setFilterSection('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSection === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sections ({totalClaimed})
          </button>

          <button
            onClick={() => setFilterSection('Requested')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterSection === 'Requested'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Hourglass className="w-3 h-3" />
            Requested ({requestedCount})
          </button>

          <button
            onClick={() => setFilterSection('Reading')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterSection === 'Reading'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Currently Reading ({readingCount})
          </button>

          <button
            onClick={() => setFilterSection('Finished')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterSection === 'Finished'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Finished ({finishedCount})
          </button>

          <button
            onClick={() => setFilterSection('DNF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterSection === 'DNF'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <XCircle className="w-3 h-3" />
            DNF ({dnfCount})
          </button>
        </div>

        <button
          onClick={onNavigateToForm}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          + Request New Title
        </button>
      </div>

      {/* SECTIONS RENDERED BY STATUS */}
      <div className="space-y-6">
        {sectionsToRender.map((sectionConfig) => {
          const sectionLogs = userLogs.filter((log) => log.status === sectionConfig.status);
          const IconComponent = sectionConfig.icon;

          return (
            <div 
              key={sectionConfig.status}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Section Header */}
              <div className={`p-4 border-b ${sectionConfig.accentBorder} ${sectionConfig.accentBg} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-white shadow-2xs ${sectionConfig.accentText}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{sectionConfig.title}</h3>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${sectionConfig.badgeBg}`}>
                        {sectionLogs.length} {sectionLogs.length === 1 ? 'Book' : 'Books'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sectionConfig.description}</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400 self-end sm:self-auto">
                  Status: <code>"{sectionConfig.status}"</code>
                </span>
              </div>

              {/* Section Content */}
              {sectionLogs.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-slate-400">
                  <IconComponent className="w-6 h-6 mx-auto stroke-1" />
                  <p className="text-xs font-medium text-slate-500">{sectionConfig.emptyText}</p>
                  {sectionConfig.status === 'Requested' && (
                    <button
                      onClick={onNavigateToForm}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                    >
                      Request a book via intake form →
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sectionLogs.map((log) => {
                    const book = books.find((b) => b.id === log.bookId);
                    const isEditing = editingLogId === log.id;

                    return (
                      <div key={log.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Book Info with 3D Hardcover Cover */}
                          <div className="flex items-start gap-4">
                            <div className="w-14 sm:w-16 h-20 sm:h-24 rounded-md overflow-hidden book-cover-3d relative bg-stone-900 shrink-0 self-start">
                              {book?.coverImageUrl ? (
                                <img
                                  src={book.coverImageUrl}
                                  alt={book?.title || 'Book cover'}
                                  className="w-full h-full object-cover rounded-md"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-800 to-stone-900 text-amber-100 flex flex-col items-center justify-between p-1.5 text-center">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-300 mt-1" />
                                  <span className="text-[8px] font-serif font-bold leading-tight line-clamp-2">
                                    {book?.title}
                                  </span>
                                </div>
                              )}
                              {/* Spine gutter effect */}
                              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-serif font-bold text-stone-900 text-base sm:text-lg leading-snug">
                                  {book?.title || 'Unknown Title'}
                                </h4>
                                <span className="text-xs text-stone-600 font-serif italic">by {book?.author || 'Unknown Author'}</span>
                                {log.isTopTwo && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-serif font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                    <Flame className="w-3 h-3 fill-amber-500 text-amber-600" />
                                    Top 2 Pick
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 text-xs text-stone-500 flex-wrap font-sans">
                                <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                  {book?.genreGroup}
                                </span>
                                <span>•</span>
                                <span>Format: <strong className="text-slate-700">{log.format || 'eBook'}</strong></span>
                                <span>•</span>
                                <span>Release Date: <strong className="text-slate-700">{log.releaseDate}</strong></span>
                                <span>•</span>
                                <span>Office: <strong className="text-slate-700">{log.submitterCountry}</strong></span>
                              </div>

                              {log.notes && (
                                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                                  "{log.notes}"
                                </p>
                              )}

                              {log.dnfReason && (
                                <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2 font-medium">
                                  🛑 DNF Reason: {log.dnfReason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions & Status Control */}
                          <div className="flex items-start md:items-end flex-col gap-2 shrink-0 self-end md:self-auto">
                            <div className="flex items-center gap-2">
                              {/* If rating is present */}
                              {log.rating && (
                                <div className="flex items-center gap-0.5 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span>{log.rating}/5</span>
                                </div>
                              )}

                              <button
                                onClick={() => handleStartEdit(log)}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-slate-500" />
                                Edit / Review
                              </button>
                            </div>

                            {/* Quick Status Transition Shortcuts */}
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-1">
                              {log.status === 'Requested' && (
                                <button
                                  onClick={() => handleQuickStatusMove(log, 'Reading')}
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <span>Start Reading</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {log.status === 'Reading' && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(log, 'Finished')}
                                    className="text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Finish &amp; Rate</span>
                                  </button>
                                  <span>•</span>
                                  <button
                                    onClick={() => handleStartEdit(log, 'DNF')}
                                    className="text-rose-600 hover:text-rose-800 hover:underline cursor-pointer font-semibold"
                                  >
                                    DNF
                                  </button>
                                </>
                              )}

                              {log.status === 'Finished' && (
                                <button
                                  onClick={() => handleQuickStatusMove(log, 'Reading')}
                                  className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                                >
                                  Reopen / Re-read
                                </button>
                              )}

                              {log.status === 'DNF' && (
                                <button
                                  onClick={() => handleQuickStatusMove(log, 'Reading')}
                                  className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-semibold"
                                >
                                  Resume Reading
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {isEditing && (
                          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl space-y-3 animate-in fade-in">
                            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                              <span>Update Reading Record ({book?.title})</span>
                              <span className="text-[11px] font-mono text-slate-400">{currentPersona.email}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Move to Status:</label>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value as ReadingStatus)}
                                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="Requested">⏳ Requested (Waiting for book)</option>
                                  <option value="Reading">📖 Currently Reading</option>
                                  <option value="Finished">✅ Finished (Ready for review)</option>
                                  <option value="DNF">🛑 Did Not Finish (DNF)</option>
                                </select>
                              </div>

                              {editStatus === 'Finished' ? (
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Star Rating:</label>
                                  <select
                                    value={editRating}
                                    onChange={(e) => setEditRating(Number(e.target.value))}
                                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-bold"
                                  >
                                    <option value="5">⭐⭐⭐⭐⭐ 5 - Masterpiece</option>
                                    <option value="4">⭐⭐⭐⭐ 4 - Great Read</option>
                                    <option value="3">⭐⭐⭐ 3 - Good / Solid</option>
                                    <option value="2">⭐⭐ 2 - Mediocre</option>
                                    <option value="1">⭐ 1 - Not Recommended</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 flex items-center pt-5">
                                  <span>Ratings unlock when marked Finished.</span>
                                </div>
                              )}

                              {editStatus === 'Finished' && (
                                <div className="flex items-center pt-5">
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                                    <input
                                      type="checkbox"
                                      checked={editIsTopTwo}
                                      onChange={(e) => setEditIsTopTwo(e.target.checked)}
                                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                                    />
                                    <span>Nominate for Top 2 of the Year</span>
                                  </label>
                                </div>
                              )}
                            </div>

                            {/* DNF Reason input if DNF selected */}
                            {editStatus === 'DNF' && (
                              <div>
                                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                                  DNF Reason (Helps Leads evaluate book structure):
                                </label>
                                <input
                                  type="text"
                                  value={editDnfReason}
                                  onChange={(e) => setEditDnfReason(e.target.value)}
                                  placeholder="e.g. Pacing slowed in chapter 5, tropes felt tired, narrator style..."
                                  className="w-full text-xs bg-white border border-rose-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Personal Notes / Review</label>
                              <input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Your personal takeaway, memorable elements, or why it stood out..."
                                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingLogId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(log.bookId)}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                              >
                                Save My Update
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Google Sheets Native Formula Callout */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Native Google Workspace Row-Level Security Formula
        </div>
        <p>
          In Google Sheets, you can restrict readers to viewing only their own records sectioned by status by adding status-specific filtered views:
        </p>
        <div className="bg-slate-900 text-emerald-300 font-mono p-3 rounded-xl overflow-x-auto text-[11px] space-y-1">
          <div>=FILTER(Reader_Logs!A2:L, (LOWER(Reader_Logs!B2:B) = LOWER(USER_EMAIL())) * (Reader_Logs!G2:G = "Reading"))</div>
          <div className="text-slate-400"># Filters row data strictly by User Email and Status = "Reading"</div>
        </div>
        <p className="text-[11px] text-slate-500">
          Or in Google Apps Script Web Apps: <code>logsSheet.getRange().getValues().filter(row =&gt; row[1] === Session.getActiveUser().getEmail() &amp;&amp; row[6] === status)</code>
        </p>
      </div>
    </div>
  );
};
