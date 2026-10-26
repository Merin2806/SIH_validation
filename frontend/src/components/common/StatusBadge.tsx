import React from 'react';
import { Check, Clock, X, AlertTriangle, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  const norm = (status || '').toLowerCase();

  // Green: Verified / Passed / Approved
  if (norm.includes('verif') || norm === 'passed' || norm === 'compliant' || norm === 'approved' || norm === 'clear to proceed') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EBF9F1] text-[#166534] border border-[#BBF7D0] shadow-2xs ${className}`}>
        {showIcon && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        <span>{status.includes('Verified') ? 'Verified' : status}</span>
      </span>
    );
  }

  // Red: Mismatch / Anomaly / Forgery / Rejected
  if (norm.includes('mismatch') || norm.includes('anomal') || norm.includes('fake') || norm.includes('rejected')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] shadow-2xs ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />}
        <span>{status}</span>
      </span>
    );
  }

  // Orange/Red: Expired
  if (norm.includes('expir')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] shadow-2xs ${className}`}>
        {showIcon && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
        <span>{status}</span>
      </span>
    );
  }

  // Amber/Yellow: Pending / In Queue / Checking
  if (norm.includes('pending') || norm.includes('checking') || norm.includes('queue')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] shadow-2xs ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5" />}
        <span>{status}</span>
      </span>
    );
  }

  // Ultraviolet: AI Processing / OCR / Active Analysis
  if (norm.includes('ocr') || norm.includes('extract') || norm.includes('processing') || norm.includes('analysis')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0EBFF] text-[#6F3DFF] border border-[#D5C2FF] shadow-2xs ${className}`}>
        {showIcon && <Sparkles className="w-3.5 h-3.5" />}
        <span>{status}</span>
      </span>
    );
  }

  // Glacier Blue: Manual Review / Missing
  if (norm.includes('manual') || norm.includes('review') || norm.includes('missing')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF8FF] text-[#0369A1] border border-[#BAE6FD] shadow-2xs ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5" />}
        <span>{status}</span>
      </span>
    );
  }

  // Default Mineral Grey: Inactive / Unknown
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F2F3F5] text-[#484A54] border border-[#E3E5EC] ${className}`}>
      {status}
    </span>
  );
};
