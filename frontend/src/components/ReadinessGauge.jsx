import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const ReadinessGauge = ({ score = 0, size = 180, passedChecks = 0, criticalCount = 0 }) => {
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (normalizedScore / 100) * circumference;

  let color = '#E11D48'; // Rose
  let statusText = 'Critical Errors Need Clearing';
  let badgeClass = 'text-[#B82B46] bg-[#FDF2F4] border-[#F9CAD2]';

  if (normalizedScore >= 80) {
    color = '#10B981'; // Emerald
    statusText = 'Ready to Deploy!';
    badgeClass = 'text-[#1E7E52] bg-[#EEFBF4] border-[#C6EFDA]';
  } else if (normalizedScore >= 50) {
    color = '#F59E0B'; // Amber
    statusText = 'Some Fixes Needed';
    badgeClass = 'text-[#A66D14] bg-[#FFF9EB] border-[#FDE3A7]';
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E7E2F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight text-[#302B43]">
            {normalizedScore}
            <span className="text-sm font-semibold text-[#6A6282]">/100</span>
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#6A6282] font-bold">Deployment Score</span>
        </div>
      </div>

      <div className={`mt-3 inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${badgeClass}`}>
        {normalizedScore >= 80 ? (
          <ShieldCheck className="w-4 h-4 mr-1.5 text-[#10B981]" />
        ) : (
          <AlertOctagon className="w-4 h-4 mr-1.5 text-rose-600" />
        )}
        {statusText}
      </div>

      <div className="mt-4 flex items-center justify-between w-full max-w-xs text-xs text-[#302B43] bg-[#FAF8FF] rounded-xl p-2.5 border border-[#E7E2F0]">
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-[#302B43]">{passedChecks} Checks Passed</span>
        </div>
        <div className="h-4 w-px bg-[#E7E2F0]"></div>
        <div className="flex items-center space-x-1.5">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <span className="font-semibold text-rose-600">{criticalCount} Errors to Clear</span>
        </div>
      </div>
    </div>
  );
};
