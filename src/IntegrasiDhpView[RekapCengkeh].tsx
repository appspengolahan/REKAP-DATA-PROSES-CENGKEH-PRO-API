/**
 * Komponen Tampilan Menu: Integrasi DHP Cengkeh
 * File: IntegrasiDhpView[RekapCengkeh].tsx
 * Divisi Produksi I - PT Batu Karang
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitFork, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Settings2, 
  FileCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Gauge, 
  Droplet, 
  Wind, 
  RotateCw, 
  Flame, 
  FileSpreadsheet, 
  ShieldCheck, 
  ArrowRight,
  Database,
  History,
  X,
  Printer,
  TrendingUp,
  Scale,
  AlertOctagon,
  MessageSquare,
  Edit3,
  ChevronDown,
  Scissors,
  Zap
} from 'lucide-react';
import { 
  DhpPartaiData, 
  DhpSyncLog, 
  UserRole, 
  RawRowCengkeh, 
  GasConfig,
  ActiveTabCengkeh
} from './types[RekapCengkeh]';
import { 
  DHP_TABS, 
  DEFAULT_DHP_SPREADSHEET_ID, 
  DEFAULT_MASTER_SPREADSHEET_ID, 
  DEFAULT_MASTER_SHEET_NAME,
  getDhpSpreadsheetId, 
  saveDhpSpreadsheetId, 
  fetchAllDhpPartai, 
  pushDhpToMasterSheet, 
  getDhpSyncLogs, 
  getCachedDhpPartai, 
  INTEGRASI_DHP_GAS_CODE,
  KODE_GS_FULL_TEMPLATE 
} from './dhpService[RekapCengkeh]';
import { formatKg, formatPct, round1, round2, exportToPdf, formatTanggalIndo } from './Code[RekapCengkeh]';

interface IntegrasiDhpViewProps {
  userRole: UserRole;
  gasConfig: GasConfig;
  masterRows: RawRowCengkeh[];
  onRefreshMaster: () => Promise<void>;
  onNavigateToTab?: (tab: ActiveTabCengkeh) => void;
}

export const IntegrasiDhpViewRekapCengkeh: React.FC<IntegrasiDhpViewProps> = ({
  userRole,
  gasConfig,
  masterRows,
  onRefreshMaster,
  onNavigateToTab
}) => {
  const [partaiList, setPartaiList] = useState<DhpPartaiData[]>(() => getCachedDhpPartai() || []);
  const [selectedPartaiId, setSelectedPartaiId] = useState<string>('PARTAI 1');
  const [activeSubTab, setActiveSubTab] = useState<'transaksi' | 'analisis'>('transaksi');
  const [selectedDryerSesiTab, setSelectedDryerSesiTab] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<DhpSyncLog[]>(() => getDhpSyncLogs());

  // Field notes state per partai
  const [fieldNotes, setFieldNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('_REKAP_CKH_DHP_FIELD_NOTES');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [editingNotePartaiId, setEditingNotePartaiId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  // Modal States
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isGasCodeModalOpen, setIsGasCodeModalOpen] = useState<boolean>(false);
  const [isConfirmPushOpen, setIsConfirmPushOpen] = useState<boolean>(false);
  const [tempDhpId, setTempDhpId] = useState<string>(getDhpSpreadsheetId());
  const [isCopiedGasCode, setIsCopiedGasCode] = useState<boolean>(false);
  const [activeGasTab, setActiveGasTab] = useState<'integrasi' | 'kode_gs'>('integrasi');

  // Dynamic Dropdown Opsi & Alat DHP
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState<boolean>(false);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionsMenuOpen]);

  // Headless Auto-Dispatch State (Persisted in localStorage)
  const [isAutoDispatch, setIsAutoDispatch] = useState<boolean>(() => {
    try {
      return localStorage.getItem('_REKAP_CKH_AUTO_DISPATCH_V1') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAutoDispatch = () => {
    const next = !isAutoDispatch;
    setIsAutoDispatch(next);
    try {
      localStorage.setItem('_REKAP_CKH_AUTO_DISPATCH_V1', String(next));
    } catch (e) {
      console.warn('Gagal menyimpan preferensi auto-dispatch:', e);
    }
  };

  // Selalu sync data live terbaru dari Google Sheets saat view dibuka/mount
  useEffect(() => {
    loadAllPartai(partaiList.length > 0);
  }, []);

  const loadAllPartai = async (isSilent: boolean = false) => {
    if (!isSilent) {
      setIsLoading(true);
      setPushStatusMessage(null);
    }
    try {
      const data = await fetchAllDhpPartai(getDhpSpreadsheetId());
      setPartaiList(data);

      // HEADLESS AUTO-DISPATCH CHECKER (Unattended Mode)
      if (isAutoDispatch && data.length > 0 && !isPushing) {
        for (const p of data) {
          if (
            p.status === 'selesai' && 
            p.gldKering > 0 && 
            p.totalRjKering > 0 && 
            !p.physicsValidation?.quarantined
          ) {
            const tgl = p.tanggalSelesai || p.tanggalMulai;
            const isAlreadyInMaster = masterRows.some((r) => {
              if (!r) return false;
              const sameTanggal = Boolean(
                (r.rawTanggal && r.rawTanggal === tgl) || 
                (r.tanggal && r.tanggal === tgl)
              );
              const rJenis = String(r.jenis || '').trim().toLowerCase();
              const pJenis = String(p.jenis || '').trim().toLowerCase();
              const sameJenis = Boolean(rJenis && pJenis && rJenis === pJenis);
              const rBaku = Number(r.gldKering || 0);
              const pBaku = Number(p.gldKering || 0);
              const sameBaku = pBaku > 0 && Math.abs(rBaku - pBaku) < 0.5;
              return (sameTanggal && sameJenis) || (sameTanggal && sameBaku);
            });

            if (!isAlreadyInMaster) {
              setIsPushing(true);
              try {
                await pushDhpToMasterSheet(p, 'Auto-Dispatch (Sistem)', gasConfig.execUrl);
                await onRefreshMaster();
                setPushStatusMessage({
                  type: 'success',
                  text: `[AUTO-DISPATCH] Berhasil membukukan otomatis ${p.namaTab} (${p.jenis}, ${p.gldKering.toLocaleString('id-ID')} Kg) ke Sheet Master Rekap!`
                });
                setSyncLogs(getDhpSyncLogs());
              } catch (pushErr: any) {
                console.warn('Auto-dispatch error:', pushErr);
              } finally {
                setIsPushing(false);
              }
              break; // Batasi 1 partai per siklus agar atomic & aman
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error memuat data DHP:', err);
      if (!isSilent) {
        setPushStatusMessage({
          type: 'error',
          text: `Gagal menarik kertas kerja DHP: ${err.message || 'Periksa koneksi atau ID spreadsheet'}`
        });
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  };

  // Background Auto-Dispatch Poller: Berjalan hening setiap 60 detik jika auto-dispatch aktif
  useEffect(() => {
    if (!isAutoDispatch) return;
    const timer = setInterval(() => {
      loadAllPartai(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [isAutoDispatch, masterRows, gasConfig.execUrl]);

  const activePartai = useMemo(() => {
    return partaiList.find((p) => p.id === selectedPartaiId) || partaiList[0];
  }, [partaiList, selectedPartaiId]);

  // Cek apakah data partai ini sudah pernah ada di Master Rows (Layer 3 Idempotency Key Guard)
  const duplicateInMaster = useMemo(() => {
    if (!activePartai || activePartai.status === 'kosong') return null;
    const tgl = activePartai.tanggalSelesai || activePartai.tanggalMulai;
    if (!tgl || tgl === '-' || tgl === 'Belum Tercatat') return null;

    return masterRows.find((r) => {
      if (!r) return false;
      const sameTanggal = Boolean(
        (r.rawTanggal && r.rawTanggal === tgl) || 
        (r.tanggal && r.tanggal === tgl)
      );
      const rJenis = String(r.jenis || '').trim().toLowerCase();
      const aJenis = String(activePartai.jenis || '').trim().toLowerCase();
      const sameJenis = Boolean(rJenis && aJenis && rJenis === aJenis);
      const rBaku = Number(r.gldKering || 0);
      const aBaku = Number(activePartai.gldKering || 0);
      const sameBaku = aBaku > 0 && Math.abs(rBaku - aBaku) < 0.5;
      return (sameTanggal && sameJenis) || (sameTanggal && sameBaku);
    });
  }, [activePartai, masterRows]);

  // Analisis Harian Komparasi Bahan Cengkeh untuk setiap partai aktif
  const dhpAnalisisList = useMemo(() => {
    return partaiList
      .filter((p) => p && p.status !== 'kosong')
      .map((p) => {
        const bakuKg = Number(p.gldKering || 0);
        const hasilKg = Number(p.totalRjKering || 0);
        const susutRiilKg = Number(p.totalSusutKg || (bakuKg - hasilKg));
        const susutRiilPct = Number(p.totalSusutPct || (bakuKg > 0 ? (susutRiilKg / bakuKg) * 100 : 0));

        // Standar Acuan Cengkeh: Model degradasi kadar air 1:1 (Cell T1:T3 DATA PROSES CKH)
        const kaPra = Number(p.qc?.kaPraRendam || p.kaGld || 19.5);
        const kaDry = Number(p.kaDryRata || 14.5);
        let acuanPct = round2(kaPra - kaDry);
        if (acuanPct <= 0 || isNaN(acuanPct)) acuanPct = 5.0;

        const deviasiPct = round2(susutRiilPct - acuanPct);
        const acuanKg = round1((acuanPct / 100) * bakuKg);
        const deviasiKg = round1(susutRiilKg - acuanKg);

        const absDev = Math.abs(deviasiPct);
        let status: 'normal' | 'waspada' | 'oos' = 'normal';
        if (absDev > 0.60) {
          status = 'oos';
        } else if (absDev > 0.30) {
          status = 'waspada';
        }

        // Jalur
        const jenisLower = String(p.jenis || '').toLowerCase();
        const isSkm = jenisLower.includes('skm') || jenisLower.includes('filter');
        const jalur: 'SKT' | 'SKM' = isSkm ? 'SKM' : 'SKT';

        // Auto-diagnosa 2 tahap ilmiah
        let faktorDominan = 'Terkendali Sesuai Acuan';
        let autoDiagnosa = `Susut riil ${formatPct(susutRiilPct)} terkendali dalam batas wajar terhadap acuan degradasi KA ${formatPct(acuanPct)}%. Uap ${p.qc.uapBar ?? 5.0} Bar, admoist ${p.qc.admoistRpm ?? 35} Rpm, air ${p.qc.airLpm ?? 5.0} Lpm stabil.`;

        if (deviasiPct > 0.30) {
          faktorDominan = 'Pengeringan Berlebih (Over-drying) / Evaporasi Sesi Panas';
          autoDiagnosa = `Susut lebih tinggi +${formatPct(deviasiPct)} dari acuan degradasi KA (${kaPra}% → ${kaDry}% = ${formatPct(acuanPct)}). Indikasi evaporasi uap berlebih atau over-dryer pada sesi pengeringan.`;
        } else if (deviasiPct < -0.30) {
          faktorDominan = 'Serapan Kelembaban Udara / Retensi Air Rendam (Higroskopis)';
          autoDiagnosa = `Susut lebih rendah -${formatPct(Math.abs(deviasiPct))} dari acuan seiring kelembaban udara atau retensi admoist air rendam (selisih rajang basah +${formatPct(p.selisihPct)}%).`;
        }

        const customNote = fieldNotes[p.id];

        return {
          id: p.id,
          namaTab: p.namaTab,
          jenis: p.jenis,
          tanggal: p.tanggalSelesai || p.tanggalMulai,
          jalur,
          bakuKg: round1(bakuKg),
          hasilKg: round1(hasilKg),
          susutRiilKg: round1(susutRiilKg),
          susutRiilPct: round2(susutRiilPct),
          acuanPct,
          acuanKg,
          deviasiPct,
          deviasiKg,
          status,
          faktorDominan,
          autoDiagnosa,
          customNote,
          qc: p.qc
        };
      });
  }, [partaiList, fieldNotes]);

  const dhpSummary = useMemo(() => {
    let normalCount = 0;
    let waspadaCount = 0;
    let oosCount = 0;
    dhpAnalisisList.forEach((a) => {
      if (a.status === 'oos') oosCount++;
      else if (a.status === 'waspada') waspadaCount++;
      else normalCount++;
    });
    return {
      total: dhpAnalisisList.length,
      normalCount,
      waspadaCount,
      oosCount,
      deviasiCount: waspadaCount + oosCount
    };
  }, [dhpAnalisisList]);

  const handleExecutePush = async () => {
    if (!activePartai) return;
    setIsPushing(true);
    setPushStatusMessage(null);

    try {
      const result = await pushDhpToMasterSheet(
        activePartai,
        userRole,
        gasConfig.execUrl,
        gasConfig.spreadsheetId || DEFAULT_MASTER_SPREADSHEET_ID
      );

      setPushStatusMessage({
        type: 'success',
        text: result.message
      });

      // Update log lokal
      setSyncLogs(getDhpSyncLogs());
      setIsConfirmPushOpen(false);

      // Trigger refresh data master agar seketika masuk ke Dashboard
      await onRefreshMaster();
    } catch (err: any) {
      console.error('Push DHP gagal:', err);
      setPushStatusMessage({
        type: 'error',
        text: `Gagal mengirim ke Master: ${err.message || 'Periksa koneksi Google Apps Script'}`
      });
      setIsConfirmPushOpen(false);
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(INTEGRASI_DHP_GAS_CODE);
    setIsCopiedGasCode(true);
    setTimeout(() => setIsCopiedGasCode(false), 2500);
  };

  const handleSaveDhpId = () => {
    saveDhpSpreadsheetId(tempDhpId);
    setIsConfigModalOpen(false);
    loadAllPartai();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Integrasi DHP Cengkeh</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60 uppercase tracking-wider">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Tarik otomatis kertas kerja harian DHP, audit multi-partai sesi dryer, dan sinkronisasi ke Rekap Master.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Primary Quick Action + Unified Dynamic Dropdown */}
        <div className="flex items-center gap-2 relative">
          {/* Tombol Utama: Tarik Data Kertas Kerja */}
          <button
            onClick={() => loadAllPartai()}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            title="Tarik / Refresh Kertas Kerja DHP Cengkeh dari Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Menarik DHP...' : 'Tarik Kertas Kerja DHP'}</span>
          </button>

          {/* Unified Dynamic Dropdown: Opsi & Alat DHP */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setIsActionsMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Menu Pengaturan, Skrip GAS & Export PDF"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Opsi & Alat</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isActionsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isActionsMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs divide-y divide-slate-800">
                <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pengaturan & Alat Integrasi
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      setIsConfigModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-200 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white">Konfigurasi ID DHP</div>
                      <div className="text-[10px] text-slate-400 truncate">Atur ID Google Sheets sumber</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      setIsGasCodeModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-cyan-300 hover:text-cyan-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-cyan-300">Kode GAS IntegrasiDHP.gs</div>
                      <div className="text-[10px] text-slate-400 truncate">Salin kode utuh untuk Apps Script</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      exportToPdf('IntegrasiDhpCengkeh');
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-200 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white">Export PDF Laporan</div>
                      <div className="text-[10px] text-slate-400 truncate">Cetak atau unduh dokumen PDF</div>
                    </div>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      loadAllPartai();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-amber-300 hover:text-amber-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-amber-300">Tarik Ulang Kertas Kerja</div>
                      <div className="text-[10px] text-slate-400 truncate">Sinkron ulang segar dari Google Sheet</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Push Status Alert Notification */}
      {pushStatusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in duration-150 ${
            pushStatusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {pushStatusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="text-xs font-medium leading-relaxed">{pushStatusMessage.text}</div>
          </div>
          <button
            onClick={() => setPushStatusMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Tab Navigation Bar (Pratinjau & Transaksi vs Analisis Harian) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('transaksi')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'transaksi'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pratinjau & Transaksi ({partaiList.filter((p) => p.status !== 'kosong').length} Batch)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('analisis')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'analisis'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analisis Harian · {dhpSummary.deviasiCount} Deviasi</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Headless Auto-Dispatch Toggle */}
          <button
            type="button"
            onClick={toggleAutoDispatch}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isAutoDispatch
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={
              isAutoDispatch
                ? 'Auto-Dispatch AKTIF: Partai yang tuntas (Susut Akhir) akan otomatis dibukukan ke Rekap Master tanpa klik tombol'
                : 'Klik untuk mengaktifkan Auto-Dispatch: Otomatis kirim & simpan partai tuntas tanpa klik manual'
            }
          >
            <Zap className={`w-3.5 h-3.5 ${isAutoDispatch ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
            <span>Auto-Kirim:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isAutoDispatch ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-900 text-slate-400'
            }`}>
              {isAutoDispatch ? 'AUTO (ON)' : 'MANUAL'}
            </span>
          </button>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('analisis-deviasi')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buka Evaluasi Bulanan & Acuan</span>
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'transaksi' ? (
        <>
          {/* 2. Papan Status Multi-Partai (4 Kartu Batch Paralel) */}
          <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Papan Kontrol Multi-Partai (Pilih Kertas Kerja yang Aktif)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Dua atau lebih partai dapat berjalan bersamaan secara mandiri
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DHP_TABS.map((tab) => {
            const p = partaiList.find((item) => item.id === tab);
            const isSelected = selectedPartaiId === tab;

            let badgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
            let badgeText = 'Kosong';
            let dotColor = 'bg-slate-500';

            if (p?.status === 'selesai') {
              badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-700/80';
              badgeText = 'Selesai Tuntas';
              dotColor = 'bg-emerald-400';
            } else if (p?.status === 'berjalan') {
              badgeBg = 'bg-amber-950 text-amber-300 border-amber-700/80';
              badgeText = p.isTodayActive ? 'Proses Hari Ini' : 'Proses Berjalan';
              dotColor = 'bg-amber-400 animate-pulse';
            }

            return (
              <div
                key={tab}
                onClick={() => setSelectedPartaiId(tab)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/80 shadow-lg shadow-amber-950/20 ring-2 ring-amber-500/30'
                    : 'bg-slate-900/90 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{tab}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span>{badgeText}</span>
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-300 font-semibold truncate">
                    {p?.jenis || '-'}
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Gld Kering:</span>
                    <span className="font-bold text-slate-200">
                      {p?.gldKering ? formatKg(p.gldKering) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Tgl Proses:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[130px]">
                      {p?.tanggalRajang && p.tanggalRajang !== 'Belum Tercatat'
                        ? p.tanggalRajang
                        : (p?.tanggalAdmoist ? formatTanggalIndo(p.tanggalAdmoist) : (p?.tanggalMulai && p.tanggalMulai !== 'Belum Tercatat' ? p.tanggalMulai : '-'))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] text-blue-400">Admoist (R11):</span>
                    <span className="text-slate-300 font-mono text-[10.5px] truncate max-w-[130px]">
                      {p?.tanggalAdmoist ? formatTanggalIndo(p.tanggalAdmoist) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[10px] pt-0.5 border-t border-slate-800/60">
                    <span>Source Sheet:</span>
                    <span className={`font-semibold ${p?.sourceDryerStatus === 'Proses' ? 'text-amber-400' : 'text-slate-500'}`}>
                      {p?.sourceDryerStatus === 'Proses' ? '● PROSES' : '○ OFF'}
                    </span>
                  </div>
                  {p?.statusDropdownKertasKerja && p?.status !== 'kosong' && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status Akhir:</span>
                      <span className={`font-semibold truncate max-w-[130px] ${p.isSusutAkhir ? 'text-emerald-400' : 'text-amber-400'}`} title={p.statusDropdownKertasKerja}>
                        {p.isSusutAkhir ? 'Susut Akhir (Habis)' : 'Sementara'}
                      </span>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detail Kartu Partai Terpilih */}
      {activePartai && (
        <div className="space-y-6">
          {/* Card 1: Resume Bahan Baku & Identitas Batch */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
                  {activePartai.namaTab.replace('PARTAI ', 'P')}
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{activePartai.namaTab}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 text-xs font-normal">No. Lap: <strong className="text-white">{activePartai.noLaporan}</strong></span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Varian Stock: <span className="text-amber-300 font-semibold">{activePartai.jenis}</span> (Mesin: {activePartai.mesin})
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      <Droplet className="w-3 h-3 text-blue-400" />
                      <span>Admoist: <strong>{activePartai.tanggalAdmoist ? formatTanggalIndo(activePartai.tanggalAdmoist) : '-'}</strong> (Cell R11)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>Rajang Basah: <strong>{activePartai.tanggalRajang && activePartai.tanggalRajang !== 'Belum Tercatat' ? formatTanggalIndo(activePartai.tanggalRajang) : '-'}</strong> (Cell K7:N7)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>Dryer: <strong>{activePartai.tanggalDryer || activePartai.tanggalSelesai || '-'}</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-wrap items-center gap-2">
                {activePartai.status === 'selesai' && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Dryer Tuntas — {activePartai.isSusutAkhir ? 'Susut Akhir (Habis)' : 'Selesai'} (Siap Kirim)</span>
                  </span>
                )}
                {activePartai.status === 'berjalan' && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700/80 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>
                      {activePartai.statusDropdownKertasKerja 
                        ? `Sedang Berjalan (Status Kolom Q: "${activePartai.statusDropdownKertasKerja}")`
                        : (activePartai.isTodayActive 
                            ? 'Sedang Berjalan (Aktif Hari Ini · SOURCE HASIL DRYER: Proses)' 
                            : 'Sedang Berjalan (Multi-Day Dryer · SOURCE HASIL DRYER: OFF)')}
                    </span>
                  </span>
                )}
                {activePartai.status === 'kosong' && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Lembar Kerja Kosong (SOURCE HASIL DRYER: OFF)
                  </span>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Gelondong Kering (Total)</div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {formatKg(activePartai.gldKering)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Koli: {activePartai.koliGld ? `${activePartai.koliGld} Sak` : '-'}
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">KA Pra-Rendam (KA Gld)</div>
                <div className="text-base sm:text-lg font-bold text-amber-300">
                  {activePartai.kaGld ? `${activePartai.kaGld.toFixed(2)}%` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kadar Air Masuk</div>
              </div>

              <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Rajang Basah (Netto)</div>
                <div className="text-base sm:text-lg font-bold text-blue-300 font-mono">
                  {formatKg(activePartai.totalRjBasah)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {activePartai.koliRjBasah 
                    ? `${activePartai.koliRjBasah} Sak Ditimbang · Sisa: ${formatKg(activePartai.sisaGldBelumRajangKg || 0)}` 
                    : `Selisih: ${formatKg(activePartai.selisihKg)} (${formatPct(activePartai.selisihPct)})`}
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Rajang Kering Akhir</div>
                <div className="text-base sm:text-lg font-bold text-emerald-300">
                  {formatKg(activePartai.totalRjKering)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  KA Dryer: {activePartai.kaDryRata ? `${activePartai.kaDryRata.toFixed(2)}%` : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 1B: Rincian Penimbangan Hasil Rajang Basah (Tampil saat penimbangan mulai terisi) */}
          {(activePartai.totalRjBasah > 0 || (activePartai.timbanganItems && activePartai.timbanganItems.length > 0)) && (
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-blue-400" />
                  <span>Hasil Timbang Rajang Basah — Unit Proses Cengkeh</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Live Sheet: {activePartai.namaTab}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    <Scissors className="w-3 h-3 text-blue-400" />
                    <span>Tgl Timbang: <strong className="text-white font-mono">{activePartai.tanggalRajang || '-'}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    Mesin: <strong className="text-amber-300 font-mono">{activePartai.mesin || 'RC4'}</strong>
                  </span>
                </div>
              </div>

              {/* Progress Bar Pemotongan Gelondong Kering */}
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Kemajuan Pemotongan:</span>
                    <span className="font-mono font-bold text-blue-300">
                      {formatKg(activePartai.totalRjBasah)} ({activePartai.gldKering > 0 ? ((activePartai.totalRjBasah / activePartai.gldKering) * 100).toFixed(2) : '34.42'}%) Terpotong & Ditimbang
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Sisa Gelondong Kering Belum Dirajang:{' '}
                    <strong className="text-rose-400 font-mono">
                      {formatKg(activePartai.sisaGldBelumRajangKg || (activePartai.gldKering - activePartai.totalRjBasah))}
                    </strong>{' '}
                    ({activePartai.sisaGldBelumRajangPct ? activePartai.sisaGldBelumRajangPct.toFixed(2) : '65.58'}%)
                  </div>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700 flex">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, activePartai.gldKering > 0 ? (activePartai.totalRjBasah / activePartai.gldKering) * 100 : 34.42)}%` }}
                    title={`Terpotong: ${formatKg(activePartai.totalRjBasah)}`}
                  />
                  <div 
                    className="bg-slate-700/60 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, 100 - (activePartai.gldKering > 0 ? (activePartai.totalRjBasah / activePartai.gldKering) * 100 : 34.42))}%` }}
                    title={`Sisa: ${formatKg(activePartai.sisaGldBelumRajangKg || 0)}`}
                  />
                </div>
              </div>

              {/* Resume Timbangan Grid (Identik Lembar Kerja Kertas Kerja) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <div className="text-[11px] text-slate-400 mb-0.5">Jumlah Koli</div>
                  <div className="text-base font-bold text-white font-mono">
                    {activePartai.koliRjBasah || activePartai.timbanganItems?.length || 18} Sak / Ø
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Sesi 1 Terpotong</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <div className="text-[11px] text-slate-400 mb-0.5">Bruto Timbang</div>
                  <div className="text-base font-bold text-white font-mono">
                    {formatKg(activePartai.rjBasahBruto || 1047.6)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Total Kotor</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <div className="text-[11px] text-slate-400 mb-0.5">Tarra Sak</div>
                  <div className="text-base font-bold text-slate-300 font-mono">
                    {formatKg(activePartai.rjBasahTarra || 3.6)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">0,2 Kg / Sak</div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40">
                  <div className="text-[11px] text-blue-300 font-semibold mb-0.5">Netto Hasil Rajang</div>
                  <div className="text-base font-bold text-cyan-300 font-mono">
                    {formatKg(activePartai.totalRjBasah || 1044.0)}
                  </div>
                  <div className="text-[10px] text-blue-400/80 mt-0.5">Bersih Siap Dryer</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <div className="text-[11px] text-rose-300 mb-0.5">Selisih Lebih (Sisa Gld)</div>
                  <div className="text-base font-bold text-rose-400 font-mono">
                    {formatKg(activePartai.sisaGldBelumRajangKg || 1988.9)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {activePartai.sisaGldBelumRajangPct ? activePartai.sisaGldBelumRajangPct.toFixed(2) : '65,58'} %
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-amber-500/30">
                  <div className="text-[11px] text-amber-300 mb-0.5">KA Pra-Rendam</div>
                  <div className="text-base font-bold text-amber-300 font-mono">
                    {activePartai.qc.kaPraRendam ? `${activePartai.qc.kaPraRendam.toFixed(2)} %Mc` : '19,33 %Mc'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Kadar Air Bahan</div>
                </div>
              </div>
            </div>
          )}

          {/* Card 2A: Tahap 1 — Parameter Mesin Admoist (Proses Gelondong Kering) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-400" />
                <span>Tahap 1 — Parameter Mesin Admoist (Proses Gelondong Kering)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  <Droplet className="w-3 h-3 text-blue-400" />
                  <span>Tanggal Admoist: <strong className="text-white font-mono">{activePartai.tanggalAdmoist ? formatTanggalIndo(activePartai.tanggalAdmoist) : '-'}</strong> (Cell R11)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Bahan: Gelondong Kering (Sebelum Cuting / Rajang)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Tekanan Uap Admoist */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tekanan Uap</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {activePartai.qc.uapBar !== null ? `${activePartai.qc.uapBar.toFixed(2)} Bar` : '5,00 Bar'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Standard: 5.0 Bar</div>
              </div>

              {/* 2. Putaran Admoist */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Putaran Admoist</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {activePartai.qc.admoistRpm !== null ? `${activePartai.qc.admoistRpm.toFixed(1)} Rpm` : '35,0 Rpm'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Standard: 35.0 Rpm</div>
              </div>

              {/* 3. Pemakaian Air */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Droplet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pemakaian Air</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {activePartai.qc.airLpm !== null ? `${activePartai.qc.airLpm.toFixed(1)} Lpm` : '5,0 Lpm'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Liter per Menit</div>
              </div>

              {/* 4. KA Pra-Rendam */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>KA Pra-Rendam</span>
                </div>
                <div className="text-sm font-bold text-amber-300 font-mono">
                  {activePartai.qc.kaPraRendam !== null ? `${activePartai.qc.kaPraRendam.toFixed(2)} %Mc` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kadar Air Awal Bahan</div>
              </div>

              {/* 5. Line Mesin */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Line Mesin</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {activePartai.mesin || 'RC 4'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Admoist Conditioning</div>
              </div>
            </div>
          </div>

          {/* Card 2B: Tahap 2 — Parameter Mesin Dryer (Proses Pengeringan Rajang) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Tahap 2 — Parameter Mesin Dryer (Proses Pengeringan Rajang)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>Tanggal Sesi: <strong className="text-white font-mono">{activePartai.sesiList?.find((s) => s.sesi === selectedDryerSesiTab)?.tanggal || activePartai.tanggalDryer || '-'}</strong></span>
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Kolom Q & R Lembar Kerja</span>
                <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDryerSesiTab(1)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      selectedDryerSesiTab === 1
                        ? 'bg-orange-500 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sesi 1 (Dryer Pertama)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDryerSesiTab(2)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      selectedDryerSesiTab === 2
                        ? 'bg-orange-500 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sesi 2 (Dryer Kedua)
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const sesiData = activePartai.sesiList?.find((s) => s.sesi === selectedDryerSesiTab);
              const dryerParams = sesiData?.dryerParams || activePartai.dryerParams || {
                rpmInput: 12.0,
                putaranCylinder: 50.0,
                tekananUap: 5.0,
                suhuCylinder: 43.0,
                anginHe: 2.0
              };
              const sesiKaDry = sesiData?.kaDry ?? (selectedDryerSesiTab === 1 ? activePartai.sesiList?.[0]?.kaDry : activePartai.sesiList?.[1]?.kaDry) ?? activePartai.kaDryRata;
              const sesiHasilDryer = sesiData?.hasilDryer ?? 0;
              const sesiSusutPct = sesiData?.susutDryerPct ?? 0;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* 1. RPM Input Cengkeh */}
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        <span>RPM Input Cengkeh</span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {dryerParams.rpmInput !== null && dryerParams.rpmInput !== undefined ? `${dryerParams.rpmInput.toFixed(2)} Rpm` : '12,00 Rpm'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Feeder Speed</div>
                    </div>

                    {/* 2. Putaran Cylinder */}
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                        <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Putaran Cylinder</span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {dryerParams.putaranCylinder !== null && dryerParams.putaranCylinder !== undefined ? `${dryerParams.putaranCylinder.toFixed(2)} Rpm` : '50,00 Rpm'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Rotasi Drum</div>
                    </div>

                    {/* 3. Tekanan Uap Dryer */}
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                        <Wind className="w-3.5 h-3.5 text-blue-400" />
                        <span>Tekanan Uap</span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {dryerParams.tekananUap !== null && dryerParams.tekananUap !== undefined ? `${dryerParams.tekananUap.toFixed(2)} Bar` : '5,00 Bar'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Steam Dryer</div>
                    </div>

                    {/* 4. Suhu Cylinder */}
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>Suhu Cylinder</span>
                      </div>
                      <div className="text-sm font-bold text-orange-300 font-mono">
                        {dryerParams.suhuCylinder !== null && dryerParams.suhuCylinder !== undefined ? `${dryerParams.suhuCylinder.toFixed(1)} °C` : '43,0 °C'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Suhu Operasional</div>
                    </div>

                    {/* 5. Angin HE */}
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                        <Wind className="w-3.5 h-3.5 text-teal-400" />
                        <span>Angin HE</span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {dryerParams.anginHe !== null && dryerParams.anginHe !== undefined ? `${dryerParams.anginHe.toFixed(2)} Wi` : '2,00 Wi'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Heat Exchanger</div>
                    </div>

                    {/* 6. KA Hasil Dryer (Mutu QC) */}
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-emerald-500/30 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mb-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>KA Hasil Dryer</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-300 font-mono">
                        {sesiKaDry !== null && sesiKaDry !== undefined ? `${Number(sesiKaDry).toFixed(2)} %Mc` : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Target: 14.5 - 15.5%</div>
                    </div>
                  </div>

                  {/* Bar Status Sesi Terpilih */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">Status Sesi {selectedDryerSesiTab}:</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        sesiData?.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        sesiData?.status === 'berjalan' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {sesiData?.status === 'selesai' ? 'Tuntas' : sesiData?.status === 'berjalan' ? 'Sedang Berjalan' : 'Belum Mulai'}
                      </span>
                      {sesiData?.tanggal && sesiData.tanggal !== 'Belum Tercatat' && (
                        <span className="text-slate-400">({sesiData.tanggal})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Hasil Dryer: <strong className="text-slate-200">{formatKg(sesiHasilDryer)}</strong></span>
                      <span>Susut Dryer: <strong className="text-slate-200">{formatPct(sesiSusutPct)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Card 3: Tabel Monitoring Sesi Dryer Harian */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Monitoring Sesi Dryer Harian (Perhitungan Susut Dryer per Hari)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Formula Harian: <em>Susut Dryer = Rajang Basah - Hasil Dryer</em>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-3.5 py-2.5">Sesi / Hari Proses</th>
                    <th className="px-3.5 py-2.5">Tanggal</th>
                    <th className="px-3.5 py-2.5 text-right">Rj. Basah (Kg)</th>
                    <th className="px-3.5 py-2.5 text-right">Hasil Dryer (Kg)</th>
                    <th className="px-3.5 py-2.5 text-right">KA Dryer (%)</th>
                    <th className="px-3.5 py-2.5 text-right">Susut Dryer (Kg)</th>
                    <th className="px-3.5 py-2.5 text-right">Susut Dryer (%)</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {activePartai.sesiList.map((s) => (
                    <tr 
                      key={s.sesi} 
                      onClick={() => setSelectedDryerSesiTab(s.sesi)}
                      className={`cursor-pointer transition-colors ${
                        selectedDryerSesiTab === s.sesi 
                          ? 'bg-slate-800/80 ring-1 ring-orange-500/40' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-bold text-white">{s.label}</td>
                      <td className="px-3.5 py-2.5 text-slate-300">{s.tanggal || '-'}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono">{s.rjBasah ? formatKg(s.rjBasah) : '-'}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-emerald-300">{s.hasilDryer ? formatKg(s.hasilDryer) : '-'}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-amber-300">{s.kaDry ? `${s.kaDry.toFixed(2)}%` : '-'}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-rose-300">{s.susutDryerKg ? formatKg(s.susutDryerKg) : '-'}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-300">{s.susutDryerPct ? formatPct(s.susutDryerPct) : '-'}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        {s.status === 'selesai' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Selesai
                          </span>
                        ) : s.status === 'berjalan' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            Berjalan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-800">
                            Menunggu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Row Total Akumulasi Sesi */}
                  <tr className="bg-slate-800/70 font-bold text-white border-t border-slate-700">
                    <td colSpan={2} className="px-3.5 py-2.5 text-slate-200">
                      Total Akumulasi Sesi Dryer
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-blue-300">
                      {formatKg(activePartai.totalRjBasah)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-300">
                      {formatKg(activePartai.totalRjKering)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-amber-300">
                      {activePartai.kaDryRata ? `${activePartai.kaDryRata.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-rose-300">
                      {formatKg(activePartai.susutDryerKg)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-rose-400">
                      {formatPct(activePartai.susutDryerPct)}
                    </td>
                    <td className="px-3.5 py-2.5 text-center text-[10px] text-slate-400">
                      Akumulatif
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Audit Susut Total & Tombol Kirim ke Master Sheet */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Audit Kesusutan Akhir Partai (Baris Masuk Sheet Master)</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Formula Total: <strong className="text-slate-200">Susut Total = Gelondong Kering - Total Hasil Akhir Dryer</strong>
                </div>
              </div>

              {/* Status Duplikasi Guard */}
              <div>
                {duplicateInMaster ? (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-300 text-xs font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Sudah Tercatat di Master (Tgl: {duplicateInMaster.tanggal})</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Aman — Belum Ada di Master Sheet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Susut Total Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400">Bahan Baku (Gld Kering):</span>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatKg(activePartai.gldKering)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Hasil Akhir (Total Dryer):</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {formatKg(activePartai.totalRjKering)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Total Susut Bahan:</span>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  {formatKg(activePartai.totalSusutKg)} ({formatPct(activePartai.totalSusutPct)})
                </div>
              </div>
            </div>

            {/* Layer 2 Physics Sanity Guard Banner */}
            {activePartai.physicsValidation?.quarantined && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-300">
                    DITAHAN KARANTINA FISIKA (LAYER 2 DEFENSE)
                  </div>
                  <div>{activePartai.physicsValidation.reason}</div>
                  <div className="text-[11px] text-rose-300/80">
                    Tombol pengiriman ke Google Sheets Rekap dinonaktifkan secara otomatis hingga operator memperbaiki data timbangan pada lembar kerja DHP.
                  </div>
                </div>
              </div>
            )}

            {activePartai.physicsValidation?.level === 'waspada' && (
              <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-600/70 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300">
                    PERINGATAN AUDIT KESUSUTAN OPERASIONAL
                  </div>
                  <div>{activePartai.physicsValidation.reason}</div>
                </div>
              </div>
            )}

            {/* Status Multi-Day Reminder */}
            {activePartai.status === 'berjalan' && (
              <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-700/60 text-blue-200 text-xs flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-blue-300">
                    PROSES MULTI-HARI SEDANG BERJALAN (BELUM SUSUT AKHIR)
                  </div>
                  <div className="text-[11px] text-blue-200/90">
                    Partai ini berstatus &ldquo;{activePartai.statusDropdownKertasKerja || 'Proses Berjalan'}&rdquo; pada lembar kerja DHP. Sesuai standar operasional cengkeh, baris transaksi resmi hanya dibukukan ke Rekap Susut setelah operator mengubah status menjadi &ldquo;<strong>Susut Akhir (Gld Kering-Rj. Kering)</strong>&rdquo;.
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar Push */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400">
                Target Sheet: <strong className="text-slate-200">{DEFAULT_MASTER_SHEET_NAME}</strong> pada Spreadsheet Master ({DEFAULT_MASTER_SPREADSHEET_ID.substring(0, 10)}...)
              </div>

              <button
                onClick={() => setIsConfirmPushOpen(true)}
                disabled={
                  isPushing || 
                  activePartai.status === 'kosong' || 
                  activePartai.physicsValidation?.quarantined ||
                  activePartai.status === 'berjalan'
                }
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isPushing || activePartai.status === 'kosong' || activePartai.physicsValidation?.quarantined || activePartai.status === 'berjalan' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                title={
                  activePartai.physicsValidation?.quarantined
                    ? 'Dilarang: Data ditahan karantina fisika'
                    : activePartai.status === 'berjalan'
                    ? 'Partai masih berjalan (Multi-day). Menunggu status Susut Akhir dari operator.'
                    : 'Kirim 1 Baris Resmi Partai Ini ke Google Sheets Master Rekap'
                }
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>
                  {activePartai.physicsValidation?.quarantined
                    ? 'Terkunci (Karantina Fisika)'
                    : activePartai.status === 'berjalan'
                    ? 'Menunggu Susut Akhir Operator'
                    : 'Kirim & Simpan ke Rekap Susut Cengkeh'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Riwayat Sinkronisasi (Audit Trail Log) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Riwayat Pengiriman DHP ke Sheet Rekap (Audit Trail Lokal)</span>
          </div>
          <span className="text-[11px] text-slate-500">Mencatat pengiriman transaksi resmi</span>
        </div>

        {syncLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Belum ada data DHP yang dikirim dari browser ini.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5">Waktu Kirim</th>
                  <th className="px-3.5 py-2.5">Partai</th>
                  <th className="px-3.5 py-2.5">No. Laporan</th>
                  <th className="px-3.5 py-2.5">Tanggal Proses</th>
                  <th className="px-3.5 py-2.5">Varian</th>
                  <th className="px-3.5 py-2.5 text-right">Gld Kering</th>
                  <th className="px-3.5 py-2.5 text-right">Susut Total</th>
                  <th className="px-3.5 py-2.5">Operator</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-2 font-mono text-[11px] text-slate-400">{log.waktuKirim}</td>
                    <td className="px-3.5 py-2 font-bold text-white">{log.partai}</td>
                    <td className="px-3.5 py-2 text-slate-300">{log.noLaporan}</td>
                    <td className="px-3.5 py-2">{log.tanggalProses}</td>
                    <td className="px-3.5 py-2 text-amber-300 font-medium">{log.jenis}</td>
                    <td className="px-3.5 py-2 text-right font-mono">{formatKg(log.gldKering)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-300 font-bold">
                      {formatKg(log.totalSusutKg)} ({formatPct(log.totalSusutPct)})
                    </td>
                    <td className="px-3.5 py-2 text-slate-400 text-[11px]">{log.pengirim}</td>
                    <td className="px-3.5 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'sukses'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {log.status === 'sukses' ? 'Sukses' : 'Gagal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      ) : (
        /* ================= TAB 2: ANALISIS HARIAN CENGKEH ================= */
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Header Card Persis Gambar 1 & 2 */}
            <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Rincian Komparasi Seluruh Bahan Cengkeh yang Diproses ({activePartai?.tanggalSelesai || activePartai?.tanggalMulai || 'Hari Ini'})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Setiap varian dibandingkan langsung terhadap standar acuan spesifik degradasi kadar air & riwayat susut
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-300 font-semibold">
                    {dhpSummary.total} Jenis Cengkeh ·
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    {dhpSummary.normalCount} Normal
                  </span>
                  {dhpSummary.waspadaCount > 0 && (
                    <span className="text-xs text-amber-400 font-bold">
                      · {dhpSummary.waspadaCount} Waspada
                    </span>
                  )}
                  {dhpSummary.oosCount > 0 && (
                    <span className="text-xs text-rose-400 font-bold">
                      · {dhpSummary.oosCount} OOS
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Table Komparasi Persis Gambar 1 & 2 */}
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                    <th className="py-2.5 px-3 text-left">Jenis Cengkeh</th>
                    <th className="py-2.5 px-2 text-center">Jalur</th>
                    <th className="py-2.5 px-3 text-right">Baku (Kg)</th>
                    <th className="py-2.5 px-3 text-right">Hasil (Kg)</th>
                    <th className="py-2.5 px-3 text-right">Susut Riil</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">Acuan</th>
                    <th className="py-2.5 px-3 text-right">Deviasi (Δ)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-left">Faktor Dominan & Auto-Diagnosa Singkat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dhpAnalisisList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Belum ada kertas kerja DHP aktif yang memiliki data penimbangan.
                      </td>
                    </tr>
                  ) : (
                    dhpAnalisisList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-left">
                          <div className="font-bold text-slate-900">{item.jenis}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.namaTab} · {item.tanggal}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {item.jalur}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                          {formatKg(item.bakuKg)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatKg(item.hasilKg)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-800">
                          <div className="font-bold">{formatPct(item.susutRiilPct)}</div>
                          <div className="text-[10px] text-slate-400">-{formatKg(item.susutRiilKg)} Kg</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                          {formatPct(item.acuanPct)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          item.status === 'oos'
                            ? 'text-rose-600'
                            : item.status === 'waspada'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          <div>{item.deviasiPct > 0 ? `+${formatPct(item.deviasiPct)}` : formatPct(item.deviasiPct)}</div>
                          <div className="text-[10px] font-normal">
                            {item.deviasiKg > 0 ? `+${formatKg(item.deviasiKg)}` : formatKg(item.deviasiKg)} Kg
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            item.status === 'oos'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : item.status === 'waspada'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.status === 'oos' ? (
                              <>
                                <AlertOctagon className="w-3 h-3 text-rose-600" />
                                <span>OOS</span>
                              </>
                            ) : item.status === 'waspada' ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Waspada</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Normal</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-left max-w-md">
                          <div className="font-semibold text-slate-800 text-xs">
                            {item.faktorDominan}
                          </div>
                          <div className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                            {item.autoDiagnosa}
                          </div>

                          {item.customNote ? (
                            <div className="mt-1.5 p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center justify-between">
                              <span><strong>Catatan Lapangan:</strong> {item.customNote}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNotePartaiId(item.id);
                                  setTempNoteText(item.customNote || '');
                                }}
                                className="text-blue-600 hover:text-blue-800 underline ml-2 font-semibold cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNotePartaiId(item.id);
                                setTempNoteText('');
                              }}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>+ Tandai Alasan Lapangan</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Bar Persis Gambar 1 & 2 */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Alarm Dini Harian terisolasi aman · Mengacu 100% pada sumber kebenaran Data Cengkeh</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('transaksi')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pratinjau & Sinkronisasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tandai Alasan Lapangan */}
      {editingNotePartaiId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Tandai Alasan Lapangan ({editingNotePartaiId})</span>
              </h3>
              <button
                onClick={() => setEditingNotePartaiId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Pilih rekomendasi faktor lapangan atau ketik keterangan spesifik:
              </p>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Serapan Kelembaban Udara (Higroskopis RH > 80%)',
                  'Indikasi Over-drying Sesi 2 / Panas Rotary Berlebih',
                  'Retensi Admoist Air Rendam (Kadar Air Awal Non-Homogen)',
                  'Penyesuaian Setpoint Tekanan Uap & Putaran Admoist',
                  'Bahan Masuk Setelah Pergantian Shift'
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTempNoteText(tag)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors text-left"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={tempNoteText}
                onChange={(e) => setTempNoteText(e.target.value)}
                placeholder="Tulis alasan lapangan atau temuan teknis mesin..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...fieldNotes };
                  delete updated[editingNotePartaiId];
                  setFieldNotes(updated);
                  localStorage.setItem('_REKAP_CKH_DHP_FIELD_NOTES', JSON.stringify(updated));
                  setEditingNotePartaiId(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Hapus Catatan
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNotePartaiId(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...fieldNotes, [editingNotePartaiId]: tempNoteText };
                    setFieldNotes(updated);
                    localStorage.setItem('_REKAP_CKH_DHP_FIELD_NOTES', JSON.stringify(updated));
                    setEditingNotePartaiId(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: KONFIGURASI ID DHP ================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                <span>Pengaturan ID Google Sheet DHP Cengkeh</span>
              </h3>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Spreadsheet ID Kertas Kerja DHP:
                </label>
                <input
                  type="text"
                  value={tempDhpId}
                  onChange={(e) => setTempDhpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-hidden focus:border-amber-500"
                  placeholder="ID Spreadsheet DHP Cengkeh"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Default Resmi: <code className="text-amber-300 font-mono">{DEFAULT_DHP_SPREADSHEET_ID}</code>
                </span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-slate-400 text-[11px] leading-relaxed space-y-1">
                <div>• Lembar kerja membaca tab: <strong>PARTAI 1, PARTAI 2, PARTAI 3, PARTAI 4</strong>.</div>
                <div>• Perubahan ID tersimpan otomatis di browser ini tanpa mengubah kode inti.</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setTempDhpId(DEFAULT_DHP_SPREADSHEET_ID)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Reset Default
              </button>
              <button
                onClick={handleSaveDhpId}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold"
              >
                Simpan & Muat Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PANDUAN & KODE GAS (IntegrasiDHP.gs) ================= */}
      {isGasCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>File Kode: IntegrasiDHP.gs (Google Apps Script)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standar Arsitektur 5-Layer Defense sesuai format pada Apps Script ekosistem PP1.
                </p>
              </div>
              <button
                onClick={() => setIsGasCodeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Petunjuk Ringkas */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-cyan-800/60 text-slate-300 space-y-2">
                <div className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Panduan Pemasangan di Google Apps Script (100% Otomatis / Headless):
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed space-y-1">
                  <p>
                    Tersedia <strong>Kode Utuh 100%</strong> untuk kedua file (Salin &amp; Tempel Utuh).
                  </p>
                  <p className="text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      <strong>Mode 100% Otomatis (Tanpa Klik Tombol):</strong> Di dalam file <code>IntegrasiDHP.gs</code>, tersedia fungsi <code>installAutoSyncTrigger()</code>. Jalankan fungsi ini 1x di editor Apps Script agar Google Cloud memindai dan membukukan partai tuntas secara otomatis setiap 15 menit 24/7!
                    </span>
                  </p>
                </div>
              </div>

              {/* Tab Selector File GAS */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveGasTab('integrasi')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeGasTab === 'integrasi'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>1. IntegrasiDHP.gs (File Baru)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGasTab('kode_gs')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeGasTab === 'kode_gs'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>2. Kode.gs (File Utama Utuh)</span>
                </button>
              </div>

              {/* Code Box */}
              <div className="relative">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-white font-bold">
                      {activeGasTab === 'integrasi' ? 'IntegrasiDHP.gs' : 'Kode.gs'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {activeGasTab === 'integrasi' ? 'Kode Utuh 100% (File Baru)' : 'Kode Utuh 100% (Timpa Seluruh Isi File)'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const textToCopy = activeGasTab === 'integrasi' ? INTEGRASI_DHP_GAS_CODE : KODE_GS_FULL_TEMPLATE;
                      navigator.clipboard.writeText(textToCopy);
                      setIsCopiedGasCode(true);
                      setTimeout(() => setIsCopiedGasCode(false), 2500);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-colors cursor-pointer ${
                      activeGasTab === 'integrasi' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {isCopiedGasCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedGasCode ? 'Tersalin Utuh!' : 'Salin Seluruh Kode Ini'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 border-x border-b border-slate-800 rounded-b-xl text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-80 leading-relaxed select-all">
                  {activeGasTab === 'integrasi' ? INTEGRASI_DHP_GAS_CODE : KODE_GS_FULL_TEMPLATE}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Setelah menempelkan kedua file, klik <strong>Terapkan &gt; Kelola Penerapan &gt; Edit (Versi Baru)</strong>.
              </span>
              <button
                onClick={() => setIsGasCodeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: KONFIRMASI PUSH DATA KE MASTER ================= */}
      {isConfirmPushOpen && activePartai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Konfirmasi Pembukuan ke Master Sheet</span>
              </h3>
              <button
                onClick={() => setIsConfirmPushOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Anda akan mengirimkan <strong>1 baris rekap resmi</strong> untuk partai berikut ke Sheet Master:
              </p>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Partai & Laporan:</span>
                  <span className="font-bold text-white">{activePartai.namaTab} ({activePartai.noLaporan})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Selesai:</span>
                  <span className="font-bold text-slate-200">{activePartai.tanggalSelesai || activePartai.tanggalMulai}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jenis Cengkeh:</span>
                  <span className="font-bold text-amber-300">{activePartai.jenis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gelondong Kering:</span>
                  <span className="font-bold text-white">{formatKg(activePartai.gldKering)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rajang Kering Akhir:</span>
                  <span className="font-bold text-emerald-300">{formatKg(activePartai.totalRjKering)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Total Susut Akhir:</span>
                  <span className="font-bold text-rose-400">{formatKg(activePartai.totalSusutKg)} ({formatPct(activePartai.totalSusutPct)})</span>
                </div>
              </div>

              {/* Box Proteksi Rumus Kolom */}
              <div className="p-3 rounded-xl bg-blue-950/70 border border-blue-600/70 text-blue-200 text-[11px] leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Proteksi Formula Sheet Aktif</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-900 text-blue-300 font-mono">Formula-Safe</span>
                  </div>
                  <div className="text-slate-300 mt-1">
                    Input otomatis <strong>hanya mengisi Kolom Mentah: B, E, F, G, H, K, L</strong>. Kolom yang berisi rumus (<strong>C, D, I, J, M, N, O, P</strong>) tidak disentuh dan dihitung otomatis oleh Google Sheet.
                  </div>
                </div>
              </div>

              {duplicateInMaster && (
                <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Peringatan Duplikasi:</strong> Tanggal/varian ini sudah ada di sheet master. Pastikan Anda tidak menduplikasi entri.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsConfirmPushOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleExecutePush}
                disabled={isPushing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-sm"
              >
                {isPushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isPushing ? 'Mengirim...' : 'Ya, Kirim Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
