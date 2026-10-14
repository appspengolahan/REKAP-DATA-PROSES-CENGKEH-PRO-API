/**
 * Collapsible Industrial Sidebar
 * File: Sidebar[RekapCengkeh].tsx
 * Reference: https://rekap-dataproses-tembakau-pro.vercel.app/
 */
import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Layers, 
  Table, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  UserCheck, 
  Download,
  HelpCircle,
  Sprout,
  ShieldCheck
} from 'lucide-react';
import { UserRole, ActiveTabCengkeh } from './types[RekapCengkeh]';
import { BUILD_VERSION } from './Code[RekapCengkeh]';

interface SidebarProps {
  activeTab: ActiveTabCengkeh;
  onTabChange: (tab: ActiveTabCengkeh) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole: UserRole;
  onOpenGasCenter: () => void;
  onOpenInstallPwa?: () => void;
  onOpenHelp?: () => void;
  onOpenSwitchBoard?: () => void;
}

export const SidebarRekapCengkeh: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  userRole,
  onOpenGasCenter,
  onOpenInstallPwa,
  onOpenHelp,
  onOpenSwitchBoard
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard Data Cengkeh',
      sublabel: 'Tahunan & Bulanan',
      icon: LayoutDashboard
    },
    {
      id: 'rekap-bulan' as const,
      label: 'Rekap per Bulan',
      sublabel: 'Tren & Tabel Bulanan',
      icon: Calendar
    },
    {
      id: 'rekap-jenis' as const,
      label: 'Rekap Jenis Cengkeh',
      sublabel: 'Varian & Kapasitas',
      icon: Layers
    },
    {
      id: 'data-explorer' as const,
      label: 'Log Data Mentah',
      sublabel: 'Semua Transaksi',
      icon: Table
    }
  ];

  return (
    <aside
      role="navigation"
      aria-label="Menu Navigasi Sidebar"
      className={`no-print hidden lg:flex bg-slate-900 border-r border-slate-800 text-slate-300 flex-col transition-all duration-300 select-none shrink-0 h-full z-20 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Section: MENU UTAMA Banner & Collapse Toggle */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 shrink-0">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                <Sprout className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-white truncate">
                  MENU UTAMA
                </div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">
                  Proses Cengkeh
                </div>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
              title="Ciutkan Sidebar ke Rail Mode"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Perlebar Sidebar (256px)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="truncate leading-tight font-semibold text-xs">{item.label}</div>
                  <div className={`text-[10px] leading-tight truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.sublabel}
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {/* Switch App Menu - Sinkron dengan Switch App Board di Header */}
        {onOpenSwitchBoard && (
          <div className="pt-2 mt-2 border-t border-slate-800/80">
            <button
              onClick={onOpenSwitchBoard}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 hover:border-amber-500/40 group shadow-2xs"
              title={isCollapsed ? 'Switch App (Ekosistem PP1)' : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate leading-tight font-bold text-xs text-amber-200 flex items-center justify-between">
                    <span>Switch App</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                      PP1 Board
                    </span>
                  </div>
                  <div className="text-[10px] leading-tight truncate text-amber-400/80 mt-0.5">
                    Pindah Web App Ekosistem
                  </div>
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: GAS Center Shortcut, Help, Install PWA & Role */}
      <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
        {/* Headless GAS Center */}
        <button
          onClick={onOpenGasCenter}
          className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer text-left"
          title="Headless GAS Center (REST API & Testing)"
        >
          <Database className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold leading-tight truncate text-white flex items-center justify-between">
                <span>Headless GAS Center</span>
                <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">REST</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                REST API & Testing
              </div>
            </div>
          )}
        </button>

        {/* Bantuan & Rumus */}
        {onOpenHelp && (
          <button
            onClick={onOpenHelp}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer text-left"
            title="Bantuan & Rumus (Petunjuk Kerja)"
          >
            <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight truncate text-white">
                  Bantuan & Rumus
                </div>
                <div className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                  Petunjuk Kerja
                </div>
              </div>
            )}
          </button>
        )}

        {/* Pasang PWA */}
        {onOpenInstallPwa && (
          <button
            onClick={onOpenInstallPwa}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer text-left"
            title="Pasang Aplikasi (PWA) di HP / Laptop"
          >
            <Download className="w-4 h-4 shrink-0 text-amber-400" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight truncate text-amber-200 flex items-center justify-between">
                  <span>Pasang Aplikasi</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-mono">PWA</span>
                </div>
                <div className="text-[10px] text-amber-400/80 leading-tight truncate mt-0.5">
                  Layar Utama HP / Desktop
                </div>
              </div>
            )}
          </button>
        )}

        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">
                {userRole === 'Project Manager' ? 'Project Manager' : userRole}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Monitoring KPI & Target
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
