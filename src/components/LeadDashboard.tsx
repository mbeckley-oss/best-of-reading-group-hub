import React, { useState, useMemo } from 'react';
import { BookWithStats, ReaderLog, GenreGroup } from '../types';
import { 
  BarChart3, 
  Flame, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  BookMarked, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Layers,
  Award,
  Globe2,
  Mail,
  Heart,
  Rocket,
  Palette,
  CheckCircle2,
  BookOpen,
  Bookmark,
  Library
} from 'lucide-react';
import libraryBannerUrl from '../assets/images/reading_library_banner_1790743784135.jpg';
import bookStillLifeUrl from '../assets/images/open_book_still_life_1790743798565.jpg';

interface LeadDashboardProps {
  books: BookWithStats[];
  allLogs: ReaderLog[];
  onSelectTab: (tabId: string) => void;
  selectedGenreGroup: GenreGroup;
  onSelectGenreGroup: (group: GenreGroup) => void;
}

const GENRE_GROUP_LEADS: Record<string, { leadEmail: string; leadName: string; focusNote: string }> = {
  'All Genres': {
    leadEmail: 'mbeckley@google.com, aorringer@google.com',
    leadName: 'Meg Beckley & Leo Orringer (Overall Coordinators)',
    focusNote: 'Cross-genre coordination, quota management & Best Of shortlisting.',
  },
  'Romance & YA': {
    leadEmail: 'dsodagar@google.com',
    leadName: 'Dev Sodagar (Genre Lead)',
    focusNote: 'Romantasy, contemporary romance, and YA speculative fiction.',
  },
  'Science Fiction & Fantasy': {
    leadEmail: 'desmondkamas@google.com, emmaropes@google.com',
    leadName: 'Desmond Kamas & Emma Ropes (Genre Leads)',
    focusNote: 'Space opera, high fantasy, bio-punk, and philosophical sci-fi.',
  },
  'Comics & Manga': {
    leadEmail: 'jegang@google.com',
    leadName: 'Joshua Gang (Genre Lead)',
    focusNote: 'Graphic memoirs, manga series finales, and illustrated works.',
  },
  'Fiction & Literature': {
    leadEmail: 'mbeckley@google.com, aorringer@google.com',
    leadName: 'Meg Beckley & Leo Orringer (Genre Leads)',
    focusNote: 'Contemporary literary fiction, historical revisions, and translations.',
  },
  'Non-Fiction & Memoir': {
    leadEmail: 'desmondkamas@google.com, emmaropes@google.com',
    leadName: 'Desmond Kamas & Emma Ropes (Genre Leads)',
    focusNote: 'Social psychology, ecology, history, and narrative investigative journalism.',
  },
};

