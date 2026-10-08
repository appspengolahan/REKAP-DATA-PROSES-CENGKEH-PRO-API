import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Laptop, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  Copy, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModalRekapCengkeh: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setInstallStatus('Membuka dialog instalasi...');
    const success = await install();
    if (success) {
      setInstallStatus('✅ Berhasil diinstal!');
      setTimeout(() => {
        onClose();
        setInstallStatus(null);
      }, 1500);
    } else {
      setInstallStatus(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] overflow-y-auto flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-blue-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-amber-300">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Pasang Aplikasi (PWA)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                  Resmi
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Akses cepat & offline langsung dari layar utama HP atau desktop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Aplikasi Telah Terpasang!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Aplikasi ini sudah berjalan dalam mode mandiri (Standalone PWA) di perangkat Anda.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 1-Click Install Button (When browser supports native prompt) */}
              {isInstallable ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dukungan Instal 1-Klik Aktif</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pasang ke Layar Utama Sekarang
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Tanpa perlu membuka menu titik tiga di browser. Cukup klik tombol di bawah untuk memasang otomatis:
                  </p>
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Download className="w-4 h-4" />
                    <span>⚡ Pasang Sekarang (1-Klik)</span>
                  </button>
                  {installStatus && (
                    <div className="text-xs font-medium text-blue-700">{installStatus}</div>
                  )}
                </div>
              ) : null}

              {/* Intuitive Device-Specific Instructions */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Panduan Instalasi Mudah Per Perangkat</span>
                </div>

                {/* Option 1: HP Android / Chrome */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Untuk HP Android (Chrome / Edge / Browser Bawaan)</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-1.5 pl-5 list-decimal">
                    <li>
                      Jika tombol <strong>⚡ Pasang Sekarang</strong> di atas muncul, cukup tekan tombol tersebut.
                    </li>
                    <li>
                      Jika tombol tidak muncul: Browser akan menampilkan banner kecil <strong>"Tambahkan ke Layar Utama"</strong> di bagian bawah layar HP Anda.
                    </li>
                    <li>
                      Ikon <strong>Rekap Cengkeh</strong> akan langsung terpasang di menu HP seperti aplikasi Play Store.
                    </li>
                  </ol>
                </div>

                {/* Option 2: HP iPhone / iPad (iOS Safari) */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Untuk iPhone / iPad (Safari)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Apple mewajibkan instalasi PWA melalui tombol Bagikan (Share):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Share className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">1. Tekan Bagikan</div>
                        <div className="text-[11px] text-slate-500">Ikon kotak panah atas di Safari</div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">2. Ke Layar Utama</div>
                        <div className="text-[11px] text-slate-500">Pilih "Add to Home Screen"</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 3: Laptop / Komputer (PC / Mac) */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Laptop className="w-4 h-4 text-indigo-600" />
                    <span>Untuk Laptop / PC (Chrome, Edge, Brave)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Perhatikan ikon <strong>Install App (⊕ atau layar dengan panah)</strong> di ujung kanan <em>address bar</em> browser Anda, lalu klik "Install". Aplikasi akan terbuka di jendela tersendiri tanpa bilah browser.
                  </p>
                </div>
              </div>

              {/* Salin Tautan Cepat */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">Ingin membagikan ke rekan kerja?</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? '✅ Tersalin!' : 'Salin Tautan'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PWA Standalone Engine · Ringan & Aman</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
