import React from 'react';
import { Check, AlertTriangle, Clock, X, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  const norm = status.toLowerCase();

  if (norm.includes('verif') || norm === 'passed' || norm === 'compliant' || norm === 'approved') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#eaf7ec] text-[#1b7332] border border-[#c6ebd0] ${className}`}>
        {showIcon && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        {status.includes('Verified') ? 'Verified' : status}
      </span>
    );
  }

  if (norm.includes('mismatch')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fdeeee] text-[#be2335] border border-[#f8c8cb] ${className}`}>
        {showIcon && <span className="text-[10px] font-bold">▲</span>}
        {status}
      </span>
    );
  }

  if (norm.includes('anomal')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fdeeee] text-[#be2335] border border-[#f8c8cb] ${className}`}>
        {showIcon && <span className="text-[10px] font-bold">▲</span>}
        {status}
      </span>
    );
  }

  if (norm.includes('expir')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fff0ec] text-[#b93f24] border border-[#fcd5cb] ${className}`}>
        {showIcon && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
        {status}
      </span>
    );
  }

  if (norm.includes('pending') || norm.includes('checking') || norm.includes('queue')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fff8e6] text-[#976800] border border-[#fde8ad] ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5" />}
        {status}
      </span>
    );
  }

  if (norm.includes('manual') || norm.includes('review') || norm.includes('missing')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e8f1f5] text-[#195a73] border border-[#cbe1ec] ${className}`}>
        {showIcon && <AlertCircle className="w-3.5 h-3.5" />}
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 ${className}`}>
      {status}
    </span>
  );
};