export const LeadDashboard: React.FC<LeadDashboardProps> = ({
  books,
  allLogs,
  onSelectTab,
  selectedGenreGroup,
  onSelectGenreGroup,
}) => {
  const [activeSubView, setActiveSubView] = useState<'overview' | 'under_read' | 'high_conviction' | 'october_window' | 'dnf_analysis' | 'readers'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');

  // Filter books by active Genre Group and Search
  const genreFilteredBooks = useMemo(() => {
    return books.filter(b => {
      if (selectedGenreGroup !== 'All Genres' && b.genreGroup !== selectedGenreGroup) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.subGenre.toLowerCase().includes(q) ||
          b.docId.toLowerCase().includes(q) ||
          (b.submittedByEmail && b.submittedByEmail.toLowerCase().includes(q)) ||
          (b.submittedByCountry && b.submittedByCountry.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [books, selectedGenreGroup, searchQuery]);

  // Filter reader logs by active Genre Group and Country
  const genreFilteredLogs = useMemo(() => {
    return allLogs.filter(l => {
      const book = books.find(b => b.id === l.bookId);
      if (!book) return false;
      if (selectedGenreGroup !== 'All Genres' && book.genreGroup !== selectedGenreGroup) {
        return false;
      }
      if (countryFilter !== 'ALL' && l.submitterCountry !== countryFilter) {
        return false;
      }
      return true;
    });
  }, [allLogs, books, selectedGenreGroup, countryFilter]);

  // Distinct countries present in data
  const distinctCountries = useMemo(() => {
    const set = new Set<string>();
    allLogs.forEach(l => {
      if (l.submitterCountry) set.add(l.submitterCountry);
    });
    return ['ALL', ...Array.from(set)];
  }, [allLogs]);

  // Metrics for current genre filter
  const totalTitlesInGroup = genreFilteredBooks.length;
  const cappedInGroup = genreFilteredBooks.filter(b => b.isCapped).length;
  const underReadInGroup = genreFilteredBooks.filter(b => b.isUnderRead);
  const lateYearInGroup = genreFilteredBooks.filter(b => b.isLateYearRelease);
  const totalFinishedInGroup = genreFilteredLogs.filter(l => l.status === 'Finished').length;
  const totalDnfInGroup = genreFilteredLogs.filter(l => l.status === 'DNF').length;
  const staleHoldsInGroup = genreFilteredLogs.filter(l => l.isStaleHold).length;

  // High conviction leaderboard: sorted by (Top 2 Votes / Total Readers) descending
  const highConvictionLeaderboard = useMemo(() => {
    return [...genreFilteredBooks]
      .filter(b => b.activeReaders > 0)
      .sort((a, b) => {
        if (b.convictionScore !== a.convictionScore) {
          return b.convictionScore - a.convictionScore;
        }
        return b.topTwoVotes - a.topTwoVotes;
      });
  }, [genreFilteredBooks]);

  // DNF Analysis within genre group
  const dnfStatsBySubgenre = useMemo(() => {
    const map: Record<string, { total: number; dnf: number; finished: number; reasons: string[] }> = {};
    genreFilteredLogs.forEach(l => {
      const book = books.find(b => b.id === l.bookId);
      if (!book) return;
      const key = book.subGenre;
      if (!map[key]) {
        map[key] = { total: 0, dnf: 0, finished: 0, reasons: [] };
      }
      map[key].total += 1;
      if (l.status === 'DNF') {
        map[key].dnf += 1;
        if (l.dnfReason) map[key].reasons.push(l.dnfReason);
      } else if (l.status === 'Finished') {
        map[key].finished += 1;
      }
    });

    return Object.entries(map).map(([subgenre, data]) => ({
      subgenre,
      totalLogs: data.total,
      dnfCount: data.dnf,
      finishedCount: data.finished,
      dnfRate: data.total > 0 ? Math.round((data.dnf / data.total) * 100) : 0,
      reasons: data.reasons,
    })).sort((a, b) => b.dnfRate - a.dnfRate);
  }, [genreFilteredLogs, books]);

  // Reader participation leaderboard
  const readerLeaderboard = useMemo(() => {
    const map: Record<string, { email: string; ldap: string; name: string; country: string; finished: number; reading: number; dnf: number; top2: number }> = {};
    genreFilteredLogs.forEach(l => {
      if (!map[l.submitterEmail]) {
        map[l.submitterEmail] = {
          email: l.submitterEmail,
          ldap: l.submitterLdap,
          name: l.submitterName,
          country: l.submitterCountry,
          finished: 0,
          reading: 0,
          dnf: 0,
          top2: 0,
        };
      }
      if (l.status === 'Finished') map[l.submitterEmail].finished += 1;
      if (l.status === 'Reading') map[l.submitterEmail].reading += 1;
      if (l.status === 'DNF') map[l.submitterEmail].dnf += 1;
      if (l.isTopTwo) map[l.submitterEmail].top2 += 1;
    });

    return Object.values(map).sort((a, b) => b.finished - a.finished || b.top2 - a.top2);
  }, [genreFilteredLogs]);

  const activeGenreLead = GENRE_GROUP_LEADS[selectedGenreGroup] || GENRE_GROUP_LEADS['All Genres'];

  return (
    <div className="space-y-6">
      {/* Literary Library Reading Room Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E2D8C9] shadow-md bg-stone-950 text-white">
        <div className="absolute inset-0">
          <img 
            src={libraryBannerUrl} 
            alt="Cozy library reading room" 
            className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/40" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs backdrop-blur-xs font-serif tracking-wide">
            <Bookmark className="w-3.5 h-3.5 text-amber-300" />
            <span>Best Of Reading Group • Literary Jury &amp; Selection</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-amber-50 tracking-tight leading-tight">
            Curating the Year's Most Compelling Reads
          </h2>

          <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
            Coordinating peer reader groups across 5 genre categories, enforcing 5-reader quorum caps, and prioritizing late-year releases for the Google Play Books annual list.
          </p>

          {/* Bookish Quick Stats Strip */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-stone-300">Total Volumes:</span>
              <strong className="text-white font-serif text-sm">{books.length} Titles</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-stone-300">Active Reader Quorum:</span>
              <strong className="text-white font-serif text-sm">{allLogs.length} Reviews</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-stone-300">October Window:</span>
              <strong className="text-white font-serif text-sm">{books.filter(b => b.isLateYearRelease).length} Late Releases</strong>
            </div>
          </div>
        </div>
      </div>

      {/* GENRE GROUP FILTER BAR (PROMINENT HEADER TABS) */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E7DFD3] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Filter by Genre Group &amp; Lead
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {selectedGenreGroup === 'All Genres' ? 'All Genre Groups Overview' : `${selectedGenreGroup} Command Center`}
            </h2>
          </div>

          {/* Genre Group Lead Badge */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Genre Lead:</span>
            <span className="font-semibold text-slate-900">{activeGenreLead.leadName}</span>
            <span className="font-mono text-blue-700 bg-white px-1.5 py-0.2 rounded border border-slate-200 text-[11px]">
              {activeGenreLead.leadEmail}
            </span>
          </div>
        </div>

        {/* The 3 Core Requested Genre Groups + Others */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => onSelectGenreGroup('All Genres')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedGenreGroup === 'All Genres'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Genres ({books.length})
          </button>

          {/* ROMANCE & YA */}
          <button
            onClick={() => onSelectGenreGroup('Romance & YA')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedGenreGroup === 'Romance & YA'
                ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-600/20'
                : 'bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            Romance &amp; YA
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedGenreGroup === 'Romance & YA' ? 'bg-white/20 text-white' : 'bg-pink-200 text-pink-900'
            }`}>
              {books.filter(b => b.genreGroup === 'Romance & YA').length}
            </span>
          </button>

          {/* SCIENCE FICTION & FANTASY */}
          <button
            onClick={() => onSelectGenreGroup('Science Fiction & Fantasy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedGenreGroup === 'Science Fiction & Fantasy'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 fill-current" />
            Science Fiction &amp; Fantasy
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedGenreGroup === 'Science Fiction & Fantasy' ? 'bg-white/20 text-white' : 'bg-indigo-200 text-indigo-900'
            }`}>
              {books.filter(b => b.genreGroup === 'Science Fiction & Fantasy').length}
            </span>
          </button>

          {/* COMICS & MANGA */}
          <button
            onClick={() => onSelectGenreGroup('Comics & Manga')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedGenreGroup === 'Comics & Manga'
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/20'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 fill-current" />
            Comics &amp; Manga
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedGenreGroup === 'Comics & Manga' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {books.filter(b => b.genreGroup === 'Comics & Manga').length}
            </span>
          </button>

          {/* FICTION & LITERATURE */}
          <button
            onClick={() => onSelectGenreGroup('Fiction & Literature')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedGenreGroup === 'Fiction & Literature'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Fiction &amp; Literature
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedGenreGroup === 'Fiction & Literature' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-900'
            }`}>
              {books.filter(b => b.genreGroup === 'Fiction & Literature').length}
            </span>
          </button>

          {/* NON-FICTION & MEMOIR */}
          <button
            onClick={() => onSelectGenreGroup('Non-Fiction & Memoir')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedGenreGroup === 'Non-Fiction & Memoir'
                ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-700/20'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Non-Fiction &amp; Memoir
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedGenreGroup === 'Non-Fiction & Memoir' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {books.filter(b => b.genreGroup === 'Non-Fiction & Memoir').length}
            </span>
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards Filtered by Active Genre Group */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <BookMarked className="w-3.5 h-3.5 text-blue-600" />
            Group Titles
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalTitlesInGroup}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In Master_Library</div>
        </div>

        <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-200/70">
          <div className="text-xs font-medium text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Under-Read
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{underReadInGroup.length}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">&lt; 3 readers (Needs quorum)</div>
        </div>

        <div className="bg-rose-50/60 rounded-xl p-3.5 border border-rose-200/60">
          <div className="text-xs font-medium text-rose-800 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            October Window
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-1">{lateYearInGroup.length}</div>
          <div className="text-[11px] text-rose-700 mt-0.5">Late-year releases</div>
        </div>

        <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-200/60">
          <div className="text-xs font-medium text-indigo-800 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Capped (5/5)
          </div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{cappedInGroup}</div>
          <div className="text-[11px] text-indigo-700 mt-0.5">Waitlist active</div>
        </div>

        <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200/60">
          <div className="text-xs font-medium text-emerald-800 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Finished Reviews
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{totalFinishedInGroup}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">{genreFilteredLogs.length} total logs</div>
        </div>

        <div className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-200/60">
          <div className="text-xs font-medium text-purple-800 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
            Group DNF
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-1">{totalDnfInGroup}</div>
          <div className="text-[11px] text-purple-700 mt-0.5">
            {totalFinishedInGroup + totalDnfInGroup > 0 
              ? `${Math.round((totalDnfInGroup / (totalFinishedInGroup + totalDnfInGroup)) * 100)}% DNF rate`
              : '0% DNF rate'}
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubView('overview')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {selectedGenreGroup} Titles &amp; Readers
        </button>

        <button
          onClick={() => setActiveSubView('under_read')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'under_read'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Under-Read Titles (&lt;3 Readers)
          <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px]">
            {underReadInGroup.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubView('high_conviction')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'high_conviction'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-yellow-300" />
          Top 2 Conviction Ratio
        </button>

        <button
          onClick={() => setActiveSubView('october_window')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'october_window'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          The October Window
        </button>

        <button
          onClick={() => setActiveSubView('dnf_analysis')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'dnf_analysis'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          DNF Analysis
        </button>

        <button
          onClick={() => setActiveSubView('readers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'readers'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Submitters &amp; Global Countries
        </button>
      </div>

      {/* VIEW 1: Master Library Overview filtered by Genre Group */}
      {activeSubView === 'overview' && (
        <div className="space-y-4">
          {/* Search & Country Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, email, country, DocID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Country:</span>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {distinctCountries.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Countries' : c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Book Cards Grid with Hardcover Book Covers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {genreFilteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-[#FFFDF9] rounded-2xl border border-[#E7DFD3] p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start gap-4">
                    {/* Hardcover Book Cover with 3D Spine and Drop Shadow */}
                    <div className="w-20 sm:w-24 shrink-0 rounded-md overflow-hidden book-cover-3d relative bg-stone-900 self-start">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-full h-28 sm:h-32 object-cover rounded-md"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={`w-full h-28 sm:h-32 bg-gradient-to-br ${book.coverColor || 'from-amber-800 to-stone-900'} p-2.5 flex flex-col justify-between text-amber-50`}>
                          <span className="text-[10px] font-serif font-bold uppercase tracking-wider line-clamp-2">{book.title}</span>
                          <BookOpen className="w-4 h-4 text-amber-300/80 self-end" />
                        </div>
                      )}
                      {/* Realistic book spine gutter light */}
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
                      
                      {/* Top 2 Ribbon Badge on Cover */}
                      {book.topTwoVotes > 0 && (
                        <div 
                          className="absolute -top-1 right-2 bg-amber-500 text-stone-950 font-bold px-1.5 py-0.5 text-[9px] ribbon-tag shadow-xs flex items-center gap-0.5"
                          title={`${book.topTwoVotes} Top 2 Votes`}
                        >
                          <Flame className="w-2.5 h-2.5 fill-stone-950" />
                          <span>TOP 2</span>
                        </div>
                      )}
                    </div>

                    {/* Book Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-sans ${
                          book.genreGroup === 'Romance & YA'
                            ? 'bg-pink-100 text-pink-900'
                            : book.genreGroup === 'Science Fiction & Fantasy'
                            ? 'bg-indigo-100 text-indigo-900'
                            : book.genreGroup === 'Comics & Manga'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-900'
                        }`}>
                          {book.genreGroup}
                        </span>

                        {book.isLateYearRelease && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> Late-Year
                          </span>
                        )}

                        {book.averageRating > 0 && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            {book.averageRating} ★
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg mt-1.5 leading-snug group-hover:text-amber-900 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-stone-600 font-serif italic">
                        by {book.author} <span className="font-sans not-italic text-stone-400">· {book.subGenre}</span>
                      </p>
                      
                      {/* CAPTURED DATABASE FIELDS: Release Date & Submitter */}
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1.5 flex-wrap font-sans">
                        <span>Release: <strong className="font-mono text-stone-700">{book.releaseDate}</strong></span>
                        {book.pageCount && <span>• <strong>{book.pageCount} pp</strong></span>}
                        {book.submittedByEmail && (
                          <span>• Submitter: <strong className="font-mono text-amber-800">{book.submittedByEmail.split('@')[0]}</strong> ({book.submittedByCountry})</span>
                        )}
                      </div>

                      {/* Quorum Capacity Status */}
                      <div className="mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          book.isCapped
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : book.isUnderRead
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {book.activeReaders}/5 Readers {book.isCapped ? '(Cap Met)' : book.isUnderRead ? '(Needs Readers)' : '(Active)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {book.summary && (
                    <p className="text-xs text-stone-600 mt-3 line-clamp-2 leading-relaxed font-sans bg-[#FBF9F5] p-2.5 rounded-xl border border-[#EFE8DC]">
                      {book.summary}
                    </p>
                  )}
                </div>

                {/* Reader slots breakdown with email & country */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-medium">Active Readers ({book.readerLogs.length}):</span>
                    <span className="font-mono text-[11px] text-slate-400">DocID: {book.docId}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {book.readerLogs.map((log) => (
                      <span
                        key={log.id}
                        title={`Submitted by: ${log.submitterEmail} (${log.submitterCountry}) - Status: ${log.status}`}
                        className={`text-[11px] px-2 py-1 rounded font-mono flex items-center gap-1 border ${
                          log.status === 'Finished'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : log.status === 'DNF'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : log.isStaleHold
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        {log.submitterLdap}
                        <span className="text-[9px] text-slate-400">({log.submitterCountry.substring(0, 2).toUpperCase()})</span>
                        {log.status === 'Finished' && <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />}
                        {log.isTopTwo && <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                      </span>
                    ))}

                    {/* Open slots */}
                    {Array.from({ length: Math.max(0, 5 - book.activeReaders) }).map((_, idx) => (
                      <span
                        key={`empty-${idx}`}
                        className="text-[11px] px-2 py-1 rounded font-mono border border-dashed border-slate-200 text-slate-400 bg-slate-50/50"
                      >
                        + Open Slot
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>Rating: <strong>{book.averageRating > 0 ? `${book.averageRating} ★` : '—'}</strong></span>
                      <span>Conviction: <strong>{Math.round(book.convictionScore * 100)}%</strong></span>
                    </div>
                    <a
                      href={book.playBooksUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                    >
                      Play Books <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: Under-Read Matrix (<3 Readers) */}
      {activeSubView === 'under_read' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Under-Read {selectedGenreGroup !== 'All Genres' ? selectedGenreGroup : ''} Titles (&lt;3 Readers)
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Per working group rules, titles require at least 3 readers for consensus. Genre leads can assign cross-readers or push in the weekly chat digest.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {underReadInGroup.map((book) => {
              const needed = 3 - book.activeReaders;
              return (
                <div key={book.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-base">{book.title}</span>
                      <span className="text-xs text-slate-500">by {book.author}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {book.genreGroup}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Release: {book.releaseDate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 max-w-xl">{book.summary}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                      <span>Current Readers: <strong>{book.activeReaders} / 5</strong></span>
                      <span>Initial Submitter: <strong className="font-mono text-blue-700">{book.submittedByEmail}</strong> ({book.submittedByCountry})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                      Needs {needed} More Reader{needed > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => onSelectTab('nudges')}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Draft Genre Nudge
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: High Conviction Leaderboard (Top 2 Ratio) */}
      {activeSubView === 'high_conviction' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-100 text-indigo-800">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                High-Conviction Leaderboard: {selectedGenreGroup}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Automated formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">Top 2 Votes / Total Readers</code>. 
              Elevates passionate favorites for the {selectedGenreGroup} shortlist.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Title &amp; Author</th>
                  <th className="py-2.5 px-3">Genre Group</th>
                  <th className="py-2.5 px-3">Release Date</th>
                  <th className="py-2.5 px-3 text-center">Top 2 Votes</th>
                  <th className="py-2.5 px-3 text-center">Readers</th>
                  <th className="py-2.5 px-3 text-center">Conviction Ratio</th>
                  <th className="py-2.5 px-3 text-center">Avg Rating</th>
                  <th className="py-2.5 px-3 text-right">Shortlist Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {highConvictionLeaderboard.map((book, idx) => (
                  <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {idx === 0 && '🥇'}
                      {idx === 1 && '🥈'}
                      {idx === 2 && '🥉'}
                      {idx > 2 && `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 text-sm">{book.title}</div>
                      <div className="text-slate-500">{book.author}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {book.genreGroup}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {book.releaseDate}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-700">
                      <div className="inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {book.topTwoVotes}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700 font-medium">
                      {book.activeReaders}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-block bg-indigo-50 text-indigo-900 font-mono font-bold px-2 py-0.5 rounded border border-indigo-200">
                        {Math.round(book.convictionScore * 100)}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-800">
                      {book.averageRating > 0 ? `${book.averageRating} ★` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {book.convictionScore >= 0.5 ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Tier 1 Finalist
                        </span>
                      ) : book.topTwoVotes > 0 ? (
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Contender
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                          Standard Review
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: The October Window */}
      {activeSubView === 'october_window' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-100 text-rose-800">
                <Calendar className="w-4 h-4 text-rose-600" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                The October Window: Late Releases in {selectedGenreGroup}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Titles published after August have had less time for reader circulation. These require urgent cross-reading priority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lateYearInGroup.map((book) => (
              <div key={book.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded">
                      Release Date: {book.releaseDate}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{book.title}</h4>
                    <p className="text-xs text-slate-600">by {book.author}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Submitted by: <strong className="font-mono text-blue-700">{book.submittedByEmail}</strong> ({book.submittedByCountry})
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    book.activeReaders < 3 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {book.activeReaders}/5 Readers
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{book.summary}</p>

                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {book.activeReaders < 3 ? `🚨 Needs ${3 - book.activeReaders} cross-readers urgently` : '✅ Quorum satisfied'}
                  </span>
                  <button
                    onClick={() => onSelectTab('nudges')}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Send Urgent Nudge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: DNF Breakdown by Sub-genre */}
      {activeSubView === 'dnf_analysis' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-purple-100 text-purple-800">
                <TrendingDown className="w-4 h-4 text-purple-600" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                DNF (Did Not Finish) Breakdown: {selectedGenreGroup}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Tracks drop-off patterns and reader-submitted reasons across sub-genres.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dnfStatsBySubgenre.map((stat) => (
              <div key={stat.subgenre} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{stat.subgenre}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    stat.dnfRate > 25 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {stat.dnfRate}% DNF Rate
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${stat.totalLogs > 0 ? (stat.finishedCount / stat.totalLogs) * 100 : 0}%` }}
                    title={`Finished: ${stat.finishedCount}`}
                  />
                  <div 
                    className="bg-rose-500 h-full" 
                    style={{ width: `${stat.totalLogs > 0 ? (stat.dnfCount / stat.totalLogs) * 100 : 0}%` }}
                    title={`DNF: ${stat.dnfCount}`}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Finished: {stat.finishedCount}</span>
                  <span>DNF: {stat.dnfCount}</span>
                  <span>Total Logs: {stat.totalLogs}</span>
                </div>

                {stat.reasons.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">Reported Drop-off Reasons:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                      {stat.reasons.map((r, i) => (
                        <li key={i} className="line-clamp-1 italic">"{r}"</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 6: Submitters & Global Countries */}
      {activeSubView === 'readers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-100 text-blue-800">
                <Globe2 className="w-4 h-4 text-blue-600" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Submitters &amp; Global Reader Activity ({selectedGenreGroup})
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Captures submitter email address and country of origin to ensure balanced regional representation across Google offices.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Submitter Email</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3 text-center">Books Finished</th>
                  <th className="py-2.5 px-3 text-center">Reading</th>
                  <th className="py-2.5 px-3 text-center">DNFs</th>
                  <th className="py-2.5 px-3 text-center">Top 2 Cast</th>
                  <th className="py-2.5 px-3 text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readerLeaderboard.map((r) => (
                  <tr key={r.email} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-semibold text-blue-700">
                      {r.email}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe2 className="w-3 h-3 text-slate-400" />
                        {r.country}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">
                      {r.finished}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      {r.reading}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-700">
                      {r.dnf}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-700">
                      {r.top2}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {r.email === activeGenreLead.leadEmail ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          ⭐ Genre Lead
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                          Active Reader
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
