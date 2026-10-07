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
  computeRekapJenisPeriode,
  computeTrendJenis,
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
  TableProperties
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

  // 4. Periode Rentang (Default: 3 bulan terakhir 2026)
  const [periodeAwal, setPeriodeAwal] = useState<PeriodeRentang>({ bulan: 'Mei', tahun: '2026' });
  const [periodeAkhir, setPeriodeAkhir] = useState<PeriodeRentang>({ bulan: 'Agustus', tahun: '2026' });

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

  const rekapJenisPeriodeData = useMemo(() => 
    computeRekapJenisPeriode(filteredRows, periodeAwal.tahun, periodeAwal.bulan, periodeAkhir.tahun, periodeAkhir.bulan),
    [filteredRows, periodeAwal, periodeAkhir]
  );

  const trendJenisData = useMemo(() => 
    selectedTrendJenis ? computeTrendJenis(filteredRows, selectedTahun, selectedTrendJenis) : { jenis: '', data: [] },
    [filteredRows, selectedTahun, selectedTrendJenis]
  );

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

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => exportToPdf('RekapBulan')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export Tab Ini (PDF)</span>
                  </button>
                </div>
              </div>

              {/* 2 Grafik Bulanan Lengkap */}
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
                    title="Perbandingan Gld. Kering vs Rajang Kering per Bulan (Kg)"
                    onExpand={() => setExpandedChart({
                      title: 'Perbandingan Gld. Kering vs Rajang Kering per Bulan (Kg)',
                      subtitle: 'Komparasi massa bahan baku awal terhadap hasil jadi pengeringan',
                      component: <CompareColumnChartRekapCengkeh data={rekapBulanList} />
                    })}
                  />
                </div>
              </div>

              {/* Tabel Kinerja Bulanan */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Tabel Kinerja Bulanan (Januari — Desember)
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Tahun: {selectedTahun}
                  </span>
                </div>
                <TableBulanRekapCengkeh data={rekapBulanList} />
              </div>

              {/* Sub-Card: Rekap per Bulan — per Jenis Cengkeh */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      📊 Rekap per Bulan — per Jenis Cengkeh
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluasi khusus performa satu varian cengkeh di tiap bulan
                    </p>
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    <label className="text-xs font-semibold text-slate-600">Pilih Jenis:</label>
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

                <div className="mb-4">
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

                <TableBulanRekapCengkeh data={rekapBulanJenisList} />
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

              {/* 4 Highlight Varian Cards (Reference Standard) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Total Katalog Varian
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">
                      {filterOptions.jenis.length} Varian
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Terdaftar di sistem
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
                      Analisis riwayat deret waktu susut untuk varian terpilih
                    </p>
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    <label className="text-xs font-semibold text-slate-600">Pilih Jenis:</label>
                    <select
                      value={selectedTrendJenis}
                      onChange={(e) => setSelectedTrendJenis(e.target.value)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 cursor-pointer"
                    >
                      {filterOptions.jenis.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <TrendLineChartRekapCengkeh
                  data={trendJenisData.data}
                  title={`Trend Total Susut (%) — ${selectedTrendJenis}`}
                  lineColor="#1a56c4"
                  fillColor="#1a56c4"
                  onExpand={() => setExpandedChart({
                    title: `Trend Total Susut (%) — ${selectedTrendJenis}`,
                    subtitle: 'Grafik riwayat fluktuasi susut bulanan varian',
                    component: <TrendLineChartRekapCengkeh data={trendJenisData.data} lineColor="#1a56c4" fillColor="#1a56c4" />
                  })}
                />
              </div>

              {/* Card 2: Perbandingan Susut Antar Seluruh Jenis */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Perbandingan Total Susut Rata-rata (%) Antar Jenis Cengkeh
                </h3>
                <JenisBarChartRekapCengkeh
                  data={rekapJenisPeriodeData.list}
                  onExpand={() => setExpandedChart({
                    title: 'Perbandingan Total Susut Rata-rata (%) Antar Jenis Cengkeh',
                    subtitle: 'Peringkat persentase susut per komoditas varian',
                    component: <JenisBarChartRekapCengkeh data={rekapJenisPeriodeData.list} />
                  })}
                />
              </div>

              {/* Card 3: Tabel Rekap per Jenis Cengkeh */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Tabel Rekap Volume & Yield per Jenis Cengkeh
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {rekapJenisPeriodeData.list.length} Varian Bahan
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
