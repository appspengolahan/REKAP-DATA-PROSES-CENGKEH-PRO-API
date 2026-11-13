/**
 * Fullscreen Chart Expanded Modal (Meeting & Presentation Zoom)
 * File: ChartExpandedModal[RekapCengkeh].tsx
 * Reference: https://rekap-dataproses-tembakau-pro.vercel.app/
 */
import React, { useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface ChartExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ChartExpandedModalRekapCengkeh: React.FC<ChartExpandedModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 lg:backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[92dvh] overflow-hidden flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2 border-b border-blue-800/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span className="truncate">{title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-800/80 text-blue-200 font-semibold border border-blue-600/50 shrink-0">
                  Mode Perbesar
                </span>
              </h2>
              {subtitle && <p className="text-xs text-blue-200/80 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="hidden lg:inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 text-xs text-blue-200 hover:text-white bg-blue-950/60 hover:bg-blue-800/60 border border-blue-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <span>Tutup</span>
              <kbd className="hidden md:inline-block text-[10px] bg-blue-900/80 px-1.5 py-0.5 rounded text-blue-300 font-mono">Esc</kbd>
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] lg:min-h-[36px] lg:min-w-[36px] inline-flex items-center justify-center p-1.5 text-blue-300 hover:text-white hover:bg-blue-800/60 rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Konten Grafik Diperbesar */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center bg-slate-50/50">
          {children}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="font-medium text-slate-600">PT Batu Karang · Divisi Produksi I</span>
          <span className="hidden lg:inline text-slate-400">Tekan tombol Esc atau area gelap untuk menutup</span>
          <button
            onClick={onClose}
            className="lg:hidden min-h-[44px] px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
