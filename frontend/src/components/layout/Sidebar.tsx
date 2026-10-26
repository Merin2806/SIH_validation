import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  UploadCloud,
  FileCheck2,
  Clock,
  ListChecks,
  Network,
  Bell,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  alertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, alertsCount = 5 }) => {
  const navItemsWorkspace = [
    { name: 'Validation queue', path: '/', icon: LayoutGrid },
    { name: 'New validation', path: '/new-validation', icon: UploadCloud },
    { name: 'Document reviewer', path: '/reviewer/EoA-2026-00418', icon: FileCheck2 },
    { name: 'Audit trail', path: '/audit-trail', icon: Clock },
  ];

  const navItemsConfig = [
    { name: 'Checklists & rules', path: '/rules', icon: ListChecks },
    { name: 'Issuing authorities', path: '/authorities', icon: Network },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: alertsCount },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#23535d] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="flex items-center justify-between p-5 pb-6 border-b border-[#2d636e]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-[#92d9e3]" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white leading-tight tracking-tight">Satyapan</h1>
                <p className="text-[11px] text-[#93c7cf] tracking-wide">Application validation</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-6">
            {/* WORKSPACE */}
            <div>
              <p className="px-3 text-[11px] font-semibold text-[#8ebec7] uppercase tracking-wider mb-2">
                Workspace
              </p>
              <ul className="space-y-1">
                {navItemsWorkspace.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[#376b75] text-white shadow-sm'
                              : 'text-[#cfe6ea] hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 opacity-90" />
                        <span>{item.name}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* CONFIGURATION */}
            <div>
              <p className="px-3 text-[11px] font-semibold text-[#8ebec7] uppercase tracking-wider mb-2">
                Configuration
              </p>
              <ul className="space-y-1">
                {navItemsConfig.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[#376b75] text-white shadow-sm'
                              : 'text-[#cfe6ea] hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 opacity-90" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white text-[#23535d]">
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

        {/* Bottom Profile Panel */}
        <div className="p-4 border-t border-[#2d636e]/60 bg-[#1e4850]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#80c8d4] text-[#1b434a] font-bold text-xs flex items-center justify-center shadow-sm">
              SO
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white leading-snug truncate">Scrutiny Officer</h4>
              <p className="text-[11px] text-[#93c7cf] truncate">Role-based access · Demo</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
