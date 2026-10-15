/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Book, 
  ReaderLog, 
  BookWithStats, 
  GTechBatchItem, 
  GenreGroup, 
  UserRole, 
  AppTabId, 
  TabAccessRule, 
  UserPersona,
  ReadingStatus,
  SheetSyncEvent
} from './types';
import { 
  INITIAL_BOOKS, 
  INITIAL_READER_LOGS, 
  INITIAL_NUDGE_TEMPLATES, 
  INITIAL_GTECH_BATCH 
} from './data/initialData';
import { ReaderForm } from './components/ReaderForm';
import { LeadDashboard } from './components/LeadDashboard';
import { CentralSheetView } from './components/CentralSheetView';
import { AutomatedNudges } from './components/AutomatedNudges';
import { GTechPipeline } from './components/GTechPipeline';
import { AppsScriptCodeViewer } from './components/AppsScriptCodeViewer';
import { AccessControlPanel } from './components/AccessControlPanel';
import { AccessDeniedGate } from './components/AccessDeniedGate';
import { MyReadingHub } from './components/MyReadingHub';
import { 
  BookOpen, 
  BarChart3, 
  FileSpreadsheet, 
  Mail, 
  Download, 
  Code, 
  Sparkles, 
  Users, 
  Flame, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Lock,
  ShieldCheck,
  ChevronDown,
  BookMarked
} from 'lucide-react';

const PERSONAS: UserPersona[] = [
  {
    email: 'mbeckley@google.com',
    name: 'Meg Beckley',
    role: 'COORDINATOR_ADMIN',
    country: 'United States',
    assignedGenreGroup: 'All Genres',
    badgeLabel: 'Coordinator Admin',
  },
  {
    email: 'aorringer@google.com',
    name: 'Leo Orringer',
    role: 'COORDINATOR_ADMIN',
    country: 'United States',
    assignedGenreGroup: 'All Genres',
    badgeLabel: 'Coordinator Admin',
  },
  {
    email: 'desmondkamas@google.com',
    name: 'Desmond Kamas',
    role: 'GENRE_LEAD',
    country: 'United States',
    assignedGenreGroup: 'Science Fiction & Fantasy',
    badgeLabel: 'Sci-Fi & Fantasy Lead',
  },
  {
    email: 'dsodagar@google.com',
    name: 'Dev Sodagar',
    role: 'GENRE_LEAD',
    country: 'United States',
    assignedGenreGroup: 'Romance & YA',
    badgeLabel: 'Romance & YA Lead',
  },
  {
    email: 'emmaropes@google.com',
    name: 'Emma Ropes',
    role: 'GENRE_LEAD',
    country: 'United States',
    assignedGenreGroup: 'Science Fiction & Fantasy',
    badgeLabel: 'Sci-Fi & Fantasy Lead',
  },
  {
    email: 'jegang@google.com',
    name: 'Joshua Gang',
    role: 'GENRE_LEAD',
    country: 'United States',
    assignedGenreGroup: 'Comics & Manga',
    badgeLabel: 'Comics & Manga Lead',
  },
  {
    email: 'david_c@google.com',
    name: 'David Chen',
    role: 'READER',
    country: 'Ireland',
    badgeLabel: 'Standard Reader / Reviewer',
  },
];

