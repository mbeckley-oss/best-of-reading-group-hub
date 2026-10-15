import React, { useState, useRef } from 'react';
import { Book, BookWithStats, ReadingStatus, GenreGroup } from '../types';
import { 
  parseBookUrlOrTitle, 
  parseMultipleBookUrls, 
  extractMultipleUrlsOrCodes,
  ParsedBookMetadata 
} from '../services/geminiService';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Star, 
  Check, 
  Loader2, 
  Flame, 
  Calendar, 
  Globe2, 
  Mail, 
  Info, 
  Layers, 
  Heart, 
  Rocket, 
  Palette,
  Trash2,
  ListPlus,
  Plus,
  CheckCheck,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  RotateCcw,
  X
} from 'lucide-react';

interface ReaderFormProps {
  books: BookWithStats[];
  onAddBookAndLog: (newBook: Book, logData: any) => void;
  onUpdateLog: (bookId: string, logData: any) => void;
  currentUserEmail: string;
  onChangeUserEmail: (email: string) => void;
  currentUserCountry: string;
  onChangeUserCountry: (country: string) => void;
  activeGenreGroupFilter: GenreGroup;
  onSelectGenreGroupFilter: (group: GenreGroup) => void;
}

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Ireland',
  'Canada',
  'Japan',
  'Australia',
  'India',
  'Germany',
  'France',
  'Switzerland',
  'Singapore',
];

const GENRE_GROUPS = [
  'Romance & YA',
  'Science Fiction & Fantasy',
  'Comics & Manga',
  'Fiction & Literature',
  'Non-Fiction & Memoir',
] as const;

interface BatchQueueItem {
  id: string;
  metadata: ParsedBookMetadata;
  genreGroup: typeof GENRE_GROUPS[number];
  releaseDate: string;
  format: 'eBook' | 'Audiobook';
  status: ReadingStatus;
  selected: boolean;
  rawInput: string;
  customCoverPhoto?: string;
}

