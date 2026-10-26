import React from 'react';
import { Search, Shield, Menu, Sparkles, Building2 } from 'lucide-react';

interface TopHeaderProps {
  onMenuClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onMenuClick,
  searchQuery = '',
  onSearchChange
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-[#CBD5E1] shadow-xs">
      {/* Top Brand Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-[#6F3DFF] via-[#BFE9FF] to-[#3B1796]" />

      <div className="h-15 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-xl min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-white bg-[#6F3DFF] hover:bg-[#5A2CE3] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="relative w-full max-w-md min-w-0">
            <Search className="w-4 h-4 text-[#6F3DFF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
            <input
              type="text"
              placeholder="Search application ID or institution..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-[13px] text-[#171827] font-medium focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] focus:bg-white placeholder-[#686B7A] transition-all min-h-[40px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          {/* Cycle Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF8FF] border border-[#BFE9FF] rounded-xl text-xs font-bold text-[#0369A1]">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
            <span>AY 2026-27 Active</span>
          </div>

          {/* Scrutiny Official Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#F0EBFF] to-[#EAF8FF] border-2 border-[#BFE9FF] rounded-xl text-xs font-bold text-[#171827] shadow-xs">
            <div className="w-6 h-6 rounded-lg bg-[#6F3DFF] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[11px] font-extrabold text-[#1E0B54] leading-tight">Scrutiny Official</span>
              <span className="text-[10px] text-[#6F3DFF] font-semibold leading-tight">AICTE Regional Bureau</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
