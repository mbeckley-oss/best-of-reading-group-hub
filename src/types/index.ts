export type ReadingStatus = 'Requested' | 'Reading' | 'Finished' | 'DNF';

export type GenreGroup = 
  | 'All Genres'
  | 'Romance & YA'
  | 'Science Fiction & Fantasy'
  | 'Comics & Manga'
  | 'Fiction & Literature'
  | 'Non-Fiction & Memoir';

export type UserRole = 'READER' | 'GENRE_LEAD' | 'COORDINATOR_ADMIN';

export type AppTabId = 'dashboard' | 'form' | 'my_reading' | 'sheet' | 'nudges' | 'gtech' | 'appsscript' | 'permissions';

export interface TabAccessRule {
  tabId: AppTabId;
  tabLabel: string;
  iconName: string;
  minRole: UserRole;
  description: string;
  allowedRoles: UserRole[];
}

export interface UserPersona {
  email: string;
  name: string;
  role: UserRole;
  country: string;
  assignedGenreGroup?: GenreGroup;
  badgeLabel: string;
}

export interface ReaderLog {
  id: string;
  bookId: string;
  submitterEmail: string;
  submitterLdap: string;
  submitterName: string;
  submitterCountry: string; // e.g. "United States", "United Kingdom", "Ireland", "India", "Canada", etc.
  status: ReadingStatus;
  startDate: string;
  lastUpdated: string;
  releaseDate: string; // Captured release date
  rating?: number; // 1-5 stars
  isTopTwo?: boolean;
  notes?: string;
  dnfReason?: string;
  isStaleHold?: boolean; // >14 days inactive
  format?: 'eBook' | 'Audiobook';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genreGroup: 'Romance & YA' | 'Science Fiction & Fantasy' | 'Comics & Manga' | 'Fiction & Literature' | 'Non-Fiction & Memoir';
  primaryGenre: string;
  subGenre: string;
  docId: string;
  bibkey: string;
  playBooksUrl: string;
  releaseDate: string; // YYYY-MM-DD
  isLateYearRelease: boolean; // Release > August
  summary?: string;
  pageCount?: number;
  coverColor?: string;
  coverImageUrl?: string;
  createdAt: string;
  submittedByEmail?: string;
  submittedByCountry?: string;
}

export interface BookWithStats extends Book {
  activeReaders: number;
  totalFinished: number;
  totalDnf: number;
  topTwoVotes: number;
  averageRating: number;
  convictionScore: number; // topTwoVotes / totalReaders
  isCapped: boolean; // >= 5 readers
  isUnderRead: boolean; // < 3 readers
  staleHoldsCount: number;
  readerLogs: ReaderLog[];
}

export interface NudgeTemplate {
  id: string;
  title: string;
  triggerType: 'STALE_HOLD' | 'REVIEW_FOLLOWUP' | 'OCTOBER_WINDOW' | 'HIDDEN_GEM_ALERT' | 'CUTOFF_DEADLINE';
  genreGroup?: GenreGroup;
  frequency: string;
  description: string;
  defaultSubject: string;
  templateBody: string;
  eligibleCount: number;
  active: boolean;
}

export interface GTechBatchItem {
  email: string;
  ldap: string;
  country: string;
  docId: string;
  bibkey: string;
  title: string;
  genreGroup: string;
  format: 'eBook' | 'Audiobook';
  releaseDate: string;
  requestDate: string;
  priority: 'P1 - High (Late Year)' | 'P2 - Standard';
  status: 'Pending Batch' | 'Submitted to Buganizer' | 'Fulfilled';
}

export interface SheetSyncEvent {
  timestamp: string;
  bookTitle: string;
  updatedStatus: ReadingStatus | 'Deleted';
  previousStatus?: ReadingStatus;
  email: string;
  logId?: string;
  sheetTab: string;
  cellRef: string;
  rowNumber?: number;
}
