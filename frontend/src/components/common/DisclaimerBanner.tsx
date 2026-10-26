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
    <div className={`flex items-start sm:items-center gap-3 px-4 py-3 bg-[#e8eff2] border border-[#d2e0e5] rounded-lg text-xs text-[#22454e] ${className}`}>
      <ShieldCheck className="w-4 h-4 text-[#26626f] flex-shrink-0 mt-0.5 sm:mt-0" />
      <span className="leading-relaxed font-medium">{text}</span>
    </div>
  );
};
