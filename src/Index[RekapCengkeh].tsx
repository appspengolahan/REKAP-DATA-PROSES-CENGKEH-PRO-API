/**
 * Main Web App View & Controller
 * File: Index[RekapCengkeh].tsx
 * Reference: https://rekap-dataproses-tembakau-pro.vercel.app/
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RawRowCengkeh, 
  PeriodeRentang, 
  UserRole,
  GasConfig
} from './types[RekapCengkeh]';
import { 
  loadCachedDataset, 
  saveCachedDataset, 
  getGasConfig, 
  saveGasConfig,
  computeFilterOptions,
  getEntriTerkini,
  computeRingkasan,
  computeRingkasanPeriode,
  computeRekapBulan,
  computeRekapBulanPeriode,
  sortRekapBulanTerbaru,
  makePeriodeLabel,
  computeRekapJenisPeriode,
  computeRekapJenisSemua,
  computeTrendJenis,
  computeTrendJenisPeriode,
  round1,
  round2,
  fetchFromGVizCsv,
  fetchFromGasRest,
  exportToPdf,
  formatKg,
  formatPct
} from './Code[RekapCengkeh]';
import { HeaderRekapCengkeh } from './Header[RekapCengkeh]';
import { SidebarRekapCengkeh } from './Sidebar[RekapCengkeh]';
import { ExecutiveSummaryCardsRekapCengkeh } from './Cards[RekapCengkeh]';
import { 
  TrendLineChartRekapCengkeh, 
  CompareColumnChartRekapCengkeh, 
  JenisBarChartRekapCengkeh 
} from './Charts[RekapCengkeh]';
import { 
  TableBulanRekapCengkeh, 
  TableJenisRekapCengkeh, 
  BatchExplorerTableRekapCengkeh 
} from './Tables[RekapCengkeh]';
import { HelpModalRekapCengkeh } from './HelpModal[RekapCengkeh]';
import { SwitchBoardModalRekapCengkeh } from './SwitchBoardModal[RekapCengkeh]';
import { GasCenterModalRekapCengkeh } from './GasCenterModal[RekapCengkeh]';
import { ChartExpandedModalRekapCengkeh } from './ChartExpandedModal[RekapCengkeh]';
import { INITIAL_SNAPSHOT_DATA } from './snapshotData[RekapCengkeh]';
import { 
  LayoutDashboard, 
  Calendar, 
  Layers, 
  Table, 
  Printer, 
  Search,
  Sparkles,
  TrendingUp,
  Scale,
  Award,
  AlertTriangle,
  CheckCircle2,
  TableProperties,
  Eye,
  EyeOff,
  Filter,
  SlidersHorizontal
} from 'lucide-react';

const SIDEBAR_COLLAPSED_KEY = '_REKAP_CKH_SIDEBAR_COLLAPSED';

export const IndexRekapCengkeh: React.FC = () => {
  // 1. Dataset state (Instant 0.01s boot)
  const [rows, setRows] = useState<RawRowCengkeh[]>(() => loadCachedDataset());
  const [gasConfig, setGasConfig] = useState<GasConfig>(() => getGasConfig());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPullingDatasheet, setIsPullingDatasheet] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // 2. Sidebar Collapsed state (stored in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // 3. Global Filters
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [bulanRingkasan, setBulanRingkasan] = useState<string>('Semua');
  const [userRole, setUserRole] = useState<UserRole>('Project Manager');
  const [jalurProses, setJalurProses] = useState<'Semua' | 'SKT' | 'SKM'>('Semua');

  // 4. Periode Rentang di Tab Rekap Jenis (Default: Agustus - Oktober 2026 seperti pada GAS Lama)
  const [periodeAwal, setPeriodeAwal] = useState<PeriodeRentang>({ bulan: 'Agustus', tahun: '2026' });
  const [periodeAkhir, setPeriodeAkhir] = useState<PeriodeRentang>({ bulan: 'Oktober', tahun: '2026' });
  // Mode Periode di Tab Rekap Jenis: 'rentang' (kustom) atau 'semua' (seluruh data historis)
  const [modePeriodeJenis, setModePeriodeJenis] = useState<'rentang' | 'semua'>('rentang');

  // 4b. Periode Rentang di Tab Rekap Bulan
  const [modePeriodeBulan, setModePeriodeBulan] = useState<'rentang' | 'semua'>('rentang');
  const [periodeBulanAwal, setPeriodeBulanAwal] = useState<PeriodeRentang>({ bulan: 'Januari', tahun: '2026' });
  const [periodeBulanAkhir, setPeriodeBulanAkhir] = useState<PeriodeRentang>({ bulan: 'Desember', tahun: '2026' });
  const [selectedJenisBulan, setSelectedJenisBulan] = useState<string>('Semua');
  const [showSubVarianBulan, setShowSubVarianBulan] = useState<boolean>(false);

  // 5. Active Tab ('dashboard', 'rekap-bulan', 'rekap-jenis', 'data-explorer')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rekap-bulan' | 'rekap-jenis' | 'data-explorer'>('dashboard');

  // 6. Sub-filters for specific cards
  const [selectedBulanJenis, setSelectedBulanJenis] = useState<string>('');
  const [selectedTrendJenis, setSelectedTrendJenis] = useState<string>('');

  // 7. Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSwitchBoardOpen, setIsSwitchBoardOpen] = useState(false);
  const [isGasCenterOpen, setIsGasCenterOpen] = useState(false);
  const [expandedChart, setExpandedChart] = useState<{ title: string; subtitle?: string; component: React.ReactNode } | null>(null);

  // Filter options from raw rows
  const filterOptions = useMemo(() => computeFilterOptions(rows), [rows]);

  useEffect(() => {
    if (filterOptions.jenis.length > 0) {
      if (!selectedBulanJenis || !filterOptions.jenis.includes(selectedBulanJenis)) {
        setSelectedBulanJenis(filterOptions.jenis[0]);
      }
      if (!selectedTrendJenis || !filterOptions.jenis.includes(selectedTrendJenis)) {
        setSelectedTrendJenis(filterOptions.jenis[0]);
      }
    }
  }, [filterOptions.jenis, selectedBulanJenis, selectedTrendJenis]);

  const entriTerkini = useMemo(() => getEntriTerkini(rows), [rows]);

  // Filter rows based on Jalur (if applicable)
  const filteredRows = useMemo(() => {
    return rows;
  }, [rows]);

  // Aggregated calculations
  const ringkasanTahunan = useMemo(() => 
    computeRingkasan(filteredRows, selectedTahun, undefined, 'tahunan'), 
    [filteredRows, selectedTahun]
  );

  const ringkasanBulanan = useMemo(() => 
    computeRingkasan(filteredRows, selectedTahun, bulanRingkasan, 'bulanan'), 
    [filteredRows, selectedTahun, bulanRingkasan]
  );

  const ringkasanPeriode = useMemo(() => 
    computeRingkasanPeriode(filteredRows, periodeAwal.tahun, periodeAwal.bulan, periodeAkhir.tahun, periodeAkhir.bulan),
    [filteredRows, periodeAwal, periodeAkhir]
  );

  const rekapBulanList = useMemo(() => 
    computeRekapBulan(filteredRows, selectedTahun, 'Semua'),
    [filteredRows, selectedTahun]
  );

  const rekapBulanJenisList = useMemo(() => 
    selectedBulanJenis ? computeRekapBulan(filteredRows, selectedTahun, selectedBulanJenis) : [],
    [filteredRows, selectedTahun, selectedBulanJenis]
  );

  // Perhitungan Dinamis untuk Tab Rekap per Bulan (Mendukung Rentang Periode Kustom & Filter Jenis)
  const rekapBulanPeriodeList = useMemo(() => {
    if (modePeriodeBulan === 'semua') {
      return computeRekapBulanPeriode(filteredRows, undefined, undefined, undefined, undefined, selectedJenisBulan);
    }
    return computeRekapBulanPeriode(
      filteredRows,
      periodeBulanAwal.tahun,
      periodeBulanAwal.bulan,
      periodeBulanAkhir.tahun,
      periodeBulanAkhir.bulan,
      selectedJenisBulan
    );
  }, [filteredRows, modePeriodeBulan, periodeBulanAwal, periodeBulanAkhir, selectedJenisBulan]);

  const labelPeriodeBulan = useMemo(() => {
    if (modePeriodeBulan === 'semua') return 'Semua Periode (Akumulasi Data Historis)';
    return makePeriodeLabel(periodeBulanAwal.bulan, periodeBulanAwal.tahun, periodeBulanAkhir.bulan, periodeBulanAkhir.tahun);
  }, [modePeriodeBulan, periodeBulanAwal, periodeBulanAkhir]);

  const ringkasanBulanPeriode = useMemo(() => {
    if (modePeriodeBulan === 'semua') {
      return computeRingkasan(filteredRows, 'Semua', undefined, 'tahunan');
    }
    return computeRingkasanPeriode(
      filteredRows,
      periodeBulanAwal.tahun,
      periodeBulanAwal.bulan,
      periodeBulanAkhir.tahun,
      periodeBulanAkhir.bulan
    );
  }, [filteredRows, modePeriodeBulan, periodeBulanAwal, periodeBulanAkhir]);

  const rekapJenisPeriodeData = useMemo(() => {
    if (modePeriodeJenis === 'semua') {
      return computeRekapJenisSemua(filteredRows);
    }
    return computeRekapJenisPeriode(filteredRows, periodeAwal.tahun, periodeAwal.bulan, periodeAkhir.tahun, periodeAkhir.bulan);
  }, [filteredRows, modePeriodeJenis, periodeAwal, periodeAkhir]);

  // Otomatis arahkan jenis cengkeh terpilih jika varian berubah
  useEffect(() => {
    if (rekapJenisPeriodeData.list.length > 0) {
      const exists = rekapJenisPeriodeData.list.some(item => item.label === selectedTrendJenis);
      if (!exists) {
        setSelectedTrendJenis(rekapJenisPeriodeData.list[0].label);
      }
    }
  }, [rekapJenisPeriodeData.list, selectedTrendJenis]);

  const trendJenisData = useMemo(() => {
    if (!selectedTrendJenis) return { jenis: '', data: [] };
    if (modePeriodeJenis === 'rentang') {
      return computeTrendJenisPeriode(
        filteredRows, 
        selectedTrendJenis, 
        periodeAwal.tahun, 
        periodeAwal.bulan, 
        periodeAkhir.tahun, 
        periodeAkhir.bulan
      );
    }
    return computeTrendJenis(filteredRows, selectedTahun, selectedTrendJenis);
  }, [filteredRows, selectedTrendJenis, modePeriodeJenis, periodeAwal, periodeAkhir, selectedTahun]);

  // Pull datasheet langsung (GViz CSV)
  const handlePullDatasheet = async () => {
    setIsPullingDatasheet(true);
    setSyncNotice(null);
    try {
      const fresh = await fetchFromGVizCsv(gasConfig.spreadsheetId, gasConfig.sheetName);
      if (fresh && fresh.length > 0) {
        setRows(fresh);
        saveCachedDataset(fresh);
        const updatedConfig = {
          ...gasConfig,
          lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
        };
        setGasConfig(updatedConfig);
        saveGasConfig(updatedConfig);
        setSyncNotice(`✅ Berhasil menarik ${fresh.length} baris data langsung dari datasheet "${gasConfig.sheetName}"!`);
      }
    } catch (err: any) {
      setSyncNotice(`⚠️ Gagal menarik datasheet: ${err.message || 'Koneksi lembar kerja'}. Menggunakan cache lokal.`);
    } finally {
      setIsPullingDatasheet(false);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  // Sync background via REST / GViz
  const syncWithCloud = useCallback(async (isManual = false) => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      let freshRows: RawRowCengkeh[] | null = null;
      if (gasConfig.execUrl && gasConfig.execUrl.includes('/exec')) {
        try {
          freshRows = await fetchFromGasRest(gasConfig.execUrl);
        } catch (gasErr) {
          console.warn('Tier 1 GAS REST pull error, trying Tier 2 GViz CSV:', gasErr);
        }
      }
      if (!freshRows || freshRows.length === 0) {
        freshRows = await fetchFromGVizCsv(gasConfig.spreadsheetId, gasConfig.sheetName);
      }
      if (freshRows && freshRows.length > 0) {
        setRows(freshRows);
        saveCachedDataset(freshRows);
        const updatedConfig = {
          ...gasConfig,
          lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
        };
        setGasConfig(updatedConfig);
        saveGasConfig(updatedConfig);
        if (isManual) {
          setSyncNotice(`✅ Data berhasil diperbarui (${freshRows.length} baris)!`);
        }
      }
    } catch (err: any) {
      if (isManual) {
        setSyncNotice(`⚠️ Sinkronisasi awan tertunda: ${err.message || 'Koneksi'}. Data tetap aman dari cache lokal.`);
      }
    } finally {
      setIsSyncing(false);
      if (isManual) setTimeout(() => setSyncNotice(null), 4000);
    }
  }, [gasConfig]);

  useEffect(() => {
    const timer = setTimeout(() => syncWithCloud(false), 1200);
    return () => clearTimeout(timer);
  }, [syncWithCloud]);

  const handleForceRebuildCache = () => {
    setRows(INITIAL_SNAPSHOT_DATA);
    saveCachedDataset(INITIAL_SNAPSHOT_DATA);
    const updatedCfg = { ...gasConfig, lastSyncedAt: 'Reset snapshot awal' };
    setGasConfig(updatedCfg);
    saveGasConfig(updatedCfg);
    setIsGasCenterOpen(false);
    setSyncNotice('✅ Cache lokal berhasil di-reset ke snapshot awal!');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleToggleVerify = (srcRow: number) => {
    if (userRole === 'Vendor') return;
    const updated = rows.map((r) => r.srcRow === srcRow ? { ...r, verified: !r.verified } : r);
    setRows(updated);
    saveCachedDataset(updated);
  };

  // 4 Highlight Cards for Variant Tab
  const sortedVariants = [...rekapJenisPeriodeData.list];
  const topVariantVol = sortedVariants[0];
  const sortedByYield = [...sortedVariants].sort((a, b) => a.totalSusutPct - b.totalSusutPct);
  const bestYieldVariant = sortedByYield[0];
  const highestSusutVariant = sortedByYield[sortedByYield.length - 1];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-row font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Industrial Dark Sidebar (Reference Standard) */}
      <SidebarRekapCengkeh
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        userRole={userRole}
        onOpenGasCenter={() => setIsGasCenterOpen(true)}
      />

      {/* 2. Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <HeaderRekapCengkeh
          entriTerkini={entriTerkini}
          userRole={userRole}
          onRoleChange={setUserRole}
          jalurProses={jalurProses}
          onJalurProsesChange={setJalurProses}
          onRefresh={() => syncWithCloud(true)}
          onPullDatasheet={handlePullDatasheet}
          isSyncing={isSyncing}
          isPullingDatasheet={isPullingDatasheet}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenSwitchBoard={() => setIsSwitchBoardOpen(true)}
          onOpenGasCenter={() => setIsGasCenterOpen(true)}
          onExportPdf={() => {
            if (activeTab === 'dashboard') exportToPdf('Ringkasan');
            else if (activeTab === 'rekap-bulan') exportToPdf('RekapBulan');
            else if (activeTab === 'rekap-jenis') exportToPdf('RekapJenis');
            else exportToPdf('DataBatch');
          }}
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Tablet & Mobile Quick Nav Bar */}
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-print">
          {[
            { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
            { id: 'rekap-bulan' as const, label: 'Rekap Bulan', icon: Calendar },
            { id: 'rekap-jenis' as const, label: 'Rekap Jenis', icon: Layers },
            { id: 'data-explorer' as const, label: 'Data Explorer', icon: Table }
          ].map((tab) => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isAct
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Notification Banner */}
          {syncNotice && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between no-print animate-in fade-in duration-150">
              <span className="font-medium">{syncNotice}</span>
              <button
                onClick={() => setSyncNotice(null)}
                className="text-blue-700 hover:text-blue-900 font-bold ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {/* VIEW 1: DASHBOARD KESUSUTAN */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header Tab Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Executive Summary & Dashboard Kesusutan</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      Tahun {selectedTahun}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluasi komprehensif performa rendaman dan hasil dryer proses cengkeh
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                    <span className="text-slate-500 font-medium">Tahun:</span>
                    <select
                      value={selectedTahun}
                      onChange={(e) => setSelectedTahun(e.target.value)}
                      className="font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
                    >
                      <option value="Semua">Semua Tahun</option>
                      {filterOptions.tahun.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => exportToPdf('Dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>
                </div>
              </div>

              {/* 4 Highlight Cards & Summary Grids */}
              <ExecutiveSummaryCardsRekapCengkeh
                ringkasanTahunan={ringkasanTahunan}
                ringkasanBulanan={ringkasanBulanan}
                ringkasanPeriode={ringkasanPeriode}
                rekapBulan={rekapBulanList}
                bulanRingkasan={bulanRingkasan}
                onBulanRingkasanChange={setBulanRingkasan}
                monthsList={filterOptions.bulan}
                yearsList={filterOptions.tahun}
                periodeAwal={periodeAwal}
                periodeAkhir={periodeAkhir}
                onPeriodeChange={(awal, akhir) => {
                  setPeriodeAwal(awal);
                  setPeriodeAkhir(akhir);
                }}
                onApplyPeriode={() => {}}
              />

              {/* Quick Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <TrendLineChartRekapCengkeh
                    data={rekapBulanList}
                    title="Tren Total Susut Rata-rata (%) per Bulan"
                    lineColor="#1a56c4"
                    fillColor="#1a56c4"
                    onExpand={() => setExpandedChart({
                      title: 'Tren Total Susut Rata-rata (%) per Bulan',
                      subtitle: 'Visualisasi deret waktu persentase susut bulanan cengkeh',
                      component: <TrendLineChartRekapCengkeh data={rekapBulanList} lineColor="#1a56c4" fillColor="#1a56c4" />
                    })}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <CompareColumnChartRekapCengkeh
                    data={rekapBulanList}
                    title="Perbandingan Gld. Kering vs Rajang Kering (Kg)"
                    onExpand={() => setExpandedChart({
                      title: 'Perbandingan Gld. Kering vs Rajang Kering (Kg)',
                      subtitle: 'Komparasi massa bahan baku awal terhadap hasil jadi pengeringan',
                      component: <CompareColumnChartRekapCengkeh data={rekapBulanList} />
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: REKAP PER BULAN */}
          {activeTab === 'rekap-bulan' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header Tab Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Rekapitulasi Kinerja Bulanan (Time-Series & Deviasi)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Analisis fluktuasi susut, rasio rendaman, dan evaluasi dryer per bulan
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                    Periode: {labelPeriodeBulan}
                  </span>
                  {selectedJenisBulan !== 'Semua' && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                      Jenis: {selectedJenisBulan}
                    </span>
                  )}
                  <button
                    onClick={() => exportToPdf('RekapBulan')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export Tab Ini (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Control Card: Filter Rentang Periode & Varian Cengkeh (Standar Rekap Bulanan) */}
              <div className="bg-white border border-[#e1e5ec] rounded-2xl p-4 shadow-2xs space-y-3 no-print">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Filter Periode:
                    </span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setModePeriodeBulan('rentang')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          modePeriodeBulan === 'rentang'
                            ? 'bg-[#1a56c4] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📅 Rentang Periode Tertentu
                      </button>
                      <button
                        type="button"
                        onClick={() => setModePeriodeBulan('semua')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          modePeriodeBulan === 'semua'
                            ? 'bg-[#1a56c4] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🌐 Akumulasi Semua Data
                      </button>
                    </div>
                  </div>

                  {/* Shortcut Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-slate-500 font-medium text-[11px]">Shortcut:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setModePeriodeBulan('rentang');
                        setPeriodeBulanAwal({ bulan: 'Agustus', tahun: '2026' });
                        setPeriodeBulanAkhir({ bulan: 'Oktober', tahun: '2026' });
                      }}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        modePeriodeBulan === 'rentang' && periodeBulanAwal.bulan === 'Agustus' && periodeBulanAwal.tahun === '2026' && periodeBulanAkhir.bulan === 'Oktober' && periodeBulanAkhir.tahun === '2026'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ⚡ Agustus – Oktober 2026
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModePeriodeBulan('rentang');
                        setPeriodeBulanAwal({ bulan: 'Januari', tahun: '2026' });
                        setPeriodeBulanAkhir({ bulan: 'Desember', tahun: '2026' });
                      }}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        modePeriodeBulan === 'rentang' && periodeBulanAwal.bulan === 'Januari' && periodeBulanAwal.tahun === '2026' && periodeBulanAkhir.bulan === 'Desember' && periodeBulanAkhir.tahun === '2026'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Tahun 2026 Penuh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModePeriodeBulan('rentang');
                        setPeriodeBulanAwal({ bulan: 'Januari', tahun: '2025' });
                        setPeriodeBulanAkhir({ bulan: 'Desember', tahun: '2025' });
                      }}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        modePeriodeBulan === 'rentang' && periodeBulanAwal.bulan === 'Januari' && periodeBulanAwal.tahun === '2025' && periodeBulanAkhir.bulan === 'Desember' && periodeBulanAkhir.tahun === '2025'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Tahun 2025 Penuh
                    </button>
                    <button
                      type="button"
                      onClick={() => setModePeriodeBulan('semua')}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        modePeriodeBulan === 'semua'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Semua Tahun
                    </button>
                  </div>
                </div>

                {/* Sub-bar: Rentang Form Dropdowns + Filter Jenis Cengkeh */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {modePeriodeBulan === 'rentang' ? (
                      <>
                        <span className="font-semibold text-slate-700">Dari:</span>
                        <select
                          value={periodeBulanAwal.bulan}
                          onChange={(e) => setPeriodeBulanAwal({ ...periodeBulanAwal, bulan: e.target.value })}
                          className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                        >
                          {filterOptions.bulan.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={periodeBulanAwal.tahun}
                          onChange={(e) => setPeriodeBulanAwal({ ...periodeBulanAwal, tahun: e.target.value })}
                          className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                        >
                          {filterOptions.tahun.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>

                        <span className="font-semibold text-slate-700 ml-1">sampai</span>
                        <select
                          value={periodeBulanAkhir.bulan}
                          onChange={(e) => setPeriodeBulanAkhir({ ...periodeBulanAkhir, bulan: e.target.value })}
                          className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                        >
                          {filterOptions.bulan.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={periodeBulanAkhir.tahun}
                          onChange={(e) => setPeriodeBulanAkhir({ ...periodeBulanAkhir, tahun: e.target.value })}
                          className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                        >
                          {filterOptions.tahun.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <span className="text-slate-500 font-medium italic">
                        Menampilkan seluruh data historis dari awal hingga akhir pencatatan
                      </span>
                    )}

                    <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

                    {/* Filter Jenis Cengkeh (Menyatukan filter jenis ke dalam 1 tampilan bersih) */}
                    <div className="flex items-center gap-1.5">
                      <label className="font-semibold text-slate-700">Jenis Cengkeh:</label>
                      <select
                        value={selectedJenisBulan}
                        onChange={(e) => setSelectedJenisBulan(e.target.value)}
                        className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                      >
                        <option value="Semua">Semua Jenis (Agregat)</option>
                        {filterOptions.jenis.map((j) => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 ml-auto flex items-center gap-1 font-medium">
                    🔗 Menyesuaikan matrik grafik dan tabel data bulanan
                  </span>
                </div>
              </div>

              {/* Mini KPI Bar Periode Terpilih */}
              {ringkasanBulanPeriode && (
                <div className="bg-white border border-[#e1e5ec] rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      📊 Ringkasan Metrik Bulanan ({labelPeriodeBulan})
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      {ringkasanBulanPeriode.jumlahData} entri proses
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                    <div className="bg-[#fafbfd] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-medium uppercase">Input Gld. Kering</span>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{formatKg(ringkasanBulanPeriode.gldKering)}</div>
                    </div>
                    <div className="bg-[#fafbfd] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-medium uppercase">Hasil Rj. Kering</span>
                      <div className="text-sm font-bold text-blue-700 mt-0.5">{formatKg(ringkasanBulanPeriode.rjKering)}</div>
                    </div>
                    <div className="bg-[#fafbfd] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-medium uppercase">Selisih (%)</span>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">{formatPct(ringkasanBulanPeriode.selisihPct)}</div>
                    </div>
                    <div className="bg-[#fafbfd] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-medium uppercase">Susut Dryer (%)</span>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">{formatPct(ringkasanBulanPeriode.susutDryerPct)}</div>
                    </div>
                    <div className="bg-[#fafbfd] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-medium uppercase">Total Susut Rata²</span>
                      <div className="text-sm font-bold text-[#0d3a8a] mt-0.5">{formatPct(ringkasanBulanPeriode.totalSusutPct)}</div>
                    </div>
                    <div className="bg-[#fafbfd] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-medium uppercase">Kadar Air Rata²</span>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5">
                        {ringkasanBulanPeriode.kaGldRata !== null ? `${ringkasanBulanPeriode.kaGldRata}%` : '-'} / {ringkasanBulanPeriode.kaDryRata !== null ? `${ringkasanBulanPeriode.kaDryRata}%` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Matrik Grafik (2 Grafik Bulanan Lengkap Menyesuaikan Rentang Periode) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <TrendLineChartRekapCengkeh
                    data={rekapBulanPeriodeList}
                    title={`Tren Total Susut Rata-rata (%) per Bulan ${selectedJenisBulan !== 'Semua' ? `(${selectedJenisBulan})` : ''}`}
                    lineColor="#1a56c4"
                    fillColor="#1a56c4"
                    onExpand={() => setExpandedChart({
                      title: `Tren Total Susut Rata-rata (%) per Bulan ${selectedJenisBulan !== 'Semua' ? `(${selectedJenisBulan})` : ''}`,
                      subtitle: `Visualisasi deret waktu persentase susut bulanan cengkeh (${labelPeriodeBulan})`,
                      component: <TrendLineChartRekapCengkeh data={rekapBulanPeriodeList} lineColor="#1a56c4" fillColor="#1a56c4" />
                    })}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <CompareColumnChartRekapCengkeh
                    data={rekapBulanPeriodeList}
                    title={`Perbandingan Gld. Kering vs Rajang Kering per Bulan (Kg) ${selectedJenisBulan !== 'Semua' ? `(${selectedJenisBulan})` : ''}`}
                    onExpand={() => setExpandedChart({
                      title: `Perbandingan Gld. Kering vs Rajang Kering per Bulan (Kg) ${selectedJenisBulan !== 'Semua' ? `(${selectedJenisBulan})` : ''}`,
                      subtitle: `Komparasi massa bahan baku awal terhadap hasil jadi pengeringan (${labelPeriodeBulan})`,
                      component: <CompareColumnChartRekapCengkeh data={rekapBulanPeriodeList} />
                    })}
                  />
                </div>
              </div>

              {/* Tabel Kinerja Bulanan (Urutan: Periode bulan terbaru di paling atas, terlama di paling bawah) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tabel Kinerja Bulanan ({labelPeriodeBulan})
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Urutan data teratas adalah periode bulan terbaru dan paling bawah periode bulan terlama
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {selectedJenisBulan === 'Semua' ? 'Semua Jenis Cengkeh' : selectedJenisBulan}
                    </span>
                  </div>
                </div>

                {/* Render 1 Tabel Kinerja Bulanan yang Efisien & Tidak Dobel */}
                <TableBulanRekapCengkeh data={rekapBulanPeriodeList} />
              </div>

              {/* Opsi Tambahan: Tampilkan/Sembunyikan Grafik Perbandingan Sub-Varian (Tanpa Duplikasi Tabel) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs no-print">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Analisis Rincian Per Varian Cengkeh
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {showSubVarianBulan 
                          ? 'Panel rincian varian sedang terbuka. Tabel data duplikat telah dihilangkan agar tampilan lebih efisien.' 
                          : 'Tabel berulang disembunyikan agar tampilan lebih efisien dan ringkas. Buka panel untuk melihat grafik khusus per varian.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSubVarianBulan(!showSubVarianBulan)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {showSubVarianBulan ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        <span>Sembunyikan Rincian</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Tampilkan Rincian</span>
                      </>
                    )}
                  </button>
                </div>

                {showSubVarianBulan && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          📊 Grafik Trend Bulanan per Varian Cengkeh
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Pilih varian untuk melihat tren persentase susut spesifik
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600">Pilih Varian:</label>
                        <select
                          value={selectedBulanJenis}
                          onChange={(e) => setSelectedBulanJenis(e.target.value)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 cursor-pointer"
                        >
                          {filterOptions.jenis.map((j) => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <TrendLineChartRekapCengkeh
                        data={rekapBulanJenisList}
                        title={`Trend Total Susut Bulanan — ${selectedBulanJenis}`}
                        lineColor="#1a56c4"
                        fillColor="#1a56c4"
                        onExpand={() => setExpandedChart({
                          title: `Trend Total Susut Bulanan — ${selectedBulanJenis}`,
                          subtitle: 'Grafik bulanan spesifik varian cengkeh terpilih',
                          component: <TrendLineChartRekapCengkeh data={rekapBulanJenisList} lineColor="#1a56c4" fillColor="#1a56c4" />
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: REKAP PER JENIS CENGKEH */}
          {activeTab === 'rekap-jenis' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header Tab Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Rekapitulasi per Jenis Cengkeh & Material Yield
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluasi peringkat yield, susut, dan volume seluruh varian cengkeh
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                    Periode: {rekapJenisPeriodeData.periodeLabel}
                  </span>
                  <button
                    onClick={() => exportToPdf('RekapJenis')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export Tab Ini (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Control Card: Filter & Toggle Rentang Periode (Persis Standar GAS Lama) */}
              <div className="bg-white border border-[#e1e5ec] rounded-2xl p-4 shadow-2xs space-y-3 no-print">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Filter Periode:
                    </span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setModePeriodeJenis('rentang')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          modePeriodeJenis === 'rentang'
                            ? 'bg-[#1a56c4] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📅 Rentang Periode Tertentu
                      </button>
                      <button
                        type="button"
                        onClick={() => setModePeriodeJenis('semua')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          modePeriodeJenis === 'semua'
                            ? 'bg-[#1a56c4] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🌐 Akumulasi Semua Data
                      </button>
                    </div>
                  </div>

                  {/* Shortcut Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-slate-500 font-medium text-[11px]">Shortcut:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setModePeriodeJenis('rentang');
                        setPeriodeAwal({ bulan: 'Agustus', tahun: '2026' });
                        setPeriodeAkhir({ bulan: 'Oktober', tahun: '2026' });
                      }}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        modePeriodeJenis === 'rentang' && periodeAwal.bulan === 'Agustus' && periodeAwal.tahun === '2026' && periodeAkhir.bulan === 'Oktober' && periodeAkhir.tahun === '2026'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ⚡ Agustus – Oktober 2026
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModePeriodeJenis('rentang');
                        setPeriodeAwal({ bulan: 'Januari', tahun: '2026' });
                        setPeriodeAkhir({ bulan: 'Desember', tahun: '2026' });
                      }}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        modePeriodeJenis === 'rentang' && periodeAwal.bulan === 'Januari' && periodeAwal.tahun === '2026' && periodeAkhir.bulan === 'Desember' && periodeAkhir.tahun === '2026'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Tahun 2026 Penuh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModePeriodeJenis('rentang');
                        setPeriodeAwal({ bulan: 'Januari', tahun: '2025' });
                        setPeriodeAkhir({ bulan: 'Desember', tahun: '2025' });
                      }}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        modePeriodeJenis === 'rentang' && periodeAwal.bulan === 'Januari' && periodeAwal.tahun === '2025' && periodeAkhir.bulan === 'Desember' && periodeAkhir.tahun === '2025'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Tahun 2025 Penuh
                    </button>
                  </div>
                </div>

                {/* Form Dropdown Periode (Muncul jika mode 'rentang') */}
                {modePeriodeJenis === 'rentang' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">Dari</span>
                    <select
                      value={periodeAwal.bulan}
                      onChange={(e) => setPeriodeAwal({ ...periodeAwal, bulan: e.target.value })}
                      className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                    >
                      {filterOptions.bulan.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={periodeAwal.tahun}
                      onChange={(e) => setPeriodeAwal({ ...periodeAwal, tahun: e.target.value })}
                      className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                    >
                      {filterOptions.tahun.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <span className="font-semibold text-slate-700 ml-1">sampai</span>
                    <select
                      value={periodeAkhir.bulan}
                      onChange={(e) => setPeriodeAkhir({ ...periodeAkhir, bulan: e.target.value })}
                      className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                    >
                      {filterOptions.bulan.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={periodeAkhir.tahun}
                      onChange={(e) => setPeriodeAkhir({ ...periodeAkhir, tahun: e.target.value })}
                      className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer font-medium"
                    >
                      {filterOptions.tahun.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <span className="text-[11px] text-slate-500 ml-auto flex items-center gap-1 font-medium">
                      🔗 Mengatur metrik, grafik, dan tabel varian di bawah
                    </span>
                  </div>
                )}
              </div>

              {/* Mini KPI Summary Bar Periode Terpilih (Sesuai Referensi Gambar 3) */}
              {modePeriodeJenis === 'rentang' && ringkasanPeriode && (
                <div className="bg-white border border-[#e1e5ec] rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        📆 Rekap Rentang Periode ({ringkasanPeriode.periodeLabel})
                      </h3>
                    </div>
                    <span className="text-[11px] bg-[#eef3fd] text-[#0d3a8a] px-2.5 py-0.5 rounded-full font-semibold">
                      {ringkasanPeriode.jumlahData} Entri
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Jumlah Data</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{ringkasanPeriode.jumlahData} entri</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Gld. Kering</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{formatKg(ringkasanPeriode.gldKering)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Rajang Basah</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{formatKg(ringkasanPeriode.rjBasah)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Selisih Rata²</div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5">{formatPct(ringkasanPeriode.selisihPct)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{formatKg(ringkasanPeriode.selisihKg)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Rajang Kering</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{formatKg(ringkasanPeriode.rjKering)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Susut Dryer Rata²</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{formatPct(ringkasanPeriode.susutDryerPct)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{formatKg(ringkasanPeriode.susutDryerKg)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Total Susut Rata²</div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5">{formatPct(ringkasanPeriode.totalSusutPct)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Min {formatPct(ringkasanPeriode.totalSusutMinPct)} - Max {formatPct(ringkasanPeriode.totalSusutMaxPct)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">K. Air Gld / Dry</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {ringkasanPeriode.kaGldRata !== null ? ringkasanPeriode.kaGldRata.toFixed(1) + '%' : '-'} / {ringkasanPeriode.kaDryRata !== null ? ringkasanPeriode.kaDryRata.toFixed(1) + '%' : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4 Highlight Varian Cards (Reference Standard) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Total Varian Terfilter
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">
                      {rekapJenisPeriodeData.list.length} Varian
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Di periode terpilih
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Varian Volume Terbesar
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[140px]">
                      {topVariantVol ? topVariantVol.label : '-'}
                    </div>
                    <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                      {topVariantVol ? formatKg(topVariantVol.gldKering) : '-'}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Varian Paling Hemat (Optimal)
                    </div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5 truncate max-w-[140px]">
                      {bestYieldVariant ? bestYieldVariant.label : '-'}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                      Susut: {bestYieldVariant ? formatPct(bestYieldVariant.totalSusutPct) : '-'}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Varian Susut Tertinggi (Evaluasi)
                    </div>
                    <div className="text-sm font-bold text-rose-700 mt-0.5 truncate max-w-[140px]">
                      {highestSusutVariant ? highestSusutVariant.label : '-'}
                    </div>
                    <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                      Susut: {highestSusutVariant ? formatPct(highestSusutVariant.totalSusutPct) : '-'}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Card 1: Trend Susut per Varian Individu */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      📈 Trend Susut Rata-rata per Bulan per Jenis Cengkeh
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Analisis riwayat fluktuasi susut untuk varian terpilih di periode {rekapJenisPeriodeData.periodeLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    <label className="text-xs font-semibold text-slate-600">Pilih Jenis:</label>
                    <select
                      value={selectedTrendJenis}
                      onChange={(e) => setSelectedTrendJenis(e.target.value)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 cursor-pointer"
                    >
                      {rekapJenisPeriodeData.list.map((j) => (
                        <option key={j.label} value={j.label}>{j.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <TrendLineChartRekapCengkeh
                  data={trendJenisData.data}
                  title={`Trend Total Susut — ${selectedTrendJenis}`}
                  lineColor="#1a56c4"
                  fillColor="#1a56c4"
                  onExpand={() => setExpandedChart({
                    title: `Trend Total Susut — ${selectedTrendJenis}`,
                    subtitle: 'Grafik riwayat fluktuasi susut bulanan varian',
                    component: <TrendLineChartRekapCengkeh data={trendJenisData.data} lineColor="#1a56c4" fillColor="#1a56c4" />
                  })}
                />
              </div>

              {/* Card 2: Perbandingan Susut Antar Seluruh Jenis */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Perbandingan Total Susut Rata-rata per Jenis Cengkeh (%)
                </h3>
                <JenisBarChartRekapCengkeh
                  data={rekapJenisPeriodeData.list}
                  onExpand={() => setExpandedChart({
                    title: 'Perbandingan Total Susut Rata-rata per Jenis Cengkeh (%)',
                    subtitle: 'Peringkat persentase susut per komoditas varian',
                    component: <JenisBarChartRekapCengkeh data={rekapJenisPeriodeData.list} />
                  })}
                />
              </div>

              {/* Card 3: Tabel Rekap per Jenis Cengkeh (Persis Standar Gambar 1) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Tabel Rekap per Jenis Cengkeh
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {rekapJenisPeriodeData.list.length} Varian Bahan Terproses
                  </span>
                </div>
                <TableJenisRekapCengkeh data={rekapJenisPeriodeData.list} />
              </div>
            </div>
          )}

          {/* VIEW 4: DATA EXPLORER BATCH */}
          {activeTab === 'data-explorer' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Data Explorer Batch (Audit & Baris Mentah)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pencarian spesifik nomor partai, tanggal proses, atau varian pada data riil
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => exportToPdf('DataBatch')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export Tab Ini (PDF)</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <BatchExplorerTableRekapCengkeh
                  rows={filteredRows}
                  onToggleVerify={handleToggleVerify}
                />
              </div>
            </div>
          )}
        </main>

        {/* Footer Web App Resmi Sesuai Ketentuan */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            Monitoring Board — Rekap Data Proses Cengkeh All Rights Reserved . Divisi Produksi I . Developed by Lalu Mahendra 
          </div>
        </footer>

        {/* Footer Cetak .PDF Resmi Sesuai Ketentuan */}
        <div className="pdf-print-footer">
          Divisi Produksi I - All Rights Reserved
        </div>
      </div>

      {/* Modals Suite */}
      <HelpModalRekapCengkeh
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onlineStatus={!syncNotice?.includes('Gagal')}
      />

      <SwitchBoardModalRekapCengkeh
        isOpen={isSwitchBoardOpen}
        onClose={() => setIsSwitchBoardOpen(false)}
      />

      <GasCenterModalRekapCengkeh
        isOpen={isGasCenterOpen}
        onClose={() => setIsGasCenterOpen(false)}
        config={gasConfig}
        onSaveConfig={setGasConfig}
        onForceRebuildCache={handleForceRebuildCache}
        onManualSync={() => syncWithCloud(true)}
        isSyncing={isSyncing}
      />

      {/* Zoom Chart Modal */}
      {expandedChart && (
        <ChartExpandedModalRekapCengkeh
          isOpen={true}
          onClose={() => setExpandedChart(null)}
          title={expandedChart.title}
          subtitle={expandedChart.subtitle}
        >
          {expandedChart.component}
        </ChartExpandedModalRekapCengkeh>
      )}
    </div>
  );
};
