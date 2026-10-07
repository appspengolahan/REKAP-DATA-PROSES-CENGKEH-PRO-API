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
  UserCheck
} from 'lucide-react';
import { UserRole } from './types[RekapCengkeh]';
import { BUILD_VERSION } from './Code[RekapCengkeh]';

interface SidebarProps {
  activeTab: 'dashboard' | 'rekap-bulan' | 'rekap-jenis' | 'data-explorer';
  onTabChange: (tab: 'dashboard' | 'rekap-bulan' | 'rekap-jenis' | 'data-explorer') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole: UserRole;
  onOpenGasCenter: () => void;
}

export const SidebarRekapCengkeh: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  userRole,
  onOpenGasCenter
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard Kesusutan',
      sublabel: 'Ringkasan & Rentang Periode',
      icon: LayoutDashboard
    },
    {
      id: 'rekap-bulan' as const,
      label: 'Rekap per Bulan',
      sublabel: 'Tren Bulanan & Rasio Bahan',
      icon: Calendar
    },
    {
      id: 'rekap-jenis' as const,
      label: 'Rekap per Jenis Cengkeh',
      sublabel: 'Varian & Analisis Spesifik',
      icon: Layers
    },
    {
      id: 'data-explorer' as const,
      label: 'Data Explorer Batch',
      sublabel: 'Verifikasi & Audit Baris Mentah',
      icon: Table
    }
  ];

  return (
    <aside
      className={`no-print hidden lg:flex bg-slate-900 border-r border-slate-800 text-slate-300 flex-col transition-all duration-300 select-none shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Section: Rail Toggle */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800">
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer ${
            isCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
          title={isCollapsed ? 'Perlebar Sidebar (256px)' : 'Kecilkan ke Rail Mode (68px)'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
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
      </div>

      {/* Bottom Section: GAS Center Shortcut & Role */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <button
          onClick={onOpenGasCenter}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/80 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer text-left"
          title="Headless GAS Center (REST Engine)"
        >
          <Database className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold leading-tight truncate text-white flex items-center justify-between">
                <span>Headless GAS Center</span>
                <span className="text-[10px] px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">REST</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                Konfigurasi REST Engine
              </div>
            </div>
          )}
        </button>

        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">
                {userRole === 'Project Manager' ? 'PM: Lalu Mahendra' : userRole}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                PT Batu Karang · PP1
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
