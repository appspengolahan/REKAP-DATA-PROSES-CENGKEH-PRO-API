/**
 * Executive Top Header & Control Bar
 * File: Header[RekapCengkeh].tsx
 * Reference: https://rekap-dataproses-tembakau-pro.vercel.app/
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  Printer, 
  HelpCircle, 
  UserCheck, 
  Database,
  Layers,
  ChevronDown,
  Menu,
  TableProperties,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Check,
  Download,
  Smartphone
} from 'lucide-react';
import { UserRole } from './types[RekapCengkeh]';
import { exportToPdf, BUILD_VERSION } from './Code[RekapCengkeh]';

interface HeaderProps {
  entriTerkini: string;
  userRole: UserRole;
  onRoleChange: (r: UserRole) => void;
  jalurProses: 'Semua' | 'SKT' | 'SKM';
  onJalurProsesChange: (j: 'Semua' | 'SKT' | 'SKM') => void;
  onRefresh: () => void;
  onPullDatasheet: () => void;
  isSyncing: boolean;
  isPullingDatasheet: boolean;
  autoSync?: boolean;
  onToggleAutoSync?: () => void;
  onOpenHelp: () => void;
  onOpenSwitchBoard: () => void;
  onOpenGasCenter: () => void;
  onOpenInstallPwa?: () => void;
  onExportPdf: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const HeaderRekapCengkeh: React.FC<HeaderProps> = ({
  entriTerkini,
  userRole,
  onRoleChange,
  jalurProses,
  onJalurProsesChange,
  onRefresh,
  onPullDatasheet,
  isSyncing,
  isPullingDatasheet,
  autoSync = false,
  onToggleAutoSync,
  onOpenHelp,
  onOpenSwitchBoard,
  onOpenGasCenter,
  onOpenInstallPwa,
  onExportPdf,
  onToggleSidebar,
  isSidebarCollapsed
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isJalurMenuOpen, setIsJalurMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const jalurMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (jalurMenuRef.current && !jalurMenuRef.current.contains(e.target as Node)) {
        setIsJalurMenuOpen(false);
      }
    };
    if (isUserMenuOpen || isJalurMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isJalurMenuOpen]);

  // Esc key closes menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsJalurMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md shrink-0 select-none">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Sisi Kiri: Logo PP1 & Identitas Pabrik */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            {/* Mobile Sidebar Toggle */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo PP1 */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-white shadow-md shrink-0 text-sm sm:text-base tracking-wider ring-1 ring-amber-400/30">
              PP1
            </div>

            {/* Identitas Teks */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
                  <span className="hidden sm:inline">Monitoring Board — </span>Rekap Data Proses Cengkeh
                </h1>

                {/* Badge GAS Online */}
                <span className="hidden 2xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Headless GAS Online
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                <span className="text-slate-300 font-medium">PT Batu Karang</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline">Divisi Produksi I</span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-amber-300/90 font-medium text-[11px]">
                  <span>Entri: {entriTerkini}</span>
                </span>
                <span className="hidden md:inline-flex 2xl:hidden items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="text-slate-600">·</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GAS Online
                </span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Action Buttons & RBAC Popover */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Selector Jalur (Semua / SKT / SKM) */}
            <div className="relative hidden md:block" ref={jalurMenuRef}>
              <button
                type="button"
                onClick={() => setIsJalurMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none shadow-xs ${
                  jalurProses === 'SKT'
                    ? 'bg-amber-950/70 border-amber-600/80 text-amber-300 ring-1 ring-amber-500/30'
                    : jalurProses === 'SKM'
                    ? 'bg-blue-950/70 border-blue-600/80 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-slate-600'
                }`}
                title="Pilih Jalur Proses (Semua / SKT / SKM)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400 font-normal">Jalur:</span>
                <span className="font-bold">{jalurProses === 'Semua' ? 'Semua Jalur' : jalurProses}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isJalurMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {/* Jalur Menu Dropdown */}
              {isJalurMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5 space-y-1 animate-in fade-in duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pilih Jalur Proses
                  </div>
                  {(['Semua', 'SKT', 'SKM'] as const).map((j) => {
                    const isSelected = jalurProses === j;
                    return (
                      <button
                        key={j}
                        onClick={() => {
                          onJalurProsesChange(j);
                          setIsJalurMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? j === 'SKT'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : j === 'SKM'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-700 text-white shadow-xs'
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${j === 'SKT' ? 'bg-amber-400' : j === 'SKM' ? 'bg-blue-400' : 'bg-slate-400'}`} />
                          <span>{j === 'Semua' ? 'Semua Jalur (SKT & SKM)' : j === 'SKT' ? 'SKT (Tangan)' : 'SKM (Mesin)'}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 1.5. Pasang Aplikasi (PWA) Button */}
            {onOpenInstallPwa && (
              <button
                type="button"
                onClick={onOpenInstallPwa}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer ring-1 ring-amber-400/40"
                title="Pasang Aplikasi (PWA) ke Layar Utama HP / Desktop — Tanpa Repot Menu Titik Tiga"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Pasang App</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300 font-mono font-bold hidden md:inline">
                  PWA
                </span>
              </button>
            )}

            {/* 2. Tarik Datasheet Langsung Button */}
            <button
              onClick={onPullDatasheet}
              disabled={isPullingDatasheet}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                isPullingDatasheet ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="Tarik Data Langsung dari Datasheet Google Sheet (DATA PROSES CKH)"
            >
              <TableProperties className={`w-3.5 h-3.5 ${isPullingDatasheet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isPullingDatasheet ? 'Menarik...' : 'Tarik Datasheet'}</span>
            </button>

            {/* 2.5. Auto-Sync Toggle Button (Logo terus berputar saat aktif sesuai Blueprint) */}
            {onToggleAutoSync && (
              <button
                type="button"
                onClick={onToggleAutoSync}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all select-none cursor-pointer ${
                  autoSync
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
                title={autoSync ? 'Auto-Sync Aktif: Logo terus berputar & sinkronisasi otomatis berjalan berkala' : 'Aktifkan Auto-Sync Otomatis'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoSync ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Auto-Sync</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  autoSync ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-900 text-slate-500'
                }`}>
                  {autoSync ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* 2.7. Tombol Headless GAS Center Sesuai Blueprint */}
            <button
              type="button"
              onClick={onOpenGasCenter}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-600/50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Headless GAS Center (Pengaturan Endpoint API URL & Payload Testing)"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">GAS Center</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold hidden md:inline">
                REST
              </span>
            </button>

            {/* 3. Refresh Data Button */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className={`p-1.5 sm:p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer ${
                isSyncing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="Refresh / Sinkronisasi Data Manual Cepat"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* 4. Export PDF Button */}
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Cetak / Unduh Laporan PDF Resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* 5. RBAC & App Suite Popover Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none shadow-xs cursor-pointer ${
                  isUserMenuOpen
                    ? 'bg-slate-800 text-white border-blue-500 shadow-blue-900/40 ring-2 ring-blue-500/30'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-slate-600'
                }`}
                title="Pilih Peran Pengguna (RBAC), Profil, Switch App & GAS Center"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-slate-400 font-normal hidden lg:inline">Peran:</span>
                <span className="font-semibold text-slate-100 truncate max-w-[110px] sm:max-w-none">
                  {userRole}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {/* Popover Content */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-76 sm:w-84 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in duration-150">
                  {/* Bagian 1: Role-Based Access Control (RBAC) Selector Sesuai Blueprint */}
                  <div className="p-3.5 bg-slate-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        Role-Based Access Control (RBAC)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/70">
                        {userRole}
                      </span>
                    </div>

                    {/* 5 Tombol Role Sesuai Blueprint */}
                    <div className="grid grid-cols-1 gap-1">
                      {(['Project Manager', 'Site Engineer', 'Vendor', 'Client', 'Admin'] as const).map((r) => {
                        const isSelected = userRole === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              onRoleChange(r as UserRole);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/90 bg-slate-900/60'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`} />
                              <span>{r}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">Status Backend:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-950/90 text-emerald-400 border border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Headless GAS Online
                      </span>
                    </div>
                  </div>

                  {/* Bagian 2: Quick Links */}
                  <div className="p-2 space-y-1">
                    {onOpenInstallPwa && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenInstallPwa();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <span>Pasang Aplikasi (PWA)</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">HP & PC</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Instal langsung ke layar utama</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSwitchBoard();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Switch App Board</div>
                          <div className="text-[10px] text-slate-400">Pindah antar web app Divisi Produksi I</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenGasCenter();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>Headless GAS Center</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">REST</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Pengaturan endpoint & sync cache</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenHelp();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Bantuan & Panduan Sistem</div>
                          <div className="text-[10px] text-slate-400">Versi build & kontak developer</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </button>
                  </div>

                  {/* Bagian 3: Footer Popover */}
                  <div className="p-3 bg-slate-950/60 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Divisi Produksi I · PT Batu Karang</span>
                    <span className="font-mono text-slate-400">{BUILD_VERSION.split(' - ')[0]}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
