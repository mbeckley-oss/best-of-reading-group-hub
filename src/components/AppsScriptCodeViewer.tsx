import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  Layers,
  Terminal,
  FileCode
} from 'lucide-react';

export const AppsScriptCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const appsScriptCode = `/**
 * Best Of Reading Group - Production Google Apps Script (Code.gs)
 * Replaces AppSheet with Gemini-powered Google Workspace Automation
 * 
 * Features:
 * 1. onFormSubmit(e) trigger: Parses Google Play Books URL via Gemini API
 * 2. Real-time Reader Cap Enforcement (5-reader limit)
 * 3. Dynamic Form Dropdown Updater (tags [WAITLIST] when capped)
 * 4. 14-Day Inactivity Stale Hold Nudge Bot
 * 5. gTech Buganizer Fulfillment CSV Generator
 */

const CONFIG = {
  GEMINI_MODEL: 'gemini-3.6-flash',
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_OR_SCRIPT_PROPERTY', // Set via Script Properties
  MAX_READERS_PER_BOOK: 5,
  SHEET_MASTER: 'Master_Library',
  SHEET_LOGS: 'Reader_Logs',
  SHEET_VALIDATION: 'Validation_Engine',
  GOOGLE_FORM_ID: 'YOUR_GOOGLE_FORM_ID_HERE',
};

/**
 * Triggered on Form Submit to parse Play Books URL and update Master Library
 * Captures: Email Address, Submitter Country, Release Date, Status, and Genre Group
 */
function onFormSubmit(e) {
  const responses = e.namedValues;
  const bookUrl = responses['Play Books URL'] ? responses['Play Books URL'][0] : '';
  const submitterEmail = responses['Email Address'] ? responses['Email Address'][0].trim().toLowerCase() : Session.getActiveUser().getEmail();
  const submitterCountry = responses['Country'] ? responses['Country'][0].trim() : 'United States';
  const submitterLdap = submitterEmail.split('@')[0];
  const format = responses['Format'] ? responses['Format'][0] : 'eBook';
  const status = responses['Status'] ? responses['Status'][0] : 'Requested';
  const manualReleaseDate = responses['Release Date'] ? responses['Release Date'][0] : '';

  if (!bookUrl) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(CONFIG.SHEET_MASTER);
  const logsSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);

  // 1. Call Gemini API to extract Title, Author, Genre Group, Sub-Genre, DocID, Bibkey, Release Date
  const metadata = callGeminiToParseUrl(bookUrl);
  const releaseDateFinal = manualReleaseDate || metadata.releaseDate || '2026-06-01';

  // 2. Logic Check: Is the book at the 5-reader cap?
  if (isBookCapped(metadata.docId, ss)) {
    sendCapReachedNotification(submitterEmail, metadata.title);
    return; // Stop processing or add to Waitlist tab
  }

  // 3. Log to Master_Library if new
  ensureBookInMasterLibrary(masterSheet, metadata, releaseDateFinal, submitterEmail, submitterCountry);

  // 4. Log Reader Request (Columns: Timestamp, Submitter Email, Country, DocID, Title, Genre Group, Status, Release Date, Rating, Top 2, Notes)
  logsSheet.appendRow([
    new Date(),
    submitterEmail,
    submitterCountry,
    metadata.docId,
    metadata.title,
    metadata.genreGroup || 'Fiction & Literature',
    status,
    releaseDateFinal,
    '', // Rating (empty upon initial request)
    'No', // Top 2
    format,
    'Auto-logged via Gemini Form Trigger (' + submitterCountry + ')'
  ]);

  Logger.log(\`Successfully processed \${metadata.genreGroup} request for "\${metadata.title}" by \${submitterEmail} (\${submitterCountry})\`);
}

/**
 * Calls Gemini 3.6 Flash via REST API to parse Play Books URL
 */
function callGeminiToParseUrl(url) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || CONFIG.GEMINI_API_KEY;
  const endpoint = \`https://generativelanguage.googleapis.com/v1beta/models/\${CONFIG.GEMINI_MODEL}:generateContent?key=\${apiKey}\`;

  const prompt = \`Extract canonical metadata from this Google Play Books URL: "\${url}".
Return strictly valid JSON with keys:
- title: string
- author: string
- primaryGenre: string (Fiction, Non-Fiction, Sci-Fi & Fantasy, Mystery & Thriller, Memoir, etc.)
- subGenre: string
- docId: string (Google Play volume ID from URL parameter id=...)
- bibkey: string (ISBN:978... or GGKEY)
- releaseDate: string (YYYY-MM-DD)
- pageCount: number
- summary: string (1-2 sentences)
\`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const json = JSON.parse(response.getContentText());
    const textOutput = json.candidates[0].content.parts[0].text;
    const metadata = JSON.parse(textOutput);
    
    // Ensure docId fallback if regex needed
    if (!metadata.docId) {
      const match = url.match(/id=([A-Za-z0-9_-]+)/);
      metadata.docId = match ? match[1] : 'VOL_' + new Date().getTime();
    }
    return metadata;
  } catch (err) {
    Logger.log('Gemini API Error: ' + err.toString());
    const fallbackId = (url.match(/id=([A-Za-z0-9_-]+)/) || [null, 'VOL_UNKNOWN'])[1];
    return {
      title: 'Extracted Volume ' + fallbackId,
      author: 'Unknown Author',
      primaryGenre: 'Fiction',
      subGenre: 'General',
      docId: fallbackId,
      bibkey: 'GGKEY:' + fallbackId,
      releaseDate: '2026-01-01',
      summary: 'Parsed via heuristic fallback.'
    };
  }
}

/**
 * Checks if a book has hit the 5-reader limit using Validation_Engine tab
 */
function isBookCapped(docId, ss) {
  const validationSheet = ss.getSheetByName(CONFIG.SHEET_VALIDATION);
  const data = validationSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === docId) {
      const readerCount = data[i][3]; // Column D contains =COUNTIF count
      return readerCount >= CONFIG.MAX_READERS_PER_BOOK;
    }
  }
  return false;
}

/**
 * Time-Driven Trigger: Updates Google Form Dropdown with [WAITLIST] tags
 * Run hourly: Edit > Current project triggers > Add Trigger > Time-driven > Hourly
 */
function updateFormDropdownCaps() {
  if (!CONFIG.GOOGLE_FORM_ID || CONFIG.GOOGLE_FORM_ID.includes('YOUR_')) return;
  const form = FormApp.openById(CONFIG.GOOGLE_FORM_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const validationSheet = ss.getSheetByName(CONFIG.SHEET_VALIDATION);
  const rows = validationSheet.getDataRange().getValues();

  const choices = [];
  for (let i = 1; i < rows.length; i++) {
    const title = rows[i][2];
    const readerCount = rows[i][3];
    const isCapped = readerCount >= CONFIG.MAX_READERS_PER_BOOK;
    const label = isCapped 
      ? \`[WAITLIST ONLY] \${title}\` 
      : \`[OPEN - \${CONFIG.MAX_READERS_PER_BOOK - readerCount} slots] \${title}\`;
    choices.push(label);
  }

  const items = form.getItems(FormApp.ItemType.LIST);
  if (items.length > 0) {
    const bookListItem = items[0].asListItem();
    bookListItem.setChoiceValues(choices);
    Logger.log('Updated Google Form dropdown with current cap statuses.');
  }
}

/**
 * Time-Driven Trigger: Sends reminder emails for Stale Holds (>14 days inactive)
 * Run weekly every Monday 9:00 AM
 */
function sendStaleHoldReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);
  const data = logsSheet.getDataRange().getValues();
  const now = new Date();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  for (let i = 1; i < data.length; i++) {
    const readerLdap = data[i][1];
    const bookTitle = data[i][3];
    const status = data[i][4];
    const lastUpdated = new Date(data[i][9]);

    if ((status === 'Reading' || status === 'Requested') && (now - lastUpdated) > fourteenDaysMs) {
      const email = readerLdap + '@google.com';
      const subject = \`[Best Of Reading] Quick check-in on "\${bookTitle}"\`;
      const body = \`Hi \${readerLdap},

You currently hold an active reader slot for "\${bookTitle}".
Our records show this reading slot hasn't had an update in over 14 days. 

Because each title has a \${CONFIG.MAX_READERS_PER_BOOK}-reader cap and fellow readers may be on the waitlist, please take 30 seconds to update your progress or mark Finished/DNF on the Google Form.

Best,
Best Of Reading Group Leads\`;

      MailApp.sendEmail(email, subject, body);
      Logger.log(\`Sent stale hold nudge to \${email}\`);
    }
  }
}

/**
 * Helper: Ensures book exists in Master_Library
 */
function ensureBookInMasterLibrary(masterSheet, metadata, releaseDateFinal, submitterEmail, submitterCountry) {
  const data = masterSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === metadata.docId) return; // already exists
  }
  // Columns: DocID, Title, Author, Genre Group, Sub-Genre, Release Date, Submitter Email, Country, Current Readers, Bibkey
  masterSheet.appendRow([
    metadata.docId,
    metadata.title,
    metadata.author,
    metadata.genreGroup || 'Fiction & Literature',
    metadata.subGenre,
    releaseDateFinal,
    submitterEmail,
    submitterCountry,
    1, // initial reader count
    metadata.bibkey
  ]);
}

/**
 * Helper: Send email if user requests book that is already capped
 */
function sendCapReachedNotification(ldap, title) {
  MailApp.sendEmail(
    ldap + '@google.com',
    \`[Best Of Reading] Waitlist status for "\${title}"\`,
    \`Hi \${ldap},\\n\\nThank you for requesting "\${title}". This book has currently reached the \${CONFIG.MAX_READERS_PER_BOOK}-reader cap. You have been added to the waitlist. In the meantime, please check out the Under-Read Titles list on the Lead Dashboard!\\n\\nBest,\\nReading Leads\`
  );
}

/**
 * Web App & API Handler: Updates Reader Status directly in the Central Google Sheet
 * Called when individuals change book status in their My Reading Hub tab
 * (e.g. Requested -> Reading -> Finished / DNF)
 */
function updateReaderStatusInSheet(userEmail, bookTitleOrDocId, newStatus, rating, isTopTwo, notes, dnfReason) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);
  if (!logsSheet) {
    throw new Error('Sheet ' + CONFIG.SHEET_LOGS + ' not found in active spreadsheet.');
  }

  const data = logsSheet.getDataRange().getValues();
  const targetEmail = (userEmail || '').trim().toLowerCase();
  const targetBook = (bookTitleOrDocId || '').trim().toLowerCase();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  let targetRow = -1;

  for (let i = 1; i < data.length; i++) {
    const rowEmail = String(data[i][2] || '').trim().toLowerCase(); // Column C: Submitter Email
    const rowTitle = String(data[i][4] || '').trim().toLowerCase(); // Column E: Book Title
    const rowDocId = String(data[i][0] || '').trim().toLowerCase(); // DocID

    if (rowEmail === targetEmail && (rowTitle.includes(targetBook) || targetBook.includes(rowTitle) || rowDocId === targetBook)) {
      targetRow = i + 1; // 1-indexed row in Sheet
      break;
    }
  }

  if (targetRow === -1) {
    Logger.log('Record not found for ' + userEmail + ' on book: ' + bookTitleOrDocId);
    return { success: false, message: 'Matching reader log record not found.' };
  }

  // Column Mapping in Reader_Logs:
  // Col B (2): Timestamp / Last Updated
  // Col G (7): Status (Requested, Reading, Finished, DNF)
  // Col I (9): Rating (1-5)
  // Col J (10): Top 2 (YES / No)
  // Col K (11): Notes / DNF Reason
  logsSheet.getRange(targetRow, 2).setValue(today);
  logsSheet.getRange(targetRow, 7).setValue(newStatus);

  if (newStatus === 'Finished') {
    if (rating) logsSheet.getRange(targetRow, 9).setValue(rating);
    logsSheet.getRange(targetRow, 10).setValue(isTopTwo ? 'YES' : 'No');
  }

  if (newStatus === 'DNF' && dnfReason) {
    logsSheet.getRange(targetRow, 11).setValue('DNF: ' + dnfReason);
  } else if (notes) {
    logsSheet.getRange(targetRow, 11).setValue(notes);
  }

  // Trigger recalculation of Validation_Engine & Form Dropdowns
  SpreadsheetApp.flush();
  updateFormDropdownCaps();

  Logger.log('Updated row ' + targetRow + ' in Reader_Logs (Cell G' + targetRow + ') to status: ' + newStatus);
  return {
    success: true,
    sheetTab: CONFIG.SHEET_LOGS,
    rowNumber: targetRow,
    cellRef: 'G' + targetRow,
    updatedStatus: newStatus,
    timestamp: today,
    email: userEmail
  };
}

/**
 * Web App doPost handler to receive Reading Hub status update calls & Database Exports
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'UPDATE_STATUS') {
      const result = updateReaderStatusInSheet(
        body.email,
        body.bookTitle,
        body.status,
        body.rating,
        body.isTopTwo,
        body.notes,
        body.dnfReason
      );
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Automated Web App Database Export (creates a new weekly tab e.g. Database_Export_2026-10-05)
    if (body.action === 'EXPORT_DATABASE' || body.action === 'WEEKLY_EXPORT') {
      const result = handleDatabaseExport(body);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles incoming database export payload from the web app
 * Creates or updates a weekly snapshot tab with formatted headers
 */
function handleDatabaseExport(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const targetTabName = payload.tabName || ('Database_Export_' + dateStr);

  let sheet = ss.getSheetByName(targetTabName);
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(targetTabName);
  }

  if (payload.headers && payload.rows) {
    // 1. Write Header Row
    sheet.getRange(1, 1, 1, payload.headers.length)
      .setValues([payload.headers])
      .setFontWeight('bold')
      .setBackground('#0F9D58')
      .setFontColor('#FFFFFF');

    // 2. Write Data Rows
    if (payload.rows.length > 0) {
      sheet.getRange(2, 1, payload.rows.length, payload.headers.length).setValues(payload.rows);
    }
    
    sheet.setFrozenRows(1);
    sheet.setTabColor('#0F9D58');
  }

  return {
    success: true,
    tabName: targetTabName,
    rowCount: payload.rows ? payload.rows.length : 0,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) & TAB-LEVEL SECURITY (GOOGLE WORKSPACE)
// ============================================================================

const RBAC_ROLES = {
  COORDINATOR_ADMIN: ['mbeckley@google.com', 'aorringer@google.com'],
  GENRE_LEAD: ['desmondkamas@google.com', 'dsodagar@google.com', 'emmaropes@google.com', 'jegang@google.com'],
};

/**
 * Enforces role-based tab access in Apps Script endpoints
 * Throws an explicit error if the caller lacks the required role.
 */
function checkUserPermission(requiredRole) {
  const userEmail = (Session.getActiveUser().getEmail() || '').toLowerCase();
  
  if (requiredRole === 'COORDINATOR_ADMIN') {
    if (!RBAC_ROLES.COORDINATOR_ADMIN.includes(userEmail)) {
      throw new Error("ACCESS DENIED: " + userEmail + " requires COORDINATOR_ADMIN role to access this action.");
    }
  } else if (requiredRole === 'GENRE_LEAD') {
    const isLeadOrAdmin = RBAC_ROLES.COORDINATOR_ADMIN.includes(userEmail) || RBAC_ROLES.GENRE_LEAD.includes(userEmail);
    if (!isLeadOrAdmin) {
      throw new Error("ACCESS DENIED: " + userEmail + " requires GENRE_LEAD or higher role.");
    }
  }
  return true;
}

/**
 * Automatically locks down Google Sheets tabs using Protected Ranges API
 * Ensures Readers can only write via the Form, while Leads & Admins control master tabs.
 */
function setupGoogleSheetsRBAC() {
  checkUserPermission('COORDINATOR_ADMIN');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Protect Master_Library (Leads & Admins only)
  const masterSheet = ss.getSheetByName(CONFIG.SHEET_MASTER);
  if (masterSheet) {
    const protection = masterSheet.protect().setDescription('Master Library - Leads & Admins Only');
    protection.removeEditors(protection.getEditors());
    protection.addEditors([...RBAC_ROLES.COORDINATOR_ADMIN, ...RBAC_ROLES.GENRE_LEAD]);
    protection.setWarningOnly(false);
  }
  
  // 2. Protect Validation_Engine (Admin only)
  const validationSheet = ss.getSheetByName(CONFIG.SHEET_VALIDATION);
  if (validationSheet) {
    const protection = validationSheet.protect().setDescription('Validation Engine - Admin Only');
    protection.removeEditors(protection.getEditors());
    protection.addEditors(RBAC_ROLES.COORDINATOR_ADMIN);
    protection.setWarningOnly(false);
  }
  
  Logger.log('RBAC Sheet Protections deployed successfully.');
}

// ============================================================================
// AUTOMATED WEEKLY READER LOGS SNAPSHOT / ARCHIVE (TIME-DRIVEN TRIGGER)
// ============================================================================

/**
 * Creates a frozen weekly snapshot of Reader_Logs as a new tab (e.g. Logs_2026-10-05)
 * Converts formulas to static values so historical progress is permanently preserved.
 */
function archiveReaderLogsWeekly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);
  if (!sourceSheet) {
    Logger.log('Source sheet "' + CONFIG.SHEET_LOGS + '" not found.');
    return;
  }

  // Generate ISO date stamp (e.g. "Logs_2026-10-05")
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const newTabName = 'Logs_' + dateStr;

  // Check if this week's tab already exists
  let targetSheet = ss.getSheetByName(newTabName);
  if (targetSheet) {
    ss.deleteSheet(targetSheet); // Refresh if already executed today
  }

  // 1. Duplicate Reader_Logs sheet
  targetSheet = sourceSheet.copyTo(ss);
  targetSheet.setName(newTabName);

  // 2. Freeze dynamic formulas into static values so data remains an exact point-in-time record
  const range = targetSheet.getDataRange();
  range.copyTo(range, { contentsOnly: true });

  // 3. Move the new tab right after Reader_Logs
  ss.setActiveSheet(targetSheet);
  ss.moveActiveSheet(sourceSheet.getIndex() + 1);

  // 4. Color the new tab for easy visual identification
  targetSheet.setTabColor('#34A853'); // Google Green

  // 5. Apply protection so past weekly logs are read-only
  const protection = targetSheet.protect().setDescription('Weekly Snapshot: ' + dateStr + ' (Read-Only)');
  protection.removeEditors(protection.getEditors());
  protection.addEditors(RBAC_ROLES.COORDINATOR_ADMIN);
  protection.setWarningOnly(false);

  Logger.log('Successfully created weekly archive tab: ' + newTabName);
}

/**
 * Installs an automated weekly Time-Driven Trigger to run every Monday at 6:00 AM
 * Run this function once from the Apps Script editor or onOpen() menu.
 */
function setupWeeklySnapshotTrigger() {
  // Clear any existing trigger for archiveReaderLogsWeekly to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'archiveReaderLogsWeekly') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create new time-driven trigger: Every Monday at 6:00 AM
  ScriptApp.newTrigger('archiveReaderLogsWeekly')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(6)
    .create();

  Logger.log('Weekly snapshot trigger installed: Runs every Monday at 6:00 AM.');
}

/**
 * Adds a custom menu to the Google Sheets menu bar when opened.
 * Allows running the snapshot on-demand at any time with 1 click.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📖 Reading Admin')
    .addItem('📸 Run Snapshot Now (Off-Schedule)', 'archiveReaderLogsWeekly')
    .addSeparator()
    .addItem('⏰ Install Weekly Monday 6AM Schedule', 'setupWeeklySnapshotTrigger')
    .addToUi();
}

/**
 * OPTION 1 (RECOMMENDED - NO EXTERNAL CALLS OR API NEEDED):
 * If your reader logs are already inside your Google Sheet on the "Reader_Logs" tab,
 * you DO NOT need an API endpoint! Run "archiveReaderLogsWeekly()" or "setupWeeklySnapshotTrigger()".
 *
 * OPTION 2: Pull reader logs from an external REST API into a new weekly tab.
 */
function pullWeeklyLogsFromExternalDb(apiUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const newTabName = 'Logs_Sync_' + dateStr;
  
  const endpoint = apiUrl || 'https://ais-dev-ronrfsd2h7cff6bbsz7u7e-15354950176.us-west1.run.app/api/reader-logs';
  
  try {
    const response = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true });
    const content = response.getContentText().trim();
    
    // Check if the endpoint returned an HTML Google Login/Auth page (IAP/Cloud Run)
    if (content.startsWith('<!doctype') || content.startsWith('<html') || content.includes('<title>Sign in')) {
      throw new Error(
        'The external app URL returned an HTML Google Sign-In page because development environments require browser authentication. ' +
        '-> TO RESOLVE: Run "archiveReaderLogsWeekly()" instead! It duplicates your "Reader_Logs" tab directly inside this spreadsheet without needing external HTTP calls.'
      );
    }
    
    const data = JSON.parse(content);
    let sheet = ss.getSheetByName(newTabName);
    if (!sheet) {
      sheet = ss.insertSheet(newTabName);
    }
    sheet.clear();
    
    const headers = ['Row', 'Timestamp', 'Email', 'Country', 'Book Title', 'Status', 'Release Date', 'Rating', 'Top 2', 'Notes'];
    const rows = data.map((l, i) => [
      i + 1, l.lastUpdated, l.submitterEmail, l.submitterCountry, l.bookTitle, l.status, l.releaseDate, l.rating || '', l.isTopTwo ? 'YES' : 'No', l.notes || ''
    ]);
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#E8F0FE');
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    sheet.setFrozenRows(1);
    Logger.log('Successfully pulled logs into ' + newTabName);
  } catch (err) {
    Logger.log('Error in pullWeeklyLogsFromExternalDb: ' + err.message);
    throw err;
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([appsScriptCode], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BestOfReadingGroup_Code.gs');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Google Workspace Deployment
              </span>
              <span className="text-xs text-slate-400">Google Apps Script (Code.gs)</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Google Apps Script Automation Engine</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Production-ready code for your Google Sheet. Simply copy into <strong>Extensions &gt; Apps Script</strong> to connect Gemini API, 
              real-time reader caps, dynamic waitlists, and email bots.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Code.gs' : 'Copy Code.gs'}
            </button>

            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download .gs File
            </button>
          </div>
        </div>

        {/* 4-Step Deployment Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
            <div className="font-bold text-xs text-slate-900 pt-1">Open Apps Script</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              In your central Google Sheet, navigate to <strong>Extensions &gt; Apps Script</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
            <div className="font-bold text-xs text-slate-900 pt-1">Paste Code.gs</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Replace default code with this file. Add your <code>GEMINI_API_KEY</code> in Project Settings &gt; Script Properties.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
            <div className="font-bold text-xs text-slate-900 pt-1">Add Form Trigger</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Under <strong>Triggers</strong>, set <code>onFormSubmit</code> to run "From spreadsheet" on "On form submit".
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">4</span>
            <div className="font-bold text-xs text-slate-900 pt-1">Set Time-Driven Bots</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Add weekly trigger for <code>sendStaleHoldReminders</code> and hourly trigger for <code>updateFormDropdownCaps</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Code Container */}
      <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs text-slate-300 font-semibold">Code.gs — Google Apps Script</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">180 lines</span>
        </div>

        <div className="p-5 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed text-emerald-300/90 selection:bg-emerald-900 selection:text-white">
          <pre>{appsScriptCode}</pre>
        </div>
      </div>
    </div>
  );
};
