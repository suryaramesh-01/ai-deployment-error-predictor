import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, FileCode, ArrowRight, HelpCircle } from 'lucide-react';
import { SeverityBadge, TypeBadge } from './SeverityBadge';

export const CodeDiffModal = ({ issue, isOpen, onClose, onStatusChange }) => {
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!isOpen || !issue) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkResolved = async () => {
    setUpdatingStatus(true);
    try {
      await onStatusChange(issue._id, issue.status === 'Resolved' ? 'Open' : 'Resolved');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn text-[#302B43]">
      <div className="bg-white border border-[#E7E2F0] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2F0] bg-[#FAF8FF]">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <SeverityBadge severity={issue.severity} />
              <TypeBadge type={issue.type} />
              <span className="text-xs font-mono font-semibold text-[#6A6282] bg-white px-2 py-0.5 rounded border border-[#E7E2F0]">
                {issue.file}{issue.line ? ` (Line ${issue.line})` : ''}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#302B43]">{issue.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6A6282] hover:text-[#302B43] hover:bg-[#F5F3FF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">

          {/* Simple Explanation & Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FDF2F4] border border-[#F9CAD2] rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-[#B82B46] text-xs font-bold uppercase tracking-wider mb-1.5">
                <HelpCircle className="w-4 h-4 text-rose-500" />
                <span>What Is The Problem?</span>
              </div>
              <p className="text-xs sm:text-sm text-[#302B43] leading-relaxed font-medium">{issue.why || 'Configuration or syntax mismatch.'}</p>
            </div>

            <div className="bg-[#FFF9EB] border border-[#FDE3A7] rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-[#A66D14] text-xs font-bold uppercase tracking-wider mb-1.5">
                <ArrowRight className="w-4 h-4 text-amber-500" />
                <span>Why Deployment Will Fail</span>
              </div>
              <p className="text-xs sm:text-sm text-[#302B43] leading-relaxed font-medium">{issue.impact || 'Will crash your container on launch.'}</p>
            </div>
          </div>

          {/* Step-by-Step Clear Guide */}
          <div className="bg-[#FAF8FF] border border-[#E7E2F0] rounded-2xl p-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#302B43] mb-2 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#8B78C6]" />
              <span>How to Clear This Error (Step-by-Step)</span>
            </h4>
            {issue.troubleshootingSteps && issue.troubleshootingSteps.length > 0 ? (
              <ol className="space-y-2 text-xs sm:text-sm text-[#302B43] list-decimal list-inside font-medium">
                {issue.troubleshootingSteps.map((step, idx) => (
                  <li key={idx} className="pl-1 leading-relaxed">
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs sm:text-sm text-[#302B43] font-medium">{issue.solution}</p>
            )}
          </div>

          {/* Side-by-Side Code Comparison */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-[#8B78C6]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#302B43]">
                  Code Replacement Preview
                </span>
              </div>
              {issue.suggestedFix && (
                <button
                  onClick={() => handleCopy(issue.suggestedFix)}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#4D3E7B] hover:text-[#302B43] bg-[#E9E2FF] hover:bg-[#D9CFFF] border border-[#D9CFFF] px-3 py-1 rounded-xl font-bold transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Replacement Code'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Current code */}
              <div className="border border-[#F9CAD2] bg-[#FDF2F4] rounded-2xl p-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F9CAD2] font-sans font-bold text-[#B82B46] text-xs">
                  <span>Currently in Your File</span>
                  <span className="text-[10px] bg-white text-[#B82B46] px-1.5 py-0.5 rounded font-bold border border-[#F9CAD2]">Error</span>
                </div>
                <pre className="text-[#881337] whitespace-pre-wrap overflow-x-auto flex-1 font-mono p-2 bg-white rounded-xl border border-[#F9CAD2]">
                  {issue.originalCode || '// Line missing or missing declaration'}
                </pre>
              </div>

              {/* Suggested fix */}
              <div className="border border-[#D9CFFF] bg-[#FAF8FF] rounded-2xl p-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E7E2F0] font-sans font-bold text-[#4D3E7B] text-xs">
                  <span>Replace With This (Fixed)</span>
                  <span className="text-[10px] bg-[#E9E2FF] text-[#4D3E7B] px-1.5 py-0.5 rounded font-bold border border-[#D9CFFF]">Deploy Ready</span>
                </div>
                <pre className="text-[#4D3E7B] whitespace-pre-wrap overflow-x-auto flex-1 font-mono p-2 bg-white rounded-xl border border-[#E7E2F0] font-semibold">
                  {issue.suggestedFix || issue.solution}
                </pre>
              </div>
            </div>
          </div>

          {/* Reassurance */}
          <div className="p-3 bg-[#FAF8FF] border border-[#E7E2F0] rounded-xl text-xs text-[#6A6282]">
            💡 <strong className="text-[#302B43]">Safe Pre-Deployment Check:</strong> We never change your project files automatically. Copy the fix, update your code locally, and you are ready for a clean deployment!
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E7E2F0] bg-[#FAF8FF] flex items-center justify-between">
          <div className="text-xs text-[#6A6282]">
            Status: <span className="font-bold text-[#302B43]">{issue.status === 'Resolved' ? 'Cleared ✅' : 'Needs Fix'}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#6A6282] hover:text-[#302B43] bg-white hover:bg-[#F5F3FF] border border-[#E7E2F0] rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleMarkResolved}
              disabled={updatingStatus}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
                issue.status === 'Resolved'
                  ? 'bg-[#FAF8FF] hover:bg-[#E9E2FF] text-[#4D3E7B] border border-[#E7E2F0]'
                  : 'bg-[#8B78C6] hover:bg-[#7865B3] text-white shadow-sm shadow-[#8B78C6]/25'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{issue.status === 'Resolved' ? 'Reopen This Error' : 'I Have Cleared This Error'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
