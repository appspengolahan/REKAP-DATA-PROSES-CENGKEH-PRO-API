/**
 * Modal Bantuan / Help Modal
 * File: HelpModal[RekapCengkeh].tsx
 */
import React from 'react';
import { X, HelpCircle, Info, ExternalLink, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { BUILD_VERSION, PROJECT_NAME } from './Code[RekapCengkeh]';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineStatus: boolean;
}

export const HelpModalRekapCengkeh: React.FC<HelpModalProps> = ({ isOpen, onClose, onlineStatus }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-7 text-slate-800">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-3 mb-2 pr-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {PROJECT_NAME}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span>Unit: <strong>PT Batu Karang · Divisi Produksi I (PP1)</strong></span>
            </div>
          </div>
        </div>

        {/* Versi Build Server Live */}
        <div className="mt-3 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-600" />
            <span className="text-slate-600">Versi build server:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {BUILD_VERSION}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${onlineStatus ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-medium text-slate-600">
              {onlineStatus ? 'Multi-Tier Cloud Active' : 'Offline Cache Mode'}
            </span>
          </div>
        </div>

        {/* Petunjuk Penggunaan */}
        <div className="space-y-4 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-150 pb-1.5">
            <Info className="w-4 h-4 text-amber-600" />
            <span>Cara Penggunaan & Fitur Monitoring Board</span>
          </div>

          <ol className="list-decimal pl-5 space-y-2 text-slate-600 leading-relaxed text-xs md:text-[13px]">
            <li>
              Pilih <strong>Tahun (global)</strong> di filter atas untuk mengatur periode Rekap Tahunan, Rekap Bulanan, dan tab Rekap per Bulan.
            </li>
            <li>
              Gunakan dropdown <strong>Bulan</strong> di card Rekap Bulanan untuk menganalisis data spesifik satu bulan tertentu secara instan (0.01s).
            </li>
            <li>
              Klik tab <strong>Rekap per Bulan</strong> untuk melihat grafik tren persentase susut, komparasi bahan awal Gelondong Kering vs Rajang Kering, dan tabel deviasi batas toleransi.
            </li>
            <li>
              Di kartu <em>Rekap per Bulan — per Jenis Cengkeh</em>, pilih varian untuk mengevaluasi kinerja jenis cengkeh spesifik di tiap bulan.
            </li>
            <li>
              Di card <strong>Rekap Rentang Periode</strong>, atur rentang <em>"Dari Bulan/Tahun — Sampai Bulan/Tahun"</em> lalu klik <strong>Terapkan</strong> — kontrol ini otomatis mengatur tabel di tab <strong>Rekap per Jenis Cengkeh</strong>.
            </li>
            <li>
              Gunakan tombol <strong>📄 Export Ringkasan (PDF)</strong> atau <strong>📄 Export Tab Ini (PDF)</strong> untuk mencetak laporan resmi divisi dengan penamaan file terstandarisasi.
            </li>
            <li>
              Gunakan tombol <strong>🔀 Switch App</strong> di pojok kanan atas untuk berpindah seketika ke Monitoring Board proses lainnya (Blend, Tembakau, Krosok, Persediaan).
            </li>
          </ol>

          {/* Model Rumus Dua Tahap */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-950 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Model Perhitungan 2 Tahap Cengkeh:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-amber-900/90">
              <li><strong>Tahap 1 (Rendam & Rajang)</strong>: Selisih Kg = Rajang Basah - Gld. Kering | Selisih % = (Selisih / Gld. Kering) × 100%</li>
              <li><strong>Tahap 2 (Dryer)</strong>: Susut Dryer Kg = Rajang Basah - Rajang Kering | Susut Dryer % = (Susut / Rajang Basah) × 100%</li>
              <li><strong>Total Susut (Awal ke Akhir)</strong>: Total Susut Kg = Gld. Kering - Rajang Kering | Total Susut % = (Total / Gld. Kering) × 100%</li>
            </ul>
          </div>
        </div>

        {/* Footer Resmi Sesuai Ketentuan */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1.5 leading-relaxed">
          <div className="font-medium text-slate-700">
            Monitoring Board — Rekap Data Proses Cengkeh All Rights Reserved . Divisi Produksi I . Developed by Lalu Mahendra 
          </div>
          <div className="text-[11px] text-slate-500">
            Jika menemukan bug atau kendala teknis, silahkan hubungi Developer [Lalu Mahendra]
          </div>
        </div>
      </div>
    </div>
  );
};
