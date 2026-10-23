import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileCode,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import api from '../api/client';
import { SeverityBadge, TypeBadge, StatusBadge } from '../components/SeverityBadge';
import { TaskModal } from '../components/TaskModal';

export const IssueDetailsPage = () => {
  const { issueId } = useParams();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchIssue = async () => {
    try {
      const res = await api.get(`/issues/${issueId}`);
      if (res.data.success) {
        setIssue(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusToggle = async () => {
    const nextStatus = issue.status === 'Resolved' ? 'Open' : 'Resolved';
    try {
      const res = await api.put(`/issues/${issueId}/status`, { status: nextStatus });
      if (res.data.success) {
        setIssue(res.data.data);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleRegenerateAi = async () => {
    setRegenerating(true);
    try {
      const res = await api.post(`/issues/${issueId}/ai-explain`);
      if (res.data.success) {
        setIssue(res.data.data);
      }
    } catch (err) {
      alert('Failed to regenerate AI guidance: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#6A6282]">Loading error details...</div>;
  }

  if (!issue) {
    return <div className="p-12 text-center text-xs text-rose-600 font-bold">Error not found.</div>;
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-[#6A6282] mb-1">
          <Link to="/projects" className="hover:text-[#8B78C6] font-bold">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${issue.project?._id}`} className="hover:text-[#8B78C6] font-bold">
            {issue.project?.name || 'Project'}
          </Link>
          <span>/</span>
          <span className="text-[#302B43] font-extrabold">Error Details</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <SeverityBadge severity={issue.severity} />
              <TypeBadge type={issue.type} />
              <span className="text-xs font-mono font-bold text-[#302B43] bg-[#FAF8FF] px-2.5 py-0.5 rounded border border-[#E7E2F0]">
                {issue.file}:{issue.line || 1}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#302B43]">{issue.title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-[#302B43] hover:text-[#8B78C6] bg-white hover:bg-[#FAF8FF] border border-[#E7E2F0] rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#8B78C6]" />
              <span>Create Task</span>
            </button>

            <button
              onClick={handleStatusToggle}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                issue.status === 'Resolved'
                  ? 'bg-[#EEFBF4] text-[#1E7E52] border border-[#C6EFDA]'
                  : 'bg-[#8B78C6] hover:bg-[#7865B3] text-white shadow-[#8B78C6]/25'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{issue.status === 'Resolved' ? 'Reopen Error' : 'Mark as Cleared'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Why & Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-[#B82B46] text-xs font-extrabold uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4 text-rose-500" />
            <span>What Went Wrong</span>
          </div>
          <p className="text-xs sm:text-sm text-[#302B43] leading-relaxed font-medium">{issue.why}</p>
        </div>

        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-[#A66D14] text-xs font-extrabold uppercase tracking-wider mb-2">
            <ArrowRight className="w-4 h-4 text-amber-500" />
            <span>Why Deployment Will Fail</span>
          </div>
          <p className="text-xs sm:text-sm text-[#302B43] leading-relaxed font-medium">{issue.impact}</p>
        </div>
      </div>

      {/* Side-by-Side Code Diff Card */}
      <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-[#8B78C6]" />
            <h3 className="text-sm font-extrabold text-[#302B43]">Code Fix & Replacement</h3>
          </div>

          {issue.suggestedFix && (
            <button
              onClick={() => handleCopy(issue.suggestedFix)}
              className="px-3 py-1 text-xs font-bold text-[#4D3E7B] hover:text-[#302B43] bg-[#E9E2FF] hover:bg-[#D9CFFF] border border-[#D9CFFF] rounded-xl transition flex items-center space-x-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Replacement Code'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Current code */}
          <div className="bg-[#FDF2F4] border border-[#F9CAD2] rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F9CAD2] font-sans text-[#B82B46] font-bold">
              <span>Currently in Your File</span>
              <span className="text-[10px] bg-white text-[#B82B46] px-1.5 py-0.5 rounded font-bold border border-[#F9CAD2]">Hazard</span>
            </div>
            <pre className="text-[#881337] whitespace-pre-wrap overflow-x-auto flex-1 p-2 bg-white rounded-lg border border-[#F9CAD2]">
              {issue.originalCode || '// Line missing or missing declaration'}
            </pre>
          </div>

          {/* Corrected code */}
          <div className="bg-[#FAF8FF] border border-[#D9CFFF] rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E7E2F0] font-sans text-[#4D3E7B] font-bold">
              <span>Replace With This (Fixed)</span>
              <span className="text-[10px] bg-[#E9E2FF] text-[#4D3E7B] px-1.5 py-0.5 rounded font-bold border border-[#D9CFFF]">Deploy Ready</span>
            </div>
            <pre className="text-[#4D3E7B] whitespace-pre-wrap overflow-x-auto flex-1 p-2 bg-white rounded-lg border border-[#E7E2F0] font-bold">
              {issue.suggestedFix || issue.solution}
            </pre>
          </div>
        </div>
      </div>

      {/* AI Explanation & Troubleshooting Guide */}
      <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#302B43] flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#8B78C6]" />
            <span>Step-by-Step Remediation Plan</span>
          </h3>

          <button
            onClick={handleRegenerateAi}
            disabled={regenerating}
            className="text-xs font-bold text-[#6A6282] hover:text-[#8B78C6] flex items-center space-x-1 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{regenerating ? 'Regenerating...' : 'Regenerate Guidance'}</span>
          </button>
        </div>

        {issue.troubleshootingSteps && issue.troubleshootingSteps.length > 0 ? (
          <ol className="space-y-2 text-xs sm:text-sm text-[#302B43] list-decimal list-inside font-medium">
            {issue.troubleshootingSteps.map((s, idx) => (
              <li key={idx} className="pl-1 leading-relaxed">
                <span>{s}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs sm:text-sm text-[#302B43] leading-relaxed">{issue.solution}</p>
        )}

        {issue.bestPractices && issue.bestPractices.length > 0 && (
          <div className="pt-3 border-t border-[#E7E2F0]">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#302B43] mb-2">
              Best Practices to Prevent Recurrence
            </h4>
            <ul className="space-y-1.5 text-xs text-[#6A6282] font-medium">
              {issue.bestPractices.map((bp, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8B78C6] shrink-0 mt-0.5" />
                  <span>{bp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projectId={issue.project?._id}
          issue={issue}
          onTaskCreated={() => {
            fetchIssue();
          }}
        />
      )}

    </div>
  );
};
