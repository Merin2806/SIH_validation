import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface DisclaimerBannerProps {
  text?: string;
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ 
  text = "AI-generated flags are preliminary decision-support outputs. Statutory scrutiny, physical inspection and every final regulatory decision remain with authorised AICTE officials.",
  className = ""
}) => {
  return (
    <div className={`flex items-start sm:items-center gap-3.5 px-5 py-3.5 bg-gradient-to-r from-[#EAF8FF] via-[#F0EBFF] to-[#EAF8FF] border-2 border-[#BFE9FF] rounded-2xl text-xs text-[#171827] shadow-sm ${className}`}>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6F3DFF] to-[#BFE9FF] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 text-white shadow-xs">
        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
      </div>
      <div className="flex-1">
        <span className="font-bold text-[#1E0B54] mr-1.5 uppercase text-[10px] tracking-wider bg-[#BFE9FF]/60 px-2 py-0.5 rounded-md border border-[#94D9FF]">Statutory Notice</span>
        <span className="leading-relaxed font-semibold text-[#171827]">{text}</span>
      </div>
    </div>
  );
};
