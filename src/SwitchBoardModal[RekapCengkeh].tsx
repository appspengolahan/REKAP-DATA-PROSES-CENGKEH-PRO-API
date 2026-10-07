/**
 * Modal Switch Board (Ekosistem Web Apps Divisi Produksi I)
 * File: SwitchBoardModal[RekapCengkeh].tsx
 * Reference: https://rekap-dataproses-tembakau-pro.vercel.app/
 */
import React, { useEffect } from 'react';
import { X, ExternalLink, ArrowRight, Layers, BarChart3, Users, Building, Activity, ShieldCheck } from 'lucide-react';

interface SwitchBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchBoardModalRekapCengkeh: React.FC<SwitchBoardModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sisterApps = [
    {
      name: 'Rekap Susut Cengkeh',
      desc: 'Kesusutan Sortasi, Rendaman & Hasil Dryer Cengkeh',
      status: 'active',
      url: '#',
      badge: 'Sedang Dibuka',
      icon: '🌿'
    },
    {
      name: 'Rekap Susut Tembakau',
      desc: 'Dashboard Kesusutan Proses Tembakau (SKT & SKM) 54 Varian',
      status: 'external',
      url: 'https://rekap-dataproses-tembakau-pro.vercel.app/',
      badge: 'Live App',
      icon: '🍂'
    },
    {
      name: 'Rekap Susut Blend',
      desc: 'Monitoring Komposisi & Yield Formula Blend Pabrik',
      status: 'external',
      url: 'https://appspengolahan.github.io/Rekap-Proses-Blend/',
      badge: 'Live App',
      icon: '🌪️'
    },
    {
      name: 'Rekap Susut Krosok',
      desc: 'Monitoring Grading & Destemming Bahan Baku Krosok',
      status: 'external',
      url: 'https://appspengolahan.github.io/Rekap-Proses-Krosok/',
      badge: 'Live App',
      icon: '📦'
    }
  ];

  const enterpriseModules = [
    {
      name: 'Monitoring Stock Persediaan PP1',
      desc: 'Stok Live 4 Komoditas: Cengkeh, Tembakau, Krosok, Blend',
      url: 'https://script.google.com/macros/s/AKfycbywAsu-wvbBxWwl2P9YojeZgR13U3BR9cS8THDCGE9EMINUXIIcR1HjoAK59W1Aqm1lYQ/exec',
      icon: BarChart3,
      type: 'Vercel / GAS Live'
    },
    {
      name: 'General Monitoring & OEE Pabrik',
      desc: 'Telemetri 4 Lini Mesin Pengolahan, Suhu & Kelembaban (RH)',
      url: '#',
      icon: Activity,
      type: 'Modul PP1'
    },
    {
      name: 'Modul HR Pekerja Harian Lepas (PHL)',
      desc: 'Master NIP PHL, Presensi Mandor, Output Tonase & Upah Borongan',
      url: '#',
      icon: Users,
      type: 'Roadmap PP1'
    },
    {
      name: 'Modul HR Staff & Karyawan Tetap',
      desc: 'Presensi Geofence GPS 150m, Shift 1-3 & Scoring KPI Bulanan',
      url: '#',
      icon: Building,
      type: 'Roadmap PP1'
    }
  ];

  return (
    <div 
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Switch App Board</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">
                  PP1 Ekosistem
                </span>
              </h2>
              <p className="text-xs text-slate-400">Pindah antar web apps dan modul divisi tanpa banner Apps Script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Bagian 1: 4 Monitoring Board Utama */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Monitoring Board Komoditas Pabrik (Wrapper Bebas Banner)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sisterApps.map((app) => (
                <div
                  key={app.name}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-2.5 ${
                    app.status === 'active'
                      ? 'bg-amber-50/70 border-amber-300/80'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{app.icon}</span>
                      <span className="font-bold text-xs text-slate-900 truncate">{app.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {app.desc}
                    </p>
                  </div>

                  {app.status === 'active' ? (
                    <span className="shrink-0 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                      {app.badge}
                    </span>
                  ) : (
                    <a
                      href={app.url}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                      <span>Buka</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bagian 2: Enterprise Modules */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Modul Enterprise & Sistem Operasional
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {enterpriseModules.map((mod) => {
                const Icon = mod.icon;
                const isExternal = mod.url.startsWith('http');
                return (
                  <div
                    key={mod.name}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all flex items-start justify-between gap-2.5"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">{mod.name}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {mod.desc}
                        </p>
                      </div>
                    </div>

                    {isExternal ? (
                      <a
                        href={mod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap"
                      >
                        <span>Akses</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="shrink-0 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                        {mod.type}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>PT Batu Karang · Divisi Produksi I</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
