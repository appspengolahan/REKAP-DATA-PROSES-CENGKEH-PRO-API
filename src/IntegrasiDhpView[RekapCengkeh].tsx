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
  Printer
} from 'lucide-react';
import { 
  DhpPartaiData, 
  DhpSyncLog, 
  UserRole, 
  RawRowCengkeh, 
  GasConfig 
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
  INTEGRASI_DHP_GAS_CODE 
} from './dhpService[RekapCengkeh]';
import { formatKg, formatPct, exportToPdf } from './Code[RekapCengkeh]';

interface IntegrasiDhpViewProps {
  userRole: UserRole;
  gasConfig: GasConfig;
  masterRows: RawRowCengkeh[];
  onRefreshMaster: () => Promise<void>;
}

export const IntegrasiDhpViewRekapCengkeh: React.FC<IntegrasiDhpViewProps> = ({
  userRole,
  gasConfig,
  masterRows,
  onRefreshMaster
}) => {
  const [partaiList, setPartaiList] = useState<DhpPartaiData[]>(() => getCachedDhpPartai() || []);
  const [selectedPartaiId, setSelectedPartaiId] = useState<string>('PARTAI 1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<DhpSyncLog[]>(() => getDhpSyncLogs());

  // Modal States
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isGasCodeModalOpen, setIsGasCodeModalOpen] = useState<boolean>(false);
  const [isConfirmPushOpen, setIsConfirmPushOpen] = useState<boolean>(false);
  const [tempDhpId, setTempDhpId] = useState<string>(getDhpSpreadsheetId());
  const [isCopiedGasCode, setIsCopiedGasCode] = useState<boolean>(false);

  // Ambil data pertama kali saat mount jika belum ada cache
  useEffect(() => {
    if (partaiList.length === 0) {
      loadAllPartai();
    }
  }, []);

  const loadAllPartai = async () => {
    setIsLoading(true);
    setPushStatusMessage(null);
    try {
      const data = await fetchAllDhpPartai(getDhpSpreadsheetId());
      setPartaiList(data);
    } catch (err: any) {
      console.error('Error memuat data DHP:', err);
      setPushStatusMessage({
        type: 'error',
        text: `Gagal menarik kertas kerja DHP: ${err.message || 'Periksa koneksi atau ID spreadsheet'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activePartai = useMemo(() => {
    return partaiList.find((p) => p.id === selectedPartaiId) || partaiList[0];
  }, [partaiList, selectedPartaiId]);

  // Cek apakah data partai ini sudah pernah ada di Master Rows (Anti-Duplikasi)
  const duplicateInMaster = useMemo(() => {
    if (!activePartai || activePartai.status === 'kosong') return null;
    const tgl = activePartai.tanggalSelesai || activePartai.tanggalMulai;
    if (!tgl || tgl === '-' || tgl === 'Belum Tercatat') return null;

    return masterRows.find((r) => {
      // Normalisasi perbandingan tanggal & jenis
      return (
        r.rawTanggal === tgl || 
        r.tanggal === tgl || 
        (r.jenis.toLowerCase() === activePartai.jenis.toLowerCase() && tgl.includes(r.bulan) && tgl.includes(r.tahun))
      );
    });
  }, [activePartai, masterRows]);

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

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tarik Data Kertas Kerja */}
          <button
            onClick={loadAllPartai}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            title="Tarik / Refresh Kertas Kerja DHP Cengkeh dari Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Menarik DHP...' : 'Tarik Kertas Kerja DHP'}</span>
          </button>

          {/* Konfigurasi DHP */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Pengaturan ID Google Sheets DHP Kertas Kerja"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Konfigurasi ID DHP</span>
          </button>

          {/* Panduan & Kode GAS IntegrasiDHP.gs */}
          <button
            onClick={() => setIsGasCodeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 hover:border-cyan-600/50 transition-colors cursor-pointer"
            title="Lihat & Salin Kode IntegrasiDHP.gs untuk Google Apps Script Editor"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Kode GAS IntegrasiDHP.gs</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={() => exportToPdf('IntegrasiDhpCengkeh')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak / Export PDF Laporan DHP"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
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
              badgeText = 'Proses Berjalan';
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
                    <span className="text-slate-300 truncate max-w-[130px]">
                      {p?.tanggalMulai || '-'}
                    </span>
                  </div>
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
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {activePartai.status === 'selesai' && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Dryer Tuntas — Siap Kirim</span>
                  </span>
                )}
                {activePartai.status === 'berjalan' && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700/80 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Sedang Berjalan (Multi-Day Dryer)</span>
                  </span>
                )}
                {activePartai.status === 'kosong' && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Lembar Kerja Kosong
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
                <div className="text-base sm:text-lg font-bold text-blue-300">
                  {formatKg(activePartai.totalRjBasah)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Selisih: {formatKg(activePartai.selisihKg)} ({formatPct(activePartai.selisihPct)})
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

          {/* Card 2: Parameter QC & Kontrol Fisik Mesin */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Parameter Operasional Mesin & Mutu (QC Audit)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tekanan Uap</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {activePartai.qc.uapBar !== null ? `${activePartai.qc.uapBar.toFixed(2)} Bar` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Standard: 5.0 Bar</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Putaran Admoist</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {activePartai.qc.admoistRpm !== null ? `${activePartai.qc.admoistRpm.toFixed(1)} Rpm` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Standard: 35.0 Rpm</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Droplet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pemakaian Air</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {activePartai.qc.airLpm !== null ? `${activePartai.qc.airLpm.toFixed(1)} Lpm` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Liter per Menit</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>KA Pra-Rendam</span>
                </div>
                <div className="text-sm font-bold text-amber-300">
                  {activePartai.qc.kaPraRendam !== null ? `${activePartai.qc.kaPraRendam.toFixed(2)} %Mc` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Bahan Awal</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>KA Hasil Dryer</span>
                </div>
                <div className="text-sm font-bold text-emerald-300">
                  {activePartai.kaDryRata !== null ? `${activePartai.kaDryRata.toFixed(2)} %Mc` : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Target: 14.5 - 15.5%</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Line Mesin</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {activePartai.mesin}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{activePartai.qc.pengering}</div>
              </div>
            </div>
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
                    <tr key={s.sesi} className="hover:bg-slate-800/40 transition-colors">
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

            {/* Action Bar Push */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400">
                Target Sheet: <strong className="text-slate-200">{DEFAULT_MASTER_SHEET_NAME}</strong> pada Spreadsheet Master ({DEFAULT_MASTER_SPREADSHEET_ID.substring(0, 10)}...)
              </div>

              <button
                onClick={() => setIsConfirmPushOpen(true)}
                disabled={isPushing || activePartai.status === 'kosong'}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isPushing || activePartai.status === 'kosong' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Kirim 1 Baris Resmi Partai Ini ke Google Sheets Master Rekap"
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>Kirim & Simpan ke Rekap Susut Cengkeh</span>
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
              {/* Petunjuk Langkah demi Langkah */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-cyan-800/60 text-slate-300 space-y-2">
                <div className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Panduan Pemasangan di Google Apps Script Editor:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <li>Buka Spreadsheet Master: <strong className="text-white">REKAP SUSUT PROSES CENGKEH</strong>.</li>
                  <li>Di menu atas Google Sheets, klik menu: <strong className="text-white">Ekstensi &gt; Apps Script</strong>.</li>
                  <li>Di panel kiri file Apps Script, klik tombol <strong className="text-cyan-400">+ (Tambah File) &gt; Skrip</strong>.</li>
                  <li>Beri nama file persis: <code className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-mono font-bold">IntegrasiDHP.gs</code> (terpisah dari <code className="text-slate-400 font-mono">Kode.gs</code> utama).</li>
                  <li>Tempelkan (*paste*) kode di bawah ini ke dalam file <code className="text-amber-300 font-mono">IntegrasiDHP.gs</code> tersebut.</li>
                  <li>Pada file <code className="text-slate-400 font-mono">Kode.gs</code>, pastikan di dalam fungsi <code className="text-cyan-300 font-mono">doPost(e)</code> terdapat pemanggilan <code className="text-cyan-300 font-mono">var res = handleDhpPost(e); if (res) return res;</code>.</li>
                  <li>Klik tombol <strong className="text-white">Terapkan (Deploy) &gt; Kelola Penerapan &gt; Edit (Versi Baru)</strong>.</li>
                </ol>
              </div>

              {/* Code Box */}
              <div className="relative">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-t-xl">
                  <span className="font-mono text-[11px] text-slate-400 font-semibold">IntegrasiDHP.gs</span>
                  <button
                    onClick={handleCopyGasCode}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isCopiedGasCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedGasCode ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 border-x border-b border-slate-800 rounded-b-xl text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-80 leading-relaxed">
                  {INTEGRASI_DHP_GAS_CODE}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
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
