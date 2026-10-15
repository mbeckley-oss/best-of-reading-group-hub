import React, { useState, useMemo } from 'react';
import { GTechBatchItem, GenreGroup } from '../types';
import { 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Send, 
  Globe2, 
  Mail, 
  CheckCircle2, 
  Filter,
  Heart,
  Rocket,
  Palette
} from 'lucide-react';

interface GTechPipelineProps {
  batchItems: GTechBatchItem[];
  onMarkBatchSubmitted: () => void;
  selectedGenreGroup: GenreGroup;
  onSelectGenreGroup: (group: GenreGroup) => void;
}

export const GTechPipeline: React.FC<GTechPipelineProps> = ({
  batchItems,
  onMarkBatchSubmitted,
  selectedGenreGroup,
  onSelectGenreGroup,
}) => {
  const [copied, setCopied] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedGenreGroup === 'All Genres') return batchItems;
    return batchItems.filter(b => b.genreGroup === selectedGenreGroup);
  }, [batchItems, selectedGenreGroup]);

  const pendingCount = filteredItems.filter(b => b.status === 'Pending Batch').length;
  const fulfilledCount = filteredItems.filter(b => b.status === 'Fulfilled').length;

  const generateCsvContent = () => {
    const headers = [
      'Submitter_Email',
      'Submitter_Country',
      'LDAP',
      'DocID',
      'Bibkey_ISBN',
      'Book_Title',
      'Genre_Group',
      'Release_Date',
      'Format',
      'Request_Date',
      'Priority',
      'Status'
    ];
    const rows = filteredItems.map(item => [
      item.email,
      `"${item.country}"`,
      item.ldap,
      item.docId,
      item.bibkey,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.genreGroup}"`,
      item.releaseDate,
      item.format,
      item.requestDate,
      item.priority,
      item.status,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleDownloadCsv = () => {
    const csvData = generateCsvContent();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedGenre = selectedGenreGroup.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `gTech_Fulfillment_${sanitizedGenre}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = () => {
    const csvData = generateCsvContent();
    navigator.clipboard.writeText(csvData);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmitBuganizer = () => {
    onMarkBatchSubmitted();
    setSubmittedStatus(`Fulfillment batch for ${selectedGenreGroup} submitted to Buganizer queue with captured Emails & Countries!`);
    setTimeout(() => setSubmittedStatus(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                gTech Buganizer Pipeline
              </span>
              <span className="text-xs text-slate-400">Captures Email, Country, Release Date &amp; Status</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Fulfillment CSV Pipeline</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Filtered for <strong>{selectedGenreGroup}</strong>. Ready for Buganizer batch upload with regional Play store license routing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyClipboard}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied CSV' : 'Copy CSV'}
            </button>

            <button
              onClick={handleDownloadCsv}
              className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .CSV
            </button>

            <button
              onClick={handleSubmitBuganizer}
              disabled={pendingCount === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Batch ({pendingCount} Pending)
            </button>
          </div>
        </div>

        {/* Genre Group Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-b border-slate-100 pb-4">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Genre Batch Filter:
          </span>
          {(['All Genres', 'Romance & YA', 'Science Fiction & Fantasy', 'Comics & Manga'] as GenreGroup[]).map(g => (
            <button
              key={g}
              onClick={() => onSelectGenreGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedGenreGroup === g
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70">
            <div className="text-xs font-semibold text-amber-800">Pending Requests</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">{pendingCount} requests</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Ready for next Buganizer submission</div>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/70">
            <div className="text-xs font-semibold text-emerald-800">Fulfilled Licenses</div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{fulfilledCount} completed</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Delivered to reader Play Books accounts</div>
          </div>

          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/70">
            <div className="text-xs font-semibold text-blue-800">Global Offices Included</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {new Set(filteredItems.map(i => i.country)).size} Countries
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">Capturing country for regional licensing</div>
          </div>
        </div>
      </div>

      {submittedStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{submittedStatus}</p>
        </div>
      )}

      {/* Batch Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Current Fulfillment Batch Items ({selectedGenreGroup})
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {filteredItems.length} requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Submitter Email</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Genre Group</th>
                <th className="py-2.5 px-3">DocID</th>
                <th className="py-2.5 px-3">Release Date</th>
                <th className="py-2.5 px-3 text-center">Format</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-blue-700">
                    {item.email}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    <span className="inline-flex items-center gap-1">
                      <Globe2 className="w-3 h-3 text-slate-400" />
                      {item.country}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {item.title}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.genreGroup === 'Romance & YA'
                        ? 'bg-pink-100 text-pink-800'
                        : item.genreGroup === 'Science Fiction & Fantasy'
                        ? 'bg-indigo-100 text-indigo-800'
                        : item.genreGroup === 'Comics & Manga'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {item.genreGroup}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.docId}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.releaseDate}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.format === 'Audiobook' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.format}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.status === 'Fulfilled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Submitted to Buganizer'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
