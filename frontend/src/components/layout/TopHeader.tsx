import React from 'react';
import { Search, ShieldAlert, Menu, Shield } from 'lucide-react';

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
    <header className="h-16 bg-white border-b border-[#e1eaed] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by application ID or institution"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f4f7f8] border border-[#d6e2e6] rounded-lg text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f0f5f7] border border-[#d5e3e8] rounded-lg text-xs font-medium text-[#204a53]">
          <Shield className="w-3.5 h-3.5 text-[#24616d]" />
          <span>Authorised official · View & review</span>
        </div>
      </div>
    </header>
  );
};
