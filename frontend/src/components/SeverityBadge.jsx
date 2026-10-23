import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const SeverityBadge = ({ severity, size = 'sm' }) => {
  const styles = {
    Critical: 'bg-[#FDF2F4] text-[#B82B46] border-[#F9CAD2]',
    High: 'bg-[#FFF9EB] text-[#A66D14] border-[#FDE3A7]',
    Medium: 'bg-[#E9E2FF] text-[#4D3E7B] border-[#D9CFFF]',
    Low: 'bg-[#FAF8FF] text-[#6A6282] border-[#E7E2F0]',
  };

  const icons = {
    Critical: <AlertCircle className={size === 'sm' ? 'w-3.5 h-3.5 mr-1 text-rose-600' : 'w-4 h-4 mr-1.5 text-rose-600'} />,
    High: <AlertTriangle className={size === 'sm' ? 'w-3.5 h-3.5 mr-1 text-amber-600' : 'w-4 h-4 mr-1.5 text-amber-600'} />,
    Medium: <Info className={size === 'sm' ? 'w-3.5 h-3.5 mr-1 text-[#8B78C6]' : 'w-4 h-4 mr-1.5 text-[#8B78C6]'} />,
    Low: <Info className={size === 'sm' ? 'w-3.5 h-3.5 mr-1 text-[#6A6282]' : 'w-4 h-4 mr-1.5 text-[#6A6282]'} />,
  };

  const activeStyle = styles[severity] || styles.Medium;
  const icon = icons[severity] || icons.Medium;

  return (
    <span className={`inline-flex items-center font-bold rounded-full border px-2.5 py-0.5 text-xs ${activeStyle}`}>
      {icon}
      {severity}
    </span>
  );
};

export const TypeBadge = ({ type }) => {
  const isConfirmed = type === 'Confirmed Error';
  return (
    <span className={`inline-flex items-center font-bold rounded-full border px-2.5 py-0.5 text-xs ${
      isConfirmed
        ? 'bg-[#FDF2F4] text-[#B82B46] border-[#F9CAD2]'
        : 'bg-[#E9E2FF] text-[#4D3E7B] border-[#D9CFFF]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isConfirmed ? 'bg-rose-600' : 'bg-[#8B78C6]'}`}></span>
      {isConfirmed ? 'Definite Error' : 'Deployment Risk'}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    'Open': 'bg-[#FDF2F4] text-[#B82B46] border-[#F9CAD2]',
    'In Progress': 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    'Resolved': 'bg-[#EEFBF4] text-[#1E7E52] border-[#C6EFDA]',
    'Reopened': 'bg-[#E9E2FF] text-[#4D3E7B] border-[#D9CFFF]',
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-lg border px-2.5 py-0.5 text-xs ${styles[status] || styles.Open}`}>
      {status === 'Resolved' && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#1E7E52]" />}
      {status === 'Resolved' ? 'Cleared' : status === 'In Progress' ? 'In Progress' : 'Needs Fix'}
    </span>
  );
};