export const ReaderForm: React.FC<ReaderFormProps> = ({
  books,
  onAddBookAndLog,
  onUpdateLog,
  currentUserEmail,
  onChangeUserEmail,
  currentUserCountry,
  onChangeUserCountry,
  activeGenreGroupFilter,
  onSelectGenreGroupFilter,
}) => {
  // Intake mode: Single URL vs Multiple URLs / Batch
  const [intakeType, setIntakeType] = useState<'single' | 'batch'>('single');

  // Single book request states
  const [playBooksUrl, setPlayBooksUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedMetadata, setParsedMetadata] = useState<ParsedBookMetadata | null>(null);
  const [customCoverPhoto, setCustomCoverPhoto] = useState<string | null>(null);
  const [selectedGenreGroup, setSelectedGenreGroup] = useState<typeof GENRE_GROUPS[number]>('Romance & YA');
  const [manualReleaseDate, setManualReleaseDate] = useState<string>('2026-06-01');
  const [initialStatus, setInitialStatus] = useState<ReadingStatus>('Requested');
  const [format, setFormat] = useState<'eBook' | 'Audiobook'>('eBook');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const [currentBatchUploadItemId, setCurrentBatchUploadItemId] = useState<string | null>(null);
  
  // Batch multi-URL states
  const [batchRawText, setBatchRawText] = useState<string>('');
  const [isBatchParsing, setIsBatchParsing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; latestTitle?: string }>({ current: 0, total: 0 });
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchGlobalStatus, setBatchGlobalStatus] = useState<ReadingStatus>('Requested');
  const [batchGlobalFormat, setBatchGlobalFormat] = useState<'eBook' | 'Audiobook'>('eBook');

  // Submission success notification
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const sampleLinks = [
    { label: 'Romance & YA: Just for the Summer', url: 'https://play.google.com/store/books/details?id=v8TqDwAAQBAJ', genre: 'Romance & YA' },
    { label: 'Sci-Fi: The Ministry of Time', url: 'https://play.google.com/store/books/details?id=aN92DwAAQBAJ', genre: 'Science Fiction & Fantasy' },
    { label: 'Manga: Dungeon Meshi (Delicious in Dungeon)', url: 'https://play.google.com/store/books/details?id=dM7qDwAAQBAJ', genre: 'Comics & Manga' },
    { label: 'Graphic Novel: Roaming', url: 'https://play.google.com/store/books/details?id=rM82DwAAQBAJ', genre: 'Comics & Manga' },
    { label: 'Fiction: Intermezzo', url: 'https://play.google.com/store/books/details?id=xKl5EAAAQBAJ', genre: 'Fiction & Literature' },
  ];

  const sampleBatchText = `https://play.google.com/store/books/details?id=v8TqDwAAQBAJ\nhttps://play.google.com/store/books/details?id=aN92DwAAQBAJ\nhttps://play.google.com/store/books/details?id=dM7qDwAAQBAJ\nxKl5EAAAQBAJ`;

  // Detect if user pasted multiple items in single input
  const detectedMultipleInSingle = extractMultipleUrlsOrCodes(playBooksUrl).length > 1;

  // Handle uploading custom photo from file input
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setParseError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomCoverPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle batch item photo upload
  const handleBatchPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBatchUploadItemId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBatchQueue(prev => prev.map(item => 
        item.id === currentBatchUploadItemId ? { ...item, customCoverPhoto: dataUrl } : item
      ));
      setCurrentBatchUploadItemId(null);
    };
    reader.readAsDataURL(file);
  };

  // Single URL Parser
  const handleParseUrl = async (urlToParse?: string) => {
    const target = urlToParse || playBooksUrl;
    if (!target.trim()) {
      setParseError('Please enter a Google Play Books link or Title');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    try {
      const result = await parseBookUrlOrTitle(target);
      setParsedMetadata(result);
      setSelectedGenreGroup(result.genreGroup as any);
      if (result.releaseDate) {
        setManualReleaseDate(result.releaseDate);
      }
      if (urlToParse) {
        setPlayBooksUrl(urlToParse);
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse metadata');
    } finally {
      setIsParsing(false);
    }
  };

  // Batch Multi-URL Parser
  const handleParseBatch = async () => {
    const tokens = extractMultipleUrlsOrCodes(batchRawText);
    if (tokens.length === 0) {
      setBatchError('Please enter at least one Play Books URL or docId code.');
      return;
    }

    setIsBatchParsing(true);
    setBatchError(null);
    setBatchProgress({ current: 0, total: tokens.length });

    try {
      const { successful, failed } = await parseMultipleBookUrls(tokens, (current, total, latestTitle) => {
        setBatchProgress({ current, total, latestTitle });
      });

      const newQueueItems: BatchQueueItem[] = successful.map((meta, idx) => ({
        id: 'batch_item_' + Date.now() + '_' + idx,
        metadata: meta,
        genreGroup: (meta.genreGroup as any) || 'Fiction & Literature',
        releaseDate: meta.releaseDate || '2026-06-01',
        format: batchGlobalFormat,
        status: batchGlobalStatus,
        selected: true,
        rawInput: meta.inputSource || meta.docId,
        customCoverPhoto: meta.coverImageUrl,
      }));

      setBatchQueue((prev) => [...prev, ...newQueueItems]);

      if (failed.length > 0) {
        setBatchError(`Parsed ${successful.length} of ${tokens.length} items. Could not resolve: ${failed.map(f => f.input).join(', ')}`);
      } else {
        setBatchRawText('');
      }
    } catch (err: any) {
      setBatchError(err.message || 'Error occurred while processing batch.');
    } finally {
      setIsBatchParsing(false);
    }
  };

  const existingMatchedBook = parsedMetadata
    ? books.find(b => b.docId === parsedMetadata.docId || b.title.toLowerCase() === parsedMetadata.title.toLowerCase())
    : null;

  // Submit Single Book
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedMetadata) {
      setParseError('Please parse a Play Books URL first using Gemini');
      return;
    }

    if (existingMatchedBook && existingMatchedBook.isCapped) {
      setParseError(`"${existingMatchedBook.title}" has reached the 5-reader cap! You can only join the waitlist.`);
      return;
    }

    const releaseDateFinal = manualReleaseDate || parsedMetadata.releaseDate || '2026-06-01';
    const isLate = parseInt(releaseDateFinal.split('-')[1] || '0', 10) >= 9;
    const finalCoverImageUrl = customCoverPhoto || parsedMetadata.coverImageUrl;

    const newBook: Book = {
      id: existingMatchedBook ? existingMatchedBook.id : 'b_' + Date.now(),
      title: parsedMetadata.title,
      author: parsedMetadata.author,
      genreGroup: selectedGenreGroup,
      primaryGenre: parsedMetadata.primaryGenre || selectedGenreGroup,
      subGenre: parsedMetadata.subGenre || 'General',
      docId: parsedMetadata.docId,
      bibkey: parsedMetadata.bibkey,
      playBooksUrl: playBooksUrl || `https://play.google.com/store/books/details?id=${parsedMetadata.docId}`,
      releaseDate: releaseDateFinal,
      isLateYearRelease: isLate,
      summary: parsedMetadata.summary,
      pageCount: parsedMetadata.pageCount || 300,
      coverImageUrl: finalCoverImageUrl,
      createdAt: new Date().toISOString().split('T')[0],
      submittedByEmail: currentUserEmail,
      submittedByCountry: currentUserCountry,
      coverColor: selectedGenreGroup === 'Romance & YA' 
        ? 'from-pink-500 to-rose-800' 
        : selectedGenreGroup === 'Science Fiction & Fantasy'
        ? 'from-blue-600 to-indigo-950'
        : selectedGenreGroup === 'Comics & Manga'
        ? 'from-amber-600 to-orange-950'
        : 'from-slate-700 to-slate-950',
    };

    const ldap = currentUserEmail.split('@')[0];
    const logData = {
      submitterEmail: currentUserEmail,
      submitterLdap: ldap,
      submitterName: ldap.toUpperCase(),
      submitterCountry: currentUserCountry,
      status: initialStatus,
      releaseDate: releaseDateFinal,
      format,
      notes: `Submitted by ${currentUserEmail} (${currentUserCountry}) [Genre Group: ${selectedGenreGroup}]`,
    };

    onAddBookAndLog(newBook, logData);
    setSubmittedMessage(`Successfully submitted "${newBook.title}" [${selectedGenreGroup}] with cover photo! Logged for ${currentUserEmail} (${currentUserCountry}) & release date ${releaseDateFinal}.`);
    setParsedMetadata(null);
    setCustomCoverPhoto(null);
    setPlayBooksUrl('');
    setTimeout(() => setSubmittedMessage(null), 6000);
  };

  // Submit Multiple Books in Batch
  const handleSubmitBatch = () => {
    const selectedItems = batchQueue.filter(item => item.selected);
    if (selectedItems.length === 0) {
      setBatchError('No books selected for submission.');
      return;
    }

    const ldap = currentUserEmail.split('@')[0];
    let submittedCount = 0;

    selectedItems.forEach((item, idx) => {
      const matched = books.find(b => b.docId === item.metadata.docId || b.title.toLowerCase() === item.metadata.title.toLowerCase());
      const releaseDateFinal = item.releaseDate || item.metadata.releaseDate || '2026-06-01';
      const isLate = parseInt(releaseDateFinal.split('-')[1] || '0', 10) >= 9;
      const finalCoverImageUrl = item.customCoverPhoto || item.metadata.coverImageUrl;

      const newBook: Book = {
        id: matched ? matched.id : `b_batch_${Date.now()}_${idx}`,
        title: item.metadata.title,
        author: item.metadata.author,
        genreGroup: item.genreGroup,
        primaryGenre: item.metadata.primaryGenre || item.genreGroup,
        subGenre: item.metadata.subGenre || 'General',
        docId: item.metadata.docId,
        bibkey: item.metadata.bibkey,
        playBooksUrl: `https://play.google.com/store/books/details?id=${item.metadata.docId}`,
        releaseDate: releaseDateFinal,
        isLateYearRelease: isLate,
        summary: item.metadata.summary,
        pageCount: item.metadata.pageCount || 300,
        coverImageUrl: finalCoverImageUrl,
        createdAt: new Date().toISOString().split('T')[0],
        submittedByEmail: currentUserEmail,
        submittedByCountry: currentUserCountry,
        coverColor: item.genreGroup === 'Romance & YA' 
          ? 'from-pink-500 to-rose-800' 
          : item.genreGroup === 'Science Fiction & Fantasy'
          ? 'from-blue-600 to-indigo-950'
          : item.genreGroup === 'Comics & Manga'
          ? 'from-amber-600 to-orange-950'
          : 'from-slate-700 to-slate-950',
      };

      const logData = {
        submitterEmail: currentUserEmail,
        submitterLdap: ldap,
        submitterName: ldap.toUpperCase(),
        submitterCountry: currentUserCountry,
        status: item.status,
        releaseDate: releaseDateFinal,
        format: item.format,
        notes: `Bulk Intake: Submitted by ${currentUserEmail} (${currentUserCountry}) [Genre Group: ${item.genreGroup}]`,
      };

      onAddBookAndLog(newBook, logData);
      submittedCount++;
    });

    setSubmittedMessage(`🎉 Successfully submitted batch of ${submittedCount} books with photos under ${currentUserEmail} (${currentUserCountry})! Added to Master Library and queued for gTech fulfillment.`);
    setBatchQueue([]);
    setBatchRawText('');
    setTimeout(() => setSubmittedMessage(null), 8000);
  };

  // Active cover photo preview in Single Mode
  const activeSingleCover = customCoverPhoto || parsedMetadata?.coverImageUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file input for single book cover photo upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Hidden file input for batch item cover photo upload */}
      <input 
        type="file" 
        ref={batchFileInputRef} 
        onChange={handleBatchPhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Top Banner: Capturing Submitter Email, Country, Release Date & Genre Groups */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 rounded-2xl shadow-lg border border-blue-600/30">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Standardized Reader Intake &amp; Database Entry
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Best Of Reader Portal</h2>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Submit single or bulk book requests with <strong>automated cover photo extraction &amp; photo uploads</strong>. 
              Captures <strong>Submitter Email, Country, Release Date, and Status</strong> directly into Google Sheets.
            </p>
          </div>

          {/* Submitter Profile Info Box */}
          <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-md border border-white/20 text-xs space-y-2 shrink-0">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
              Submitter Information (Database Fields)
            </span>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <input
                type="email"
                value={currentUserEmail}
                onChange={(e) => onChangeUserEmail(e.target.value)}
                placeholder="reader@google.com"
                className="bg-white/20 text-white font-mono text-xs px-2.5 py-1 rounded border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-44"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <select
                value={currentUserCountry}
                onChange={(e) => onChangeUserCountry(e.target.value)}
                className="bg-slate-900/60 text-white text-xs px-2.5 py-1 rounded border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-44"
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c} className="text-slate-900">{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Helpful routing note */}
        <div className="mt-5 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-200">
          <span>
            💡 Looking to update your reading progress, submit reviews, or vote for Top 2? Use your personal <strong>My Reading Hub</strong> tab.
          </span>
          <span className="text-[11px] font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/20 self-start sm:self-auto">
            Intake &amp; Cover Extraction Mode
          </span>
        </div>
      </div>

      {/* Success banner */}
      {submittedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3.5 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{submittedMessage}</p>
        </div>
      )}

      {/* Book Request Intake via URL & Gemini with Cover Photo Upload */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        {/* Intake Sub-Header with Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Submit Book Request(s) &amp; Cover Photos
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Automatically extracts book metadata and <strong>cover photo</strong> upon URL parse, with support for uploading custom ARC or proof photos.
            </p>
          </div>

            {/* Single vs Multiple Intake Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
              <button
                type="button"
                onClick={() => setIntakeType('single')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  intakeType === 'single'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single URL &amp; Photo
              </button>
              <button
                type="button"
                onClick={() => setIntakeType('batch')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  intakeType === 'batch'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Multiple URLs / Codes</span>
                <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  Bulk
                </span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB OPTION A: MULTIPLE URLS / CODES BATCH INTAKE */}
          {/* ============================================================== */}
          {intakeType === 'batch' && (
            <div className="space-y-6">
              {/* Batch instructions and sample loader */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-indigo-600" />
                    Batch Intake: Multiple Google Play Books URLs or Codes
                  </div>
                  <p className="text-slate-600">
                    Paste multiple URLs, <code>id=...</code> queries, or direct docId codes. Photos will be automatically extracted for each title.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBatchRawText(sampleBatchText)}
                  className="bg-white hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg border border-indigo-300 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  ⚡ Load 4 Sample Books
                </button>
              </div>

              {/* Multi-line Text Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Paste Multiple URLs or Codes:
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    Detected:{' '}
                    <strong className="text-indigo-600">
                      {extractMultipleUrlsOrCodes(batchRawText).length}
                    </strong>{' '}
                    items
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={batchRawText}
                  onChange={(e) => setBatchRawText(e.target.value)}
                  placeholder={`https://play.google.com/store/books/details?id=v8TqDwAAQBAJ\nhttps://play.google.com/store/books/details?id=aN92DwAAQBAJ\nhttps://play.google.com/store/books/details?id=dM7qDwAAQBAJ\nxKl5EAAAQBAJ`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-mono text-slate-800 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Supported: Full links, <code>id=...</code>, or raw docId codes (e.g. <code>v8TqDwAAQBAJ</code>).
                  </span>
                  {batchRawText && (
                    <button
                      type="button"
                      onClick={() => setBatchRawText('')}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Parse Batch Button */}
              <div>
                <button
                  type="button"
                  onClick={handleParseBatch}
                  disabled={isBatchParsing || extractMultipleUrlsOrCodes(batchRawText).length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isBatchParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>
                        Parsing &amp; extracting cover photos ({batchProgress.current} of {batchProgress.total})...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        Parse All ({extractMultipleUrlsOrCodes(batchRawText).length}) Books &amp; Photos with Gemini
                      </span>
                    </>
                  )}
                </button>

                {batchProgress.latestTitle && isBatchParsing && (
                  <p className="text-xs text-indigo-700 font-medium mt-2 animate-pulse">
                    Currently extracting: <em>"{batchProgress.latestTitle}"</em>
                  </p>
                )}

                {batchError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {batchError}
                  </p>
                )}
              </div>

              {/* BATCH QUEUE REVIEW STAGE */}
              {batchQueue.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        Parsed Books Queue ({batchQueue.length} Ready with Cover Photos)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cover photos have been attached automatically. You can upload custom replacement photos or adjust genre groups.
                      </p>
                    </div>

                    {/* Batch Global Defaults */}
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mr-1.5">Status:</label>
                        <select
                          value={batchGlobalStatus}
                          onChange={(e) => {
                            const val = e.target.value as ReadingStatus;
                            setBatchGlobalStatus(val);
                            setBatchQueue(prev => prev.map(item => ({ ...item, status: val })));
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="Requested">Requested</option>
                          <option value="Reading">Reading</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mr-1.5">Format:</label>
                        <select
                          value={batchGlobalFormat}
                          onChange={(e) => {
                            const val = e.target.value as 'eBook' | 'Audiobook';
                            setBatchGlobalFormat(val);
                            setBatchQueue(prev => prev.map(item => ({ ...item, format: val })));
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="eBook">eBook</option>
                          <option value="Audiobook">Audiobook</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* List of items in batch with Cover Photos */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {batchQueue.map((item, idx) => {
                      const matched = books.find(b => b.docId === item.metadata.docId || b.title.toLowerCase() === item.metadata.title.toLowerCase());
                      const isCapped = matched?.isCapped;
                      const coverSrc = item.customCoverPhoto || item.metadata.coverImageUrl;

                      return (
                        <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, selected: checked } : q));
                              }}
                              className="w-4 h-4 mt-2 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                            />

                            {/* Book Cover Photo in Batch */}
                            <div className="relative group shrink-0">
                              {coverSrc ? (
                                <img
                                  src={coverSrc}
                                  alt={item.metadata.title}
                                  className="w-12 h-16 rounded-md object-cover border border-slate-200 shadow-2xs"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-16 rounded-md bg-gradient-to-tr from-slate-700 to-indigo-800 text-white flex flex-col items-center justify-center text-center p-1 text-[9px] font-bold">
                                  No Cover
                                </div>
                              )}

                              {/* Upload/Replace photo for this batch item */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentBatchUploadItemId(item.id);
                                  batchFileInputRef.current?.click();
                                }}
                                className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center cursor-pointer"
                                title="Upload custom photo for this book"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm">
                                  {idx + 1}. {item.metadata.title}
                                </span>
                                <span className="text-xs text-slate-500">by {item.metadata.author}</span>
                                {item.metadata.isLateYearRelease && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                    October Window
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap">
                                <span>DocID: <strong className="text-blue-700">{item.metadata.docId}</strong></span>
                                <span>•</span>
                                <span>Bibkey: {item.metadata.bibkey}</span>
                                <span>•</span>
                                <span>Release: {item.releaseDate}</span>
                              </div>

                              {isCapped && (
                                <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  5-Reader Cap Reached. This request will be added to the waitlist.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Editable fields per book in batch */}
                          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto shrink-0">
                            {/* Quick Upload custom photo button */}
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentBatchUploadItemId(item.id);
                                batchFileInputRef.current?.click();
                              }}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              title="Upload custom photo"
                            >
                              <Camera className="w-3.5 h-3.5 text-slate-600" />
                              <span>Photo</span>
                            </button>

                            {/* Genre dropdown */}
                            <select
                              value={item.genreGroup}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, genreGroup: val } : q));
                              }}
                              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 font-medium"
                            >
                              {GENRE_GROUPS.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>

                            {/* Format */}
                            <select
                              value={item.format}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, format: val } : q));
                              }}
                              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5"
                            >
                              <option value="eBook">eBook</option>
                              <option value="Audiobook">Audiobook</option>
                            </select>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => {
                                setBatchQueue(prev => prev.filter(q => q.id !== item.id));
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="Remove from batch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit All Batch */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                    <span className="text-xs text-slate-500">
                      Submitting for <strong className="text-slate-800">{currentUserEmail}</strong> ({currentUserCountry}) with cover photos.
                    </span>

                    <button
                      type="button"
                      onClick={handleSubmitBatch}
                      disabled={batchQueue.filter(b => b.selected).length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <Check className="w-4 h-4" />
                      Submit All ({batchQueue.filter(b => b.selected).length}) Books to Sheet &amp; gTech
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB OPTION B: SINGLE URL INTAKE WITH PHOTO UPLOAD */}
          {/* ============================================================== */}
          {intakeType === 'single' && (
            <div className="space-y-6">
              {/* Quick sample chips with Genre Groups highlighted */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Try a sample Play Books link by Genre Group:
                </label>
                <div className="flex flex-wrap gap-2">
                  {sampleLinks.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleParseUrl(item.url)}
                      className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      {item.genre === 'Romance & YA' && <Heart className="w-3 h-3 text-pink-500" />}
                      {item.genre === 'Science Fiction & Fantasy' && <Rocket className="w-3 h-3 text-indigo-500" />}
                      {item.genre === 'Comics & Manga' && <Palette className="w-3 h-3 text-amber-500" />}
                      {item.genre === 'Fiction & Literature' && <BookOpen className="w-3 h-3 text-blue-500" />}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Input & Photo Upload Shortcut */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 block">
                    Google Play Books URL, DocID Code, or Title Reference
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Book Cover / ARC Photo</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={playBooksUrl}
                      onChange={(e) => setPlayBooksUrl(e.target.value)}
                      placeholder="https://play.google.com/store/books/details?id=... or book code (e.g. v8TqDwAAQBAJ)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleParseUrl()}
                    disabled={isParsing || !playBooksUrl.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Parsing &amp; Fetching Cover...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        Parse Metadata &amp; Cover
                      </>
                    )}
                  </button>
                </div>

                {/* Intelligent Multi-URL detection banner */}
                {detectedMultipleInSingle && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <ListPlus className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Detected <strong>{extractMultipleUrlsOrCodes(playBooksUrl).length} URLs/codes</strong> in the input.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchRawText(playBooksUrl);
                        setPlayBooksUrl('');
                        setIntakeType('batch');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Switch to Batch Mode →
                    </button>
                  </div>
                )}

                {parseError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {parseError}
                  </p>
                )}
              </div>

              {/* Parsed Metadata Card Preview WITH Book Cover Photo */}
              {parsedMetadata && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 animate-in fade-in shadow-xs">
                  {/* Top Bar: Gemini Status & DocID */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Gemini Extracted Metadata &amp; Photo
                      </span>
                      <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                        DocID: {parsedMetadata.docId}
                      </span>
                    </div>
                    {parsedMetadata.isLateYearRelease && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        <Calendar className="w-3 h-3 text-rose-600" />
                        October Window (Late-Year)
                      </span>
                    )}
                  </div>

                  {/* Main Content: Left side Cover Photo, Right side Metadata */}
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* BOOK COVER PHOTO PREVIEW & UPLOAD COMPONENT */}
                    <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                      <div className="relative group w-32 h-44 rounded-xl overflow-hidden border border-slate-300 shadow-md bg-white">
                        {activeSingleCover ? (
                          <img
                            src={activeSingleCover}
                            alt={parsedMetadata.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-indigo-950 text-white p-3 flex flex-col items-center justify-center text-center">
                            <ImageIcon className="w-8 h-8 text-indigo-300 mb-1" />
                            <span className="text-[11px] font-bold">No Cover</span>
                          </div>
                        )}

                        {/* Hover Overlay to Upload/Change Photo */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center cursor-pointer"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[11px] font-bold">Change Photo</span>
                        </button>
                      </div>

                      {/* Photo Status Pill & Actions */}
                      <div className="space-y-1 text-center">
                        {customCoverPhoto ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Custom Photo Attached
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => setCustomCoverPhoto(null)}
                                className="text-[11px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                              >
                                Revert to parsed cover
                              </button>
                            </div>
                          </div>
                        ) : parsedMetadata.coverImageUrl ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                            Parsed Play Books Cover
                          </span>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-center gap-1 cursor-pointer pt-0.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload ARC Photo</span>
                        </button>
                      </div>
                    </div>

                    {/* Book Metadata Columns */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 leading-snug">
                          {parsedMetadata.title}
                        </h4>
                        <p className="text-sm font-medium text-slate-600 mt-0.5">
                          by <span className="text-slate-900 font-bold">{parsedMetadata.author}</span>
                        </p>
                      </div>

                      {parsedMetadata.summary && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {parsedMetadata.summary}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Sub-Genre</span>
                          <span className="font-semibold text-slate-800">{parsedMetadata.subGenre}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Bibkey / ISBN</span>
                          <span className="font-mono text-slate-800">{parsedMetadata.bibkey}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Pages</span>
                          <span className="font-mono text-slate-800">{parsedMetadata.pageCount || 320} pp</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REQUIRED DATABASE FIELDS SECTION */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Required Database Attributes to Log:
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {/* Genre Group Assignment */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Genre Group:
                        </label>
                        <select
                          value={selectedGenreGroup}
                          onChange={(e) => setSelectedGenreGroup(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {GENRE_GROUPS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Release Date (Required) */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Release Date:
                        </label>
                        <input
                          type="date"
                          value={manualReleaseDate}
                          onChange={(e) => setManualReleaseDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Status (Required) */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Submission Status:
                        </label>
                        <select
                          value={initialStatus}
                          onChange={(e) => setInitialStatus(e.target.value as ReadingStatus)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Requested">Requested (New Hold)</option>
                          <option value="Reading">Reading (Active)</option>
                          <option value="Finished">Finished</option>
                          <option value="DNF">DNF (Did Not Finish)</option>
                        </select>
                      </div>

                      {/* Country (Required) */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Submitter Country:
                        </label>
                        <select
                          value={currentUserCountry}
                          onChange={(e) => onChangeUserCountry(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Submitter Email:</span>
                        <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{currentUserEmail}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">Format:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={format === 'eBook'}
                            onChange={() => setFormat('eBook')}
                            className="text-blue-600"
                          />
                          eBook
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={format === 'Audiobook'}
                            onChange={() => setFormat('Audiobook')}
                            className="text-blue-600"
                          />
                          Audiobook
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Reader Cap Status for this book */}
                  {existingMatchedBook ? (
                    <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      existingMatchedBook.isCapped 
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>
                          <strong>Current Reader Capacity: </strong>
                          {existingMatchedBook.activeReaders} of 5 active slots occupied.
                          {existingMatchedBook.isCapped && ' (At 5-reader cap!)'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-semibold text-xs ${
                        existingMatchedBook.isCapped ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                      }`}>
                        {existingMatchedBook.isCapped ? 'Waitlist Only' : `${5 - existingMatchedBook.activeReaders} Open Slots`}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        New Title! Will be filed under <strong>{selectedGenreGroup}</strong> with attached photo and assigned to <strong>{currentUserEmail}</strong>.
                      </span>
                    </div>
                  )}

                  {/* Submit Single */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitRequest}
                      disabled={existingMatchedBook?.isCapped}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Save to Central Sheet (With Cover Photo &amp; Submitter Info)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
};
