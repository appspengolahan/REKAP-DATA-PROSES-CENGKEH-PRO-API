/**
 * Saldo Akhir Bahan View Component
 * File: SaldoBahanView[RekapCengkeh].tsx
 * Divisi Produksi I (PP1) - PT Batu Karang
 * Monitoring Posisi Stok & Saldo Akhir Terbaru Setiap Jenis Bahan di Unit Cengkeh
 */
import React, { useState, useMemo } from 'react';
import { ItemSaldoBahan, RingkasanSaldoBahan } from './types[RekapCengkeh]';
import { formatKg, formatPct } from './Code[RekapCengkeh]';
import { 
  Boxes, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ArrowUpDown, 
  Maximize2, 
  Database, 
  Scale, 
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Warehouse
} from 'lucide-react';

interface SaldoBahanViewProps {
  saldoData: {
    list: ItemSaldoBahan[];
    ringkasan: RingkasanSaldoBahan;
  };
  onExportPdf: () => void;
  onExpandChart?: (title: string, subtitle: string, component: React.ReactNode) => void;
}

export const SaldoBahanViewRekapCengkeh: React.FC<SaldoBahanViewProps> = ({
  saldoData,
  onExportPdf,
  onExpandChart
}) => {
  const { list, ringkasan } = saldoData;

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState<'Semua' | 'Bahan Baku' | 'WIP' | 'Bahan Jadi'>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aman' | 'Waspada' | 'Kritis'>('Semua');
  const [sortBy, setSortBy] = useState<'saldo-desc' | 'saldo-asc' | 'nama-asc'>('saldo-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filtered & Sorted items
  const filteredList = useMemo(() => {
    return list
      .filter((item) => {
        if (filterKategori !== 'Semua' && item.kategori !== filterKategori) return false;
        if (filterStatus !== 'Semua' && item.status !== filterStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.namaBahan.toLowerCase().includes(q) ||
            item.kodeBahan.toLowerCase().includes(q) ||
            item.lokasi.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'saldo-desc') return b.saldoAkhirKg - a.saldoAkhirKg;
        if (sortBy === 'saldo-asc') return a.saldoAkhirKg - b.saldoAkhirKg;
        return a.namaBahan.localeCompare(b.namaBahan);
      });
  }, [list, filterKategori, filterStatus, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Download CSV
  const handleDownloadCsv = () => {
    const headers = [
      'Kode Bahan',
      'Nama Jenis Bahan',
      'Kategori',
      'Tahap',
      'Total Masuk (Kg)',
      'Terproses/Keluar (Kg)',
      'Saldo Akhir (Kg)',
      'Kadar Air (% KA)',
      'Lokasi Penyimpanan',
      'Tanggal Update',
      'Status Stok'
    ];
    const rows = filteredList.map((item) => [
      `"${item.kodeBahan}"`,
      `"${item.namaBahan}"`,
      `"${item.kategori}"`,
      `"${item.tahap}"`,
      item.masukKg,
      item.keluarKg,
      item.saldoAkhirKg,
      item.kaRata ?? '-',
      `"${item.lokasi}"`,
      `"${item.tglUpdate}"`,
      `"${item.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Saldo_Akhir_Bahan_Cengkeh_${ringkasan.tglTerkini.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badge styling
  const renderStatusBadge = (status: 'Aman' | 'Waspada' | 'Kritis') => {
    if (status === 'Aman') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Aman
        </span>
      );
    }
    if (status === 'Waspada') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Waspada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3 h-3 text-rose-600" />
        Kritis
      </span>
    );
  };

  // Top varieties for Bar Chart
  const topVarietiesForChart = useMemo(() => {
    return list
      .filter((i) => i.kategori === 'Bahan Jadi')
      .sort((a, b) => b.saldoAkhirKg - a.saldoAkhirKg)
      .slice(0, 10);
  }, [list]);

  const maxChartSaldo = Math.max(...topVarietiesForChart.map((v) => v.saldoAkhirKg), 1000) * 1.15;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Saldo Akhir Terbaru Setiap Jenis Bahan — Unit Cengkeh</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold font-mono">
              PP1 Cengkeh
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>Posisi persediaan bahan baku gelondong, WIP rajang basah, dan cengkeh rajang kering siap pakai</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
              Update: {ringkasan.tglTerkini}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Unduh seluruh data saldo ke file format .CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak atau simpan tampilan tab saldo akhir ini ke PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Tab Ini (PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards: 4 Pilar Saldo Bahan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saldo Persediaan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Saldo Unit Cengkeh
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatKg(ringkasan.totalSaldoKg)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Akumulasi dari {ringkasan.totalVarian} varian cengkeh aktif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Saldo Bahan Baku Gelondong Kering */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bahan Baku Gelondong
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-cyan-900 font-mono tracking-tight">
              {formatKg(ringkasan.saldoBahanBakuKg)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Silo Unit Cengkeh PP1</span>
              <span className="font-semibold text-cyan-700 font-mono">
                {ringkasan.totalSaldoKg > 0 ? formatPct((ringkasan.saldoBahanBakuKg / ringkasan.totalSaldoKg) * 100) : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Saldo WIP Rajang Basah */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              WIP Rajang Basah
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-amber-900 font-mono tracking-tight">
              {formatKg(ringkasan.saldoWipKg)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Lantai Antrian Dryer</span>
              <span className="font-semibold text-amber-700 font-mono">
                {ringkasan.totalSaldoKg > 0 ? formatPct((ringkasan.saldoWipKg / ringkasan.totalSaldoKg) * 100) : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Saldo Rajang Kering Siap Pakai */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rajang Kering (Siap Pakai)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-emerald-900 font-mono tracking-tight">
              {formatKg(ringkasan.saldoBahanJadiKg)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Gudang Penyangga Kering</span>
              <span className="font-semibold text-emerald-700 font-mono">
                {ringkasan.totalSaldoKg > 0 ? formatPct((ringkasan.saldoBahanJadiKg / ringkasan.totalSaldoKg) * 100) : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Dua Grafik Komparasi Saldo Bahan (Bisa di-Expand!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Proporsi & Distribusi Saldo per Kategori */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Distribusi Saldo per Kategori Bahan</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">3 Kategori Alur</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Komposisi persediaan unit cengkeh dari bahan mentah gelondong hingga output rajang kering
            </p>

            <div className="space-y-4">
              {/* Kategori 1: Bahan Jadi */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                    <span>Cengkeh Rajang Kering (Siap Pakai)</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    {formatKg(ringkasan.saldoBahanJadiKg)}
                  </span>
                </div>
                <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${ringkasan.totalSaldoKg > 0 ? (ringkasan.saldoBahanJadiKg / ringkasan.totalSaldoKg) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-emerald-700/80 mt-1 flex justify-between">
                  <span>Output dryer terverifikasi</span>
                  <span>
                    {ringkasan.totalSaldoKg > 0 ? formatPct((ringkasan.saldoBahanJadiKg / ringkasan.totalSaldoKg) * 100) : '0%'}
                  </span>
                </div>
              </div>

              {/* Kategori 2: Bahan Baku */}
              <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-200/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-cyan-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600"></span>
                    <span>Cengkeh Gelondong Kering (Input)</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-800">
                    {formatKg(ringkasan.saldoBahanBakuKg)}
                  </span>
                </div>
                <div className="w-full bg-cyan-200/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${ringkasan.totalSaldoKg > 0 ? (ringkasan.saldoBahanBakuKg / ringkasan.totalSaldoKg) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-cyan-700/80 mt-1 flex justify-between">
                  <span>Persediaan cadangan siap proses</span>
                  <span>
                    {ringkasan.totalSaldoKg > 0 ? formatPct((ringkasan.saldoBahanBakuKg / ringkasan.totalSaldoKg) * 100) : '0%'}
                  </span>
                </div>
              </div>

              {/* Kategori 3: WIP */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-600"></span>
                    <span>WIP Rajang Basah (Proses Berjalan)</span>
                  </span>
                  <span className="font-mono font-bold text-amber-800">
                    {formatKg(ringkasan.saldoWipKg)}
                  </span>
                </div>
                <div className="w-full bg-amber-200/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${ringkasan.totalSaldoKg > 0 ? (ringkasan.saldoWipKg / ringkasan.totalSaldoKg) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-amber-700/80 mt-1 flex justify-between">
                  <span>Antrian perajangan & drying</span>
                  <span>
                    {ringkasan.totalSaldoKg > 0 ? formatPct((ringkasan.saldoWipKg / ringkasan.totalSaldoKg) * 100) : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Stok Aktif PP1:</span>
            <span className="font-bold text-slate-800 font-mono">{formatKg(ringkasan.totalSaldoKg)}</span>
          </div>
        </div>

        {/* Right Card: Grafik Balok Saldo Akhir Bahan per Jenis Cengkeh (Support Expand Modal!) */}
        <div 
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs group cursor-pointer hover:border-blue-300 transition-all"
          onClick={() => {
            if (onExpandChart) {
              onExpandChart(
                'Grafik Komparasi Saldo Akhir Tiap Jenis Bahan Cengkeh',
                `Posisi saldo persediaan siap pakai terbaru per varietas cengkeh di PP1 (Total: ${formatKg(ringkasan.saldoBahanJadiKg)})`,
                <div className="p-4 space-y-4">
                  <div className="text-xs text-slate-600 mb-2 font-medium">
                    Peringkat ketersediaan stok cengkeh rajang kering siap pakai per varian cengkeh:
                  </div>
                  <div className="space-y-3">
                    {topVarietiesForChart.map((v, i) => {
                      const pct = (v.saldoAkhirKg / maxChartSaldo) * 100;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">{v.namaBahan}</span>
                            <span className="font-mono font-bold text-blue-800">{formatKg(v.saldoAkhirKg)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden flex items-center">
                            <div 
                              className="bg-blue-600 h-full rounded-lg transition-all" 
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                <span>Grafik Balok Saldo Akhir per Jenis Bahan</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.2 rounded font-semibold">
                  Rajang Kering Siap Pakai
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Peringkat volume saldo akhir cengkeh rajang kering tiap varian
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Perbesar</span>
            </div>
          </div>

          {/* Mini SVG Bar Chart */}
          <div className="pt-2 pb-1 space-y-2.5">
            {topVarietiesForChart.map((item, idx) => {
              const widthPct = Math.min(100, Math.max(8, (item.saldoAkhirKg / maxChartSaldo) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[240px]">
                      {item.namaBahan.replace(' (Rajang Kering)', '')}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-slate-400 font-normal">KA: {item.kaRata ? item.kaRata + '%' : '-'}</span>
                      <span className="font-bold text-slate-900">{formatKg(item.saldoAkhirKg)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-600 transition-colors">
            <span className="flex items-center gap-1 font-medium">
              <Maximize2 className="w-3 h-3" />
              <span>Klik kartu grafik ini untuk perbesar ke tengah layar</span>
            </span>
            <span className="text-[10px] bg-slate-50 group-hover:bg-blue-50 px-2 py-0.5 rounded text-slate-500 group-hover:text-blue-700 font-semibold border border-slate-200 group-hover:border-blue-200">
              Maximize
            </span>
          </div>
        </div>
      </div>

      {/* 4. Section Tabel Saldo Akhir Komprehensif */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        {/* Controls: Search, Filters & Sorting */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs no-print pb-3 border-b border-slate-100">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari jenis bahan, kode, lokasi..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Filter Pills & Sorters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kategori */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['Semua', 'Bahan Jadi', 'Bahan Baku', 'WIP'] as const).map((kat) => (
                <button
                  key={kat}
                  type="button"
                  onClick={() => {
                    setFilterKategori(kat);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterKategori === kat
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['Semua', 'Aman', 'Waspada', 'Kritis'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setFilterStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <button
              type="button"
              onClick={() => {
                setSortBy((prev) => 
                  prev === 'saldo-desc' ? 'saldo-asc' : prev === 'saldo-asc' ? 'nama-asc' : 'saldo-desc'
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {sortBy === 'saldo-desc' ? 'Saldo Terbesar ↓' : sortBy === 'saldo-asc' ? 'Saldo Terkecil ↑' : 'Nama A-Z'}
              </span>
            </button>
          </div>
        </div>

        {/* Tabel Data Saldo Akhir */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#fafbfd] text-[#6b7280] font-semibold border-b border-[#e1e5ec]">
                <th className="py-2.5 px-3 text-left">Kode Bahan</th>
                <th className="py-2.5 px-3 text-left">Jenis & Nama Bahan</th>
                <th className="py-2.5 px-3 text-left">Kategori Alur</th>
                <th className="py-2.5 px-3 text-right">Akumulasi Masuk (Kg)</th>
                <th className="py-2.5 px-3 text-right">Terproses (Kg)</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Saldo Akhir (Kg)</th>
                <th className="py-2.5 px-3 text-center">KA (%)</th>
                <th className="py-2.5 px-3 text-left">Lokasi Unit Cengkeh</th>
                <th className="py-2.5 px-3 text-left">Update Terakhir</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-400 bg-white">
                    Tidak ada data saldo bahan yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  return (
                    <tr key={item.id || idx} className="hover:bg-[#f8fafc] transition-colors border-b border-[#e1e5ec]">
                      <td className="py-2.5 px-3 text-left font-mono text-[11px] font-semibold text-slate-600">
                        {item.kodeBahan}
                      </td>
                      <td className="py-2.5 px-3 text-left font-semibold text-[#1f2937]">
                        {item.namaBahan}
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.kategori === 'Bahan Jadi'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.kategori === 'Bahan Baku'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {Number(item.masukKg).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {Number(item.keluarKg).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900 bg-blue-50/40">
                        {Number(item.saldoAkhirKg).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-xs">
                        {item.kaRata ? item.kaRata.toFixed(1) + '%' : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-left text-slate-600 text-xs">
                        <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={item.lokasi}>
                          <Warehouse className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.lokasi}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-left text-slate-500 text-xs whitespace-nowrap">
                        {item.tglUpdate}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {renderStatusBadge(item.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-500 no-print">
          <div>
            Menampilkan <strong className="text-slate-800">{paginatedList.length}</strong> dari{' '}
            <strong className="text-slate-800">{filteredList.length}</strong> jenis bahan
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
