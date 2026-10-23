import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Search,
  Download,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { ReadinessGauge } from '../components/ReadinessGauge';
import { SeverityBadge, TypeBadge } from '../components/SeverityBadge';
import { CodeDiffModal } from '../components/CodeDiffModal';

export const AnalysisResultsPage = () => {
  const { analysisId } = useParams();

  const [data, setData] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Filter
  const [filterType, setFilterType] = useState('All'); // All, Critical, High, Cleared
  const [search, setSearch] = useState('');

  // Modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  const fetchAnalysis = async () => {
    try {
      const res = await api.get(`/projects/analyses/${analysisId}`);
      if (res.data.success) {
        setData(res.data.data.analysis);
        setIssues(res.data.data.issues);

        if (res.data.data.analysis.readinessScore >= 80) {
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [analysisId]);

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const res = await api.put(`/issues/${issueId}/status`, { status: newStatus });
      if (res.data.success) {
        setIssues(issues.map(i => i._id === issueId ? res.data.data : i));
        if (selectedIssue && selectedIssue._id === issueId) {
          setSelectedIssue(res.data.data);
        }
        if (newStatus === 'Resolved') {
          confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
        }
      }
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const handleCopyCode = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#6A6282] flex flex-col items-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#8B78C6] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-semibold">Checking code and preparing step-by-step fix guides...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center text-xs text-rose-600 font-bold">
        {error || 'Scan results not found'}
      </div>
    );
  }

  const { project, metrics, readinessScore } = data;

  const filteredIssues = issues.filter((i) => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
                          i.file.toLowerCase().includes(search.toLowerCase()) ||
                          i.why.toLowerCase().includes(search.toLowerCase());
    if (filterType === 'Critical') return matchesSearch && i.severity === 'Critical' && i.status !== 'Resolved';
    if (filterType === 'High') return matchesSearch && i.severity === 'High' && i.status !== 'Resolved';
    if (filterType === 'Cleared') return matchesSearch && i.status === 'Resolved';
    return matchesSearch;
  });

  const criticalOpenCount = issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length;
  const clearedCount = issues.filter(i => i.status === 'Resolved').length;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#6A6282] mb-1">
            <Link to="/upload" className="hover:text-[#8B78C6] font-medium">Upload ZIP</Link>
            <span>/</span>
            <span className="text-[#302B43] font-bold">{project?.name || 'Scan Results'}</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#302B43] flex items-center space-x-2">
            <span>Errors Found & How to Clear Them</span>
          </h1>
          <p className="text-xs text-[#6A6282] mt-0.5">
            Archive: <span className="font-mono text-[#302B43] font-semibold">{data.zipFileName || 'project.zip'}</span> • Target: {project?.deploymentPlatform || 'Docker'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/upload"
            className="px-3.5 py-2 text-xs font-bold text-[#302B43] bg-white hover:bg-[#FAF8FF] border border-[#E7E2F0] rounded-xl transition flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#6A6282]" />
            <span>Upload Another ZIP</span>
          </Link>

          <a
            href={`/api/reports/project/${project?._id}/analysis/${data._id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl transition flex items-center space-x-1.5 shadow-sm shadow-[#8B78C6]/25"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* Top Clean Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm">
        
        {/* Score Meter */}
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E7E2F0] pb-6 md:pb-0 md:pr-6">
          <ReadinessGauge
            score={readinessScore}
            size={160}
            passedChecks={metrics?.passedChecks || 0}
            criticalCount={criticalOpenCount}
          />
        </div>

        {/* Human explanation */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${criticalOpenCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              <h3 className="text-base font-extrabold text-[#302B43]">
                {criticalOpenCount > 0
                  ? `${criticalOpenCount} Critical error(s) must be cleared before deployment`
                  : 'Great job! No critical blockers detected.'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#6A6282] leading-relaxed font-medium">
              {data.scoreExplanation}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-[#FAF8FF] rounded-2xl border border-[#E7E2F0] text-xs">
            <div>
              <span className="text-[10px] text-[#6A6282] uppercase font-bold block">Total Errors</span>
              <span className="text-lg font-extrabold text-[#302B43]">{issues.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-rose-600 uppercase font-bold block">Must Fix</span>
              <span className="text-lg font-extrabold text-rose-600">{criticalOpenCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#1E7E52] uppercase font-bold block">Cleared By You</span>
              <span className="text-lg font-extrabold text-[#1E7E52]">{clearedCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'All', label: `All Errors (${issues.length})` },
            { id: 'Critical', label: `Critical (${issues.filter(i => i.severity === 'Critical').length})` },
            { id: 'High', label: `High Risk (${issues.filter(i => i.severity === 'High').length})` },
            { id: 'Cleared', label: `Cleared (${clearedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#8B78C6] text-white shadow-xs'
                  : 'bg-white text-[#6A6282] hover:text-[#302B43] hover:bg-[#FAF8FF] border border-[#E7E2F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#6A6282] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search error title or file..."
            className="w-full bg-white border border-[#E7E2F0] focus:border-[#8B78C6] focus:ring-1 focus:ring-[#8B78C6] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#302B43] placeholder-[#A29BB8] outline-none transition"
          />
        </div>
      </div>

      {/* Error Cards with Step-by-Step Fixes */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="bg-white border border-[#E7E2F0] rounded-3xl p-12 text-center text-xs text-[#6A6282]">
            No errors match the current filter.
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isResolved = issue.status === 'Resolved';

            return (
              <div
                key={issue._id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition space-y-4 ${
                  isResolved ? 'border-[#C6EFDA] bg-[#EEFBF4]/40' : 'border-[#E7E2F0] hover:border-[#8B78C6]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <TypeBadge type={issue.type} />
                    <span className="font-mono text-xs text-[#302B43] bg-[#FAF8FF] px-2.5 py-0.5 rounded-md font-bold border border-[#E7E2F0]">
                      {issue.file}{issue.line ? ` : line ${issue.line}` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => handleStatusChange(issue._id, isResolved ? 'Open' : 'Resolved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer ${
                      isResolved
                        ? 'bg-[#EEFBF4] text-[#1E7E52] hover:bg-[#D5F5E3] border border-[#C6EFDA]'
                        : 'bg-[#FAF8FF] text-[#302B43] hover:bg-[#8B78C6] hover:text-white border border-[#E7E2F0]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isResolved ? 'Cleared ✅ (Click to Reopen)' : 'Mark as Cleared'}</span>
                  </button>
                </div>

                {/* Error Title */}
                <div>
                  <h3 className={`text-base font-extrabold ${isResolved ? 'line-through text-[#A29BB8]' : 'text-[#302B43]'}`}>
                    {issue.title}
                  </h3>
                </div>

                {/* What happened & Why it breaks deployment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF8FF] border border-[#E7E2F0]">
                    <span className="text-[10px] font-bold uppercase text-[#6A6282] block mb-1">
                      What is the error?
                    </span>
                    <p className="text-[#302B43] leading-relaxed font-medium">{issue.why}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8FF] border border-[#E7E2F0]">
                    <span className="text-[10px] font-bold uppercase text-[#A66D14] block mb-1">
                      Why deployment will fail:
                    </span>
                    <p className="text-[#302B43] leading-relaxed font-medium">{issue.impact}</p>
                  </div>
                </div>

                {/* How to Clear This Error - Clear Steps */}
                <div className="p-3.5 rounded-xl bg-[#E9E2FF]/30 border border-[#D9CFFF] text-xs">
                  <span className="text-[11px] font-extrabold text-[#4D3E7B] uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#8B78C6]" />
                    <span>How to Clear This Error:</span>
                  </span>
                  <p className="text-[#302B43] font-medium leading-relaxed mb-2">
                    {issue.solution}
                  </p>

                  {/* Code Replacement Box if available */}
                  {issue.suggestedFix && (
                    <div className="mt-2 pt-2 border-t border-[#D9CFFF]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#4D3E7B] uppercase font-mono">
                          Replace affected code with:
                        </span>
                        <button
                          onClick={() => handleCopyCode(issue.suggestedFix, issue._id)}
                          className="text-[11px] font-bold text-[#4D3E7B] hover:text-[#302B43] bg-white px-2.5 py-0.5 rounded-lg border border-[#D9CFFF] transition flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedId === issue._id ? <Check className="w-3 h-3 text-[#1E7E52]" /> : <Copy className="w-3 h-3 text-[#8B78C6]" />}
                          <span>{copiedId === issue._id ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-white rounded-xl border border-[#D9CFFF] font-mono text-[11px] text-[#4D3E7B] overflow-x-auto whitespace-pre-wrap font-semibold">
                        {issue.suggestedFix}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Details link */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => { setSelectedIssue(issue); setIsDiffModalOpen(true); }}
                    className="text-xs font-bold text-[#8B78C6] hover:text-[#7865B3] flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <span>View Side-by-Side Original vs Fixed Comparison</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Code Diff Modal */}
      <CodeDiffModal
        issue={selectedIssue}
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        onStatusChange={handleStatusChange}
      />

    </div>
  );
};
