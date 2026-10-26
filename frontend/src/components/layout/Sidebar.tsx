import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  UploadCloud,
  FileCheck2,
  Clock,
  ListChecks,
  Network,
  Bell,
  ShieldCheck,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  alertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, alertsCount = 5 }) => {
  const location = useLocation();

  const navItemsWorkspace = [
    { name: 'Validation Queue', path: '/', icon: LayoutGrid, exact: true },
    { name: 'New Validation', path: '/new-validation', icon: UploadCloud },
    { 
      name: 'Document Reviewer', 
      path: location.pathname.startsWith('/reviewer') ? location.pathname : '/reviewer/EoA-2026-00418', 
      icon: FileCheck2,
      matchPrefix: '/reviewer'
    },
    { name: 'Audit Trail', path: '/audit-trail', icon: Clock },
  ];

  const navItemsConfig = [
    { name: 'Checklists & Rules', path: '/rules', icon: ListChecks },
    { name: 'Issuing Authorities', path: '/authorities', icon: Network },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: alertsCount },
  ];

  const isItemActive = (item: typeof navItemsWorkspace[0]) => {
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.matchPrefix);
    }
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#171827]/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-gradient-to-b from-[#1E0B54] via-[#2A1070] to-[#3B1796] border-r border-[#6F3DFF]/30 flex flex-col justify-between transition-transform duration-250 ease-in-out shadow-2xl lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#6F3DFF]/25 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6F3DFF] to-[#BFE9FF] flex items-center justify-center text-[#1E0B54] font-black shadow-lg shadow-[#6F3DFF]/40">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-[17px] text-white leading-tight tracking-tight">SATYAPAN</h1>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#BFE9FF] text-[#1E0B54] shadow-xs">
                    AICTE
                  </span>
                </div>
                <p className="text-[11px] text-[#BFE9FF]/80 font-medium tracking-wide">Scrutiny Intelligence</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg text-[#D5C2FF] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3.5 space-y-5">
            {/* WORKSPACE */}
            <div>
              <p className="px-3 text-[10px] font-extrabold text-[#BFE9FF]/70 uppercase tracking-wider mb-2">
                Scrutiny Workspace
              </p>
              <ul className="space-y-1.5">
                {navItemsWorkspace.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[42px] ${
                          active
                            ? 'bg-[#BFE9FF] text-[#171827] font-bold shadow-md shadow-[#BFE9FF]/30'
                            : 'text-[#E1D6FF] hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          active ? 'bg-[#6F3DFF] text-white shadow-xs' : 'text-[#BFE9FF] group-hover:text-white'
                        }`}>
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <span className="flex-1 text-[13px]">{item.name}</span>
                        {active && (
                          <div className="w-2 h-2 rounded-full bg-[#6F3DFF]" />
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* CONFIGURATION */}
            <div>
              <p className="px-3 text-[10px] font-extrabold text-[#BFE9FF]/70 uppercase tracking-wider mb-2">
                Governance & Registry
              </p>
              <ul className="space-y-1.5">
                {navItemsConfig.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[42px] ${
                          active
                            ? 'bg-[#BFE9FF] text-[#171827] font-bold shadow-md shadow-[#BFE9FF]/30'
                            : 'text-[#E1D6FF] hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            active ? 'bg-[#6F3DFF] text-white shadow-xs' : 'text-[#BFE9FF]'
                          }`}>
                            <Icon className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <span className="text-[13px]">{item.name}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            active 
                              ? 'bg-[#6F3DFF] text-white' 
                              : 'bg-[#E11D48] text-white shadow-xs'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>

        {/* Footer / System Status */}
        <div className="p-3.5 border-t border-[#6F3DFF]/30 bg-black/25 space-y-3">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2.5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">AICTE Handbook 2026-27</p>
              <p className="text-[10px] text-[#BFE9FF]/80 truncate">Deterministic Engine Active</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-[#D5C2FF]">
            <span>SIH26261 · v2.4</span>
            <span className="font-bold text-[#BFE9FF]">Decision Support</span>
          </div>
        </div>
      </aside>
    </>
  );
};