const INITIAL_TAB_RULES: TabAccessRule[] = [
  {
    tabId: 'form',
    tabLabel: 'Reader Form',
    iconName: 'Sparkles',
    minRole: 'READER',
    description: 'Public reader intake form. Allows all Google employees to request books and submit review ratings.',
    allowedRoles: ['READER', 'GENRE_LEAD', 'COORDINATOR_ADMIN'],
  },
  {
    tabId: 'my_reading',
    tabLabel: 'My Reading Hub',
    iconName: 'BookMarked',
    minRole: 'READER',
    description: 'Strictly email-restricted personal reading list, status updates, and Top 2 nominations.',
    allowedRoles: ['READER', 'GENRE_LEAD', 'COORDINATOR_ADMIN'],
  },
  {
    tabId: 'dashboard',
    tabLabel: 'Genre Lead Dashboard',
    iconName: 'BarChart3',
    minRole: 'GENRE_LEAD',
    description: 'Comprehensive lead analytics, Top 2 conviction ratios, Under-Read matrix, and October Window.',
    allowedRoles: ['GENRE_LEAD', 'COORDINATOR_ADMIN'],
  },
  {
    tabId: 'sheet',
    tabLabel: 'Central Google Sheet',
    iconName: 'FileSpreadsheet',
    minRole: 'GENRE_LEAD',
    description: 'Direct access to Master_Library, Reader_Logs, Validation_Engine, and Genre_Lead_Queries.',
    allowedRoles: ['GENRE_LEAD', 'COORDINATOR_ADMIN'],
  },
  {
    tabId: 'nudges',
    tabLabel: 'Email Bots & Nudges',
    iconName: 'Mail',
    minRole: 'GENRE_LEAD',
    description: 'Automated email bot configuration, 14-day stale hold follow-ups, and weekly digest dispatches.',
    allowedRoles: ['GENRE_LEAD', 'COORDINATOR_ADMIN'],
  },
  {
    tabId: 'gtech',
    tabLabel: 'gTech CSV Pipeline',
    iconName: 'Download',
    minRole: 'COORDINATOR_ADMIN',
    description: 'Bulk generation and submission of license fulfillment batches directly to gTech Buganizer queue.',
    allowedRoles: ['COORDINATOR_ADMIN'],
  },
  {
    tabId: 'appsscript',
    tabLabel: 'Apps Script Backend',
    iconName: 'Code',
    minRole: 'COORDINATOR_ADMIN',
    description: 'Backend script source code, automated snapshot triggers, and Google Sheet integration handlers.',
    allowedRoles: ['COORDINATOR_ADMIN'],
  },
  {
    tabId: 'permissions',
    tabLabel: 'Access & Permissions',
    iconName: 'ShieldCheck',
    minRole: 'COORDINATOR_ADMIN',
    description: 'Role-based access matrix, tab restriction management, and Google Workspace security mapping.',
    allowedRoles: ['COORDINATOR_ADMIN'],
  },
];

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('best_of_reading_books');
      return saved ? JSON.parse(saved) : INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  const [readerLogs, setReaderLogs] = useState<ReaderLog[]>(() => {
    try {
      const saved = localStorage.getItem('best_of_reading_logs');
      return saved ? JSON.parse(saved) : INITIAL_READER_LOGS;
    } catch {
      return INITIAL_READER_LOGS;
    }
  });

  const [nudgeTemplates, setNudgeTemplates] = useState(INITIAL_NUDGE_TEMPLATES);

  const [gtechBatch, setGtechBatch] = useState<GTechBatchItem[]>(() => {
    try {
      const saved = localStorage.getItem('best_of_reading_gtech');
      return saved ? JSON.parse(saved) : INITIAL_GTECH_BATCH;
    } catch {
      return INITIAL_GTECH_BATCH;
    }
  });

  // Save changes to browser localStorage so newly added books, requests, and ratings persist
  useEffect(() => {
    try {
      localStorage.setItem('best_of_reading_books', JSON.stringify(books));
    } catch (e) {
      console.warn('Failed to save books to localStorage', e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('best_of_reading_logs', JSON.stringify(readerLogs));
    } catch (e) {
      console.warn('Failed to save reader logs to localStorage', e);
    }
  }, [readerLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('best_of_reading_gtech', JSON.stringify(gtechBatch));
    } catch (e) {
      console.warn('Failed to save gtech batch to localStorage', e);
    }
  }, [gtechBatch]);
  
  // Access Control & Persona State
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(PERSONAS[0]);
  const [tabRules, setTabRules] = useState<TabAccessRule[]>(INITIAL_TAB_RULES);
  
  // Active Genre Group filter across the platform
  const [selectedGenreGroup, setSelectedGenreGroup] = useState<GenreGroup>('All Genres');
  
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<AppTabId>('dashboard');

  // Real-Time Google Sheet Sync Tracking
  const [lastUpdatedLogId, setLastUpdatedLogId] = useState<string | null>(null);
  const [lastSyncEvent, setLastSyncEvent] = useState<SheetSyncEvent | null>(null);
  const [syncHistory, setSyncHistory] = useState<SheetSyncEvent[]>([]);
  const [showSyncToast, setShowSyncToast] = useState<boolean>(false);

  // Compute enriched books with real-time stats
  const booksWithStats: BookWithStats[] = useMemo(() => {
    return books.map((b) => {
      const logs = readerLogs.filter((l) => l.bookId === b.id);
      const activeCount = logs.filter((l) => l.status === 'Reading' || l.status === 'Requested' || l.status === 'Finished').length;
      const finishedLogs = logs.filter((l) => l.status === 'Finished');
      const dnfLogs = logs.filter((l) => l.status === 'DNF');
      const topTwoCount = logs.filter((l) => l.isTopTwo).length;
      const ratings = finishedLogs.filter((l) => typeof l.rating === 'number').map((l) => l.rating as number);
      const avgRating = ratings.length > 0 ? Number((ratings.reduce((a, c) => a + c, 0) / ratings.length).toFixed(1)) : 0;
      const conviction = activeCount > 0 ? Number((topTwoCount / activeCount).toFixed(2)) : 0;
      const staleHolds = logs.filter((l) => l.isStaleHold).length;

      return {
        ...b,
        activeReaders: activeCount,
        totalFinished: finishedLogs.length,
        totalDnf: dnfLogs.length,
        topTwoVotes: topTwoCount,
        averageRating: avgRating,
        convictionScore: conviction,
        isCapped: activeCount >= 5,
        isUnderRead: activeCount < 3,
        staleHoldsCount: staleHolds,
        readerLogs: logs,
      };
    });
  }, [books, readerLogs]);

  // Handler: Add Book & Reader Request
  const handleAddBookAndLog = (newBook: Book, logData: any) => {
    setBooks((prev) => {
      const exists = prev.find((b) => b.id === newBook.id || b.docId === newBook.docId);
      if (exists) return prev;
      return [newBook, ...prev];
    });

    const newLogId = 'l_' + Date.now();
    const newLog: ReaderLog = {
      id: newLogId,
      bookId: newBook.id,
      submitterEmail: logData.submitterEmail || currentPersona.email,
      submitterLdap: logData.submitterLdap || currentPersona.email.split('@')[0],
      submitterName: logData.submitterName || currentPersona.name,
      submitterCountry: logData.submitterCountry || currentPersona.country,
      status: logData.status || 'Requested',
      releaseDate: logData.releaseDate || newBook.releaseDate,
      startDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: logData.notes,
      isTopTwo: false,
      format: logData.format || 'eBook',
    };

    setReaderLogs((prev) => [newLog, ...prev]);

    const newBatchItem: GTechBatchItem = {
      email: logData.submitterEmail || currentPersona.email,
      ldap: logData.submitterLdap || currentPersona.email.split('@')[0],
      country: logData.submitterCountry || currentPersona.country,
      docId: newBook.docId,
      bibkey: newBook.bibkey,
      title: newBook.title,
      genreGroup: newBook.genreGroup,
      format: logData.format || 'eBook',
      releaseDate: logData.releaseDate || newBook.releaseDate,
      requestDate: new Date().toISOString().split('T')[0],
      priority: newBook.isLateYearRelease ? 'P1 - High (Late Year)' : 'P2 - Standard',
      status: 'Pending Batch',
    };

    setGtechBatch((prev) => [newBatchItem, ...prev]);
  };

  // Handler: Update reading progress, rating or Top 2 from Reading Hub or Form
  const handleUpdateLog = (bookId: string, logData: any) => {
    const today = new Date().toISOString().split('T')[0];
    const targetEmail = (logData.submitterEmail || currentPersona.email).toLowerCase().trim();
    const matchedBook = books.find((b) => b.id === bookId);
    let affectedLogId = logData.logId || '';

    setReaderLogs((prev) => {
      const existingIdx = prev.findIndex((l) => 
        (logData.logId && l.id === logData.logId) ||
        (l.bookId === bookId && l.submitterEmail.toLowerCase().trim() === targetEmail)
      );

      if (existingIdx >= 0) {
        affectedLogId = prev[existingIdx].id;
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          status: logData.status,
          releaseDate: logData.releaseDate || updated[existingIdx].releaseDate,
          rating: logData.status === 'Finished' ? (logData.rating ?? updated[existingIdx].rating ?? 5) : undefined,
          isTopTwo: logData.status === 'Finished' ? (logData.isTopTwo ?? updated[existingIdx].isTopTwo ?? false) : false,
          notes: logData.notes !== undefined ? logData.notes : updated[existingIdx].notes,
          dnfReason: logData.status === 'DNF' ? (logData.dnfReason || updated[existingIdx].dnfReason) : undefined,
          lastUpdated: today,
          isStaleHold: false,
        };
        return updated;
      } else {
        const newLogId = 'l_' + Date.now();
        affectedLogId = newLogId;
        const newLog: ReaderLog = {
          id: newLogId,
          bookId,
          submitterEmail: logData.submitterEmail || currentPersona.email,
          submitterLdap: logData.submitterLdap || currentPersona.email.split('@')[0],
          submitterName: logData.submitterName || currentPersona.name,
          submitterCountry: logData.submitterCountry || currentPersona.country,
          status: logData.status,
          releaseDate: logData.releaseDate || today,
          startDate: today,
          lastUpdated: today,
          rating: logData.status === 'Finished' ? (logData.rating ?? 5) : undefined,
          isTopTwo: logData.status === 'Finished' ? !!logData.isTopTwo : false,
          notes: logData.notes,
          dnfReason: logData.status === 'DNF' ? logData.dnfReason : undefined,
          isStaleHold: false,
        };
        return [newLog, ...prev];
      }
    });

    // Also update GTech batch item status if status moved from Requested
    if (matchedBook) {
      setGtechBatch((prev) =>
        prev.map((item) => {
          if (item.docId === matchedBook.docId && item.email.toLowerCase().trim() === targetEmail) {
            return {
              ...item,
              status: logData.status === 'Requested' ? 'Pending Batch' : 'Fulfilled',
            };
          }
          return item;
        })
      );
    }

    const targetIdx = readerLogs.findIndex((l) => 
      (logData.logId && l.id === logData.logId) ||
      (l.bookId === bookId && l.submitterEmail.toLowerCase().trim() === targetEmail)
    );
    const prevStatus = targetIdx >= 0 ? readerLogs[targetIdx].status : 'Requested';
    const rowNumber = (targetIdx >= 0 ? targetIdx : readerLogs.length) + 2;
    const cellRef = `G${rowNumber}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const syncEvent: SheetSyncEvent = {
      timestamp: timeString,
      bookTitle: matchedBook?.title || 'Book Title',
      updatedStatus: logData.status,
      previousStatus: prevStatus,
      email: logData.submitterEmail || currentPersona.email,
      logId: affectedLogId || logData.logId,
      sheetTab: 'Reader_Logs',
      cellRef,
      rowNumber,
    };

    setLastUpdatedLogId(syncEvent.logId || null);
    setLastSyncEvent(syncEvent);
    setSyncHistory((prev) => [syncEvent, ...prev.slice(0, 19)]);
    setShowSyncToast(true);

    // Call server endpoint to record Google Sheets API v4 update
    fetch('/api/sync-sheet-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncEvent),
    }).catch((err) => console.warn('Sync sheet status background call:', err));
  };

  const handleMarkBatchSubmitted = () => {
    setGtechBatch((prev) =>
      prev.map((item) =>
        item.status === 'Pending Batch' ? { ...item, status: 'Submitted to Buganizer' } : item
      )
    );
  };

  // Permission Check Helper
  const checkTabAccess = (tabId: AppTabId): boolean => {
    const rule = tabRules.find((r) => r.tabId === tabId);
    if (!rule) return true;
    return rule.allowedRoles.includes(currentPersona.role);
  };

  // Auto-redirect to first accessible tab if activeTab is not allowed for current persona
  useEffect(() => {
    if (!checkTabAccess(activeTab)) {
      const preferredTabOrder: AppTabId[] = [
        'dashboard',
        'my_reading',
        'form',
        'sheet',
        'nudges',
        'gtech',
        'appsscript',
        'permissions',
      ];
      const nextAllowed = preferredTabOrder.find((t) => checkTabAccess(t)) || 'my_reading';
      setActiveTab(nextAllowed);
    }
  }, [currentPersona, tabRules, activeTab]);

  const handleToggleTabRole = (tabId: AppTabId, role: UserRole) => {
    setTabRules((prev) =>
      prev.map((rule) => {
        if (rule.tabId !== tabId) return rule;
        const exists = rule.allowedRoles.includes(role);
        const newRoles = exists
          ? rule.allowedRoles.filter((r) => r !== role)
          : [...rule.allowedRoles, role];
        return { ...rule, allowedRoles: newRoles };
      })
    );
  };

  const handleDeleteLog = (logId: string) => {
    const log = readerLogs.find((l) => l.id === logId);
    if (!log) return;
    const book = books.find((b) => b.id === log.bookId);

    // Remove the log entry
    setReaderLogs((prev) => prev.filter((l) => l.id !== logId));

    // Record in sync history
    const event: SheetSyncEvent = {
      logId,
      bookTitle: book?.title || 'Unknown Title',
      updatedStatus: 'Deleted',
      email: log.submitterEmail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sheetTab: 'Reader_Logs',
      cellRef: 'Row Removed',
    };
    setSyncHistory((prev) => [event, ...prev.slice(0, 19)]);
  };

  const currentTabRule = tabRules.find((r) => r.tabId === activeTab);
  const isCurrentTabAllowed = checkTabAccess(activeTab);

  const underReadCount = booksWithStats.filter((b) => b.isUnderRead).length;
  const pendingBatchCount = gtechBatch.filter((b) => b.status === 'Pending Batch').length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* Top Navigation Bar - Literary Bookish Library Theme */}
      <header className="bg-[#FCFAF6] border-b border-[#E8E1D5] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand with Bookplate Motif */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-900 via-stone-800 to-amber-950 flex items-center justify-center text-amber-200 shadow-sm shadow-amber-950/20 border border-amber-600/30">
                <BookOpen className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-bold text-stone-900 text-lg tracking-tight">Best Of Reading Group</h1>
                  <span className="text-[10px] uppercase font-serif font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/70">
                    Annual Selection
                  </span>
                </div>
                <p className="text-xs text-stone-500 hidden sm:block font-serif italic">
                  Peer Quotas • Play Books Engine • Central Spreadsheet
                </p>
              </div>
            </div>

            {/* Persona & Access Level Switcher in Nav Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <select
                  value={currentPersona.email}
                  onChange={(e) => {
                    const found = PERSONAS.find((p) => p.email === e.target.value);
                    if (found) {
                      setCurrentPersona(found);
                      if (found.assignedGenreGroup && found.assignedGenreGroup !== 'All Genres') {
                        setSelectedGenreGroup(found.assignedGenreGroup);
                      }
                    }
                  }}
                  className="bg-[#F7F3EC] hover:bg-[#EFE9DF] text-stone-800 font-medium text-xs py-2 pl-3 pr-8 rounded-xl border border-[#DDD5C7] focus:outline-none focus:ring-2 focus:ring-amber-700 cursor-pointer shadow-2xs appearance-none font-sans"
                >
                  {PERSONAS.map((p) => (
                    <option key={p.email} value={p.email}>
                      👤 {p.name} [{p.role === 'COORDINATOR_ADMIN' ? 'Admin' : p.role === 'GENRE_LEAD' ? 'Lead' : 'Reader'}] ({p.country})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Access Levels Header Button - Visible only to Coordinator Admins */}
              {checkTabAccess('permissions') && (
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeTab === 'permissions'
                      ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-sm'
                      : 'bg-white hover:bg-[#F7F3EC] text-stone-700 border-[#DDD5C7]'
                  }`}
                  title="View and configure Access Levels"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden md:inline">Access Levels</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs - Dynamically Hidden Based on Access Control */}
          <div className="flex space-x-1.5 overflow-x-auto border-t border-[#EAE2D5] py-2">
            {/* 1. Dashboard Tab - Visible only to Genre Leads and Admins */}
            {checkTabAccess('dashboard') && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#F5EFE6] text-amber-950 font-bold border border-[#D5C7B3] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Genre Lead Dashboard</span>
                {underReadCount > 0 && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {underReadCount}
                  </span>
                )}
              </button>
            )}

            {/* 2. Reader Form Tab - Available to Readers, Leads, Admins */}
            {checkTabAccess('form') && (
              <button
                onClick={() => setActiveTab('form')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-[#F5EFE6] text-amber-950 font-bold border border-[#D5C7B3] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Reader Form (Intake)</span>
              </button>
            )}

            {/* 3. My Reading Hub - Available to Readers, Leads, Admins */}
            {checkTabAccess('my_reading') && (() => {
              const myCount = readerLogs.filter((l) => l.submitterEmail.toLowerCase() === currentPersona.email.toLowerCase()).length;
              return (
                <button
                  onClick={() => setActiveTab('my_reading')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'my_reading'
                      ? 'bg-[#F5EFE6] text-amber-950 font-bold border border-[#D5C7B3] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-indigo-600" />
                  <span>My Reading Hub</span>
                  {myCount > 0 && (
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {myCount}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* 4. Central Google Sheet Tab - Visible only to Genre Leads and Admins */}
            {checkTabAccess('sheet') && (
              <button
                onClick={() => setActiveTab('sheet')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'sheet'
                    ? 'bg-[#EAF5EE] text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Central Google Sheet</span>
              </button>
            )}

            {/* 5. Automated Nudges Tab - Visible only to Genre Leads and Admins */}
            {checkTabAccess('nudges') && (
              <button
                onClick={() => setActiveTab('nudges')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'nudges'
                    ? 'bg-[#FDF3E7] text-amber-900 font-bold border border-amber-300 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                }`}
              >
                <Mail className="w-4 h-4 text-amber-600" />
                <span>Email Bots &amp; Nudges</span>
              </button>
            )}

            {/* 6. gTech Pipeline Tab - Strictly Coordinator Admins */}
            {checkTabAccess('gtech') && (
              <button
                onClick={() => setActiveTab('gtech')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'gtech'
                    ? 'bg-[#F5EFE6] text-amber-950 font-bold border border-[#D5C7B3] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                }`}
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>gTech CSV Batch</span>
                {pendingBatchCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {pendingBatchCount}
                  </span>
                )}
              </button>
            )}

            {/* 7. Apps Script Code.gs Tab - Strictly Coordinator Admins */}
            {checkTabAccess('appsscript') && (
              <button
                onClick={() => setActiveTab('appsscript')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'appsscript'
                    ? 'bg-stone-800 text-white font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                }`}
              >
                <Code className="w-4 h-4 text-emerald-400" />
                <span>Apps Script Backend</span>
              </button>
            )}

            {/* 8. Permissions & Access Control Tab - Visible only to Coordinator Admins */}
            {checkTabAccess('permissions') && (
              <button
                onClick={() => setActiveTab('permissions')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'permissions'
                    ? 'bg-amber-900 text-amber-50 font-bold border border-amber-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Access &amp; Permissions</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area with Gate Enforcement */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isCurrentTabAllowed && currentTabRule ? (
          <AccessDeniedGate
            tabName={currentTabRule.tabLabel}
            tabId={activeTab}
            currentPersona={currentPersona}
            requiredRoles={currentTabRule.allowedRoles}
            onSwitchToAdmin={() => setCurrentPersona(PERSONAS[0])}
            onOpenPermissions={() => setActiveTab('permissions')}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <LeadDashboard
                books={booksWithStats}
                allLogs={readerLogs}
                onSelectTab={(tabId) => setActiveTab(tabId as any)}
                selectedGenreGroup={selectedGenreGroup}
                onSelectGenreGroup={setSelectedGenreGroup}
              />
            )}

            {activeTab === 'form' && (
              <ReaderForm
                books={booksWithStats}
                onAddBookAndLog={handleAddBookAndLog}
                onUpdateLog={handleUpdateLog}
                currentUserEmail={currentPersona.email}
                onChangeUserEmail={(email) => {
                  const found = PERSONAS.find((p) => p.email === email);
                  if (found) setCurrentPersona(found);
                }}
                currentUserCountry={currentPersona.country}
                onChangeUserCountry={(country) => {
                  setCurrentPersona((prev) => ({ ...prev, country }));
                }}
                activeGenreGroupFilter={selectedGenreGroup}
                onSelectGenreGroupFilter={setSelectedGenreGroup}
              />
            )}

            {activeTab === 'my_reading' && (
              <MyReadingHub
                currentPersona={currentPersona}
                books={booksWithStats}
                allLogs={readerLogs}
                onUpdateLog={handleUpdateLog}
                onNavigateToForm={() => setActiveTab('form')}
                onNavigateToSheet={checkTabAccess('sheet') ? () => setActiveTab('sheet') : undefined}
                lastSyncEvent={lastSyncEvent}
                syncHistory={syncHistory}
              />
            )}

            {activeTab === 'sheet' && (
              <CentralSheetView
                books={booksWithStats}
                allLogs={readerLogs}
                selectedGenreGroup={selectedGenreGroup}
                onSelectGenreGroup={setSelectedGenreGroup}
                currentUserEmail={currentPersona.email}
                isReaderOnly={currentPersona.role === 'READER'}
                isAdmin={currentPersona.role === 'COORDINATOR_ADMIN'}
                onDeleteLog={handleDeleteLog}
                lastUpdatedLogId={lastUpdatedLogId}
                lastSyncEvent={lastSyncEvent}
                syncHistory={syncHistory}
              />
            )}

            {activeTab === 'nudges' && (
              <AutomatedNudges
                templates={nudgeTemplates}
                books={booksWithStats}
                allLogs={readerLogs}
              />
            )}

            {activeTab === 'gtech' && (
              <GTechPipeline
                batchItems={gtechBatch}
                onMarkBatchSubmitted={handleMarkBatchSubmitted}
                selectedGenreGroup={selectedGenreGroup}
                onSelectGenreGroup={setSelectedGenreGroup}
              />
            )}

            {activeTab === 'appsscript' && (
              <AppsScriptCodeViewer />
            )}

            {activeTab === 'permissions' && (
              <AccessControlPanel
                currentPersona={currentPersona}
                personas={PERSONAS}
                onSelectPersona={setCurrentPersona}
                tabRules={tabRules}
                onToggleTabRole={handleToggleTabRole}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Real-time Google Sheet Live Sync Toast Notification */}
      {showSyncToast && lastSyncEvent && (
        <aside 
          aria-label="Google Sheets Sync Notification"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-emerald-500/40 p-4 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shrink-0 mt-0.5 shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Central Google Sheet Updated Live
                </span>
                <button
                  onClick={() => setShowSyncToast(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer px-1 transition-colors"
                  aria-label="Dismiss toast"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Cell <strong className="font-mono text-emerald-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">{lastSyncEvent.cellRef}</strong> in tab{' '}
                <strong className="text-white">Reader_Logs</strong> updated to{' '}
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.5 rounded font-bold font-mono">
                  {lastSyncEvent.updatedStatus}
                </span>{' '}
                for <em>"{lastSyncEvent.bookTitle}"</em>.
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] border-t border-white/10">
                <button
                  onClick={() => {
                    setActiveTab('sheet');
                    setShowSyncToast(false);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Inspect in Central Sheet →</span>
                </button>
                <span className="text-slate-400 font-mono">{lastSyncEvent.timestamp}</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700">Best Of Reading Group Platform</span>
            <span>•</span>
            <span>Access Tier: <strong className="text-slate-900">{currentPersona.badgeLabel}</strong></span>
            <span>•</span>
            <span>Office: {currentPersona.country}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('permissions')}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Manage Access Levels
            </button>
            <button
              onClick={() => setActiveTab('appsscript')}
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              Google Workspace Code.gs
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
