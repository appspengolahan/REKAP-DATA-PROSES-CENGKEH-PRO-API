/**
 * Collapsible Industrial Sidebar
 * File: Sidebar[RekapCengkeh].tsx
 * Reference: https://rekap-dataproses-tembakau-pro.vercel.app/
 */
import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Layers, 
  Table, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Sprout,
  GitFork,
  Scale,
  X,
  Database,
  HelpCircle
} from 'lucide-react';
import { UserRole, ActiveTabCengkeh } from './types[RekapCengkeh]';

interface SidebarProps {
  activeTab: ActiveTabCengkeh;
  onTabChange: (tab: ActiveTabCengkeh) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  isMobileOpen = false,
  onCloseMobile,
  userRole: _userRole,
  onOpenGasCenter,
  onOpenInstallPwa,
  onOpenHelp,
  onOpenSwitchBoard
}) => {
  useEffect(() => {
    if (!isMobileOpen || !onCloseMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

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
      id: 'analisis-deviasi' as const,
      label: 'Analisis Deviasi & Acuan',
      sublabel: 'Standar & Evaluasi Bulanan',
      icon: Scale
    },
    {
      id: 'rekap-jenis' as const,
      label: 'Rekap Jenis Cengkeh',
      sublabel: 'Varian & Kapasitas',
      icon: Layers
    },
    {
      id: 'data-explorer' as const,
      label: 'Log Data Harian',
      sublabel: 'Transaksi Terkini',
      icon: Table
    },
    {
      id: 'integrasi-dhp' as const,
      label: 'Integrasi DHP Cengkeh',
      sublabel: 'Tarik & Kirim Kertas Kerja',
      icon: GitFork
    }
  ];

  const handleSelectTab = (tab: ActiveTabCengkeh) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Desktop Sidebar */}
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
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
                title="Ciutkan Sidebar ke Rail Mode"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
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
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
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
        </div>

        {/* Bottom Section: Install PWA (jika tersedia) */}
        {onOpenInstallPwa && (
          <div className="p-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onOpenInstallPwa}
              className="w-full flex items-center gap-3 p-2.5 min-h-[44px] rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer text-left"
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
          </div>
        )}
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer (< 1024px) */}
      {isMobileOpen && (
        <div
          className="no-print lg:hidden fixed inset-0 z-50 flex bg-slate-950/75 animate-in fade-in duration-150"
          onClick={() => onCloseMobile && onCloseMobile()}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi Ponsel & Tablet"
            className="w-76 max-w-[85vw] h-[100dvh] bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col shadow-2xl select-none pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Drawer */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Sprout className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-white truncate">
                    MENU UTAMA
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Divisi Produksi I · PP1
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items */}
            <div className="flex-1 py-3 px-2.5 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[48px] rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate leading-tight font-semibold text-xs">{item.label}</div>
                      <div className={`text-[10px] leading-tight truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Utilitas Tambahan di Drawer */}
              <div className="pt-3 mt-3 border-t border-slate-800 space-y-1.5">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Alat & Ekosistem
                </div>
                {onOpenSwitchBoard && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                      onOpenSwitchBoard();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-semibold text-amber-300 hover:bg-slate-800 cursor-pointer text-left"
                  >
                    <Layers className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Switch App Board</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onOpenGasCenter();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-semibold text-cyan-300 hover:bg-slate-800 cursor-pointer text-left"
                >
                  <Database className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>Headless GAS Center</span>
                </button>
                {onOpenHelp && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                      onOpenHelp();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer text-left"
                  >
                    <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Bantuan & Rumus</span>
                  </button>
                )}
              </div>
            </div>

            {onOpenInstallPwa && (
              <div className="p-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onOpenInstallPwa();
                  }}
                  className="w-full flex items-center gap-3 p-3 min-h-[48px] rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 hover:bg-amber-500/25 transition-all cursor-pointer text-left"
                >
                  <Download className="w-4 h-4 shrink-0 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight truncate flex items-center justify-between">
                      <span>Pasang Aplikasi (PWA)</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">HP & PC</span>
                    </div>
                    <div className="text-[10px] text-amber-400/80 leading-tight truncate mt-0.5">
                      Instal langsung ke layar utama
                    </div>
                  </div>
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};
