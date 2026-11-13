/**
 * Data Tables Component
 * File: Tables[RekapCengkeh].tsx
 * Styling: Exact Divisi Produksi I Visual Standard (Consistent with Index[RekapCengkeh].html)
 */
import React, { useState, useMemo, useEffect } from 'react';
import { RekapItemCengkeh, RawRowCengkeh } from './types[RekapCengkeh]';
import { formatKg, formatPct, formatDec1, formatDec2, getPctClass, formatTanggalIndo, MONTH_ORDER, cleanDate } from './Code[RekapCengkeh]';
import { cleanJenisCengkeh } from './dhpService[RekapCengkeh]';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, ArrowUpDown } from 'lucide-react';

// ===== 1. TABEL REKAP BULANAN =====
interface TableBulanProps {
  data: RekapItemCengkeh[];
  initialSort?: 'desc' | 'asc';
}

export const TableBulanRekapCengkeh: React.FC<TableBulanProps> = React.memo(({ data, initialSort = 'desc' }) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => {
      const getVal = (item: RekapItemCengkeh) => {
        const parts = item.label ? item.label.split(' ') : [];
        const y = Number(item.tahun || parts[1] || 0);
        const bName = item.bulan || parts[0] || '';
        const mIdx = MONTH_ORDER.indexOf(bName);
        return y * 12 + (mIdx >= 0 ? mIdx : 0);
      };
      const valA = getVal(a);
      const valB = getVal(b);
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [data, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const pagedData = useMemo(
    () => sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedData, currentPage]
  );

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-[#6b7280] text-xs bg-white">
        Tidak ada data bulanan untuk periode ini.
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500 no-print">
        <span className="text-[11px]">
          Menampilkan <strong className="text-slate-800">{sortedData.length}</strong> periode bulan
        </span>
        <button
          type="button"
          onClick={() => {
            setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
            setCurrentPage(1);
          }}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1a56c4] bg-[#eef3fd] hover:bg-blue-100 px-3 py-1.5 min-h-[44px] lg:min-h-[34px] rounded-lg cursor-pointer transition-colors border border-blue-200"
          title="Klik untuk mengubah urutan periode bulan"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Urutan: {sortOrder === 'desc' ? 'Terbaru ↓ Terlama' : 'Terlama ↑ Terbaru'}</span>
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#fafbfd] text-[#6b7280] font-semibold">
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">
                Bulan <span className="text-[10px] font-normal text-[#1a56c4] bg-[#eef3fd] px-1.5 py-0.5 rounded ml-1">
                  {sortOrder === 'desc' ? 'Terbaru ↓' : 'Terlama ↑'}
                </span>
              </th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Jumlah Data</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Gld. Kering (Kg)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Rj. Kering (Kg)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Selisih (%)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Susut Dryer (%)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Total Susut (%)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Min (%)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Max (%)</th>
            </tr>
          </thead>
          <tbody>
            {pagedData.map((r, i) => {
              const pClass = getPctClass(r.totalSusutPct);
              return (
                <tr key={r.label || i} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937] font-semibold whitespace-nowrap">{r.label}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{r.jumlahData}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec1(r.gldKering)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec1(r.rjKering)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec2(r.selisihPct)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec2(r.susutDryerPct)}
                  </td>
                  <td className={`py-2 px-2.5 text-right border-b border-[#e1e5ec] font-mono font-medium ${
                    pClass === 'pct-high' ? 'text-[#c0392b] font-bold' : pClass === 'pct-low' ? 'text-[#1b8a5a] font-bold' : 'text-[#1f2937]'
                  }`}>
                    {formatDec2(r.totalSusutPct)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#6b7280] font-mono">
                    {formatDec2(r.minPct)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#6b7280] font-mono">
                    {formatDec2(r.maxPct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#6b7280] pt-1 no-print">
          <div>
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
              aria-label="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
              aria-label="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ===== 2. TABEL REKAP PER JENIS CENGKEH =====
interface TableJenisProps {
  data: RekapItemCengkeh[];
}

export const TableJenisRekapCengkeh: React.FC<TableJenisProps> = React.memo(({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'susut'>('volume');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return data
      .filter((d) => d.label.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === 'volume') return b.gldKering - a.gldKering;
        return b.totalSusutPct - a.totalSusutPct;
      });
  }, [data, searchTerm, sortBy]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const pagedRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage]
  );

  return (
    <div className="space-y-3">
      {/* Sub-filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs no-print">
        <div className="relative min-w-[220px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari jenis cengkeh..."
            className="w-full pl-8 pr-3 py-1.5 min-h-[44px] lg:min-h-[36px] rounded-md border border-[#e1e5ec] text-xs bg-white text-[#1f2937] placeholder-[#6b7280]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#6b7280] flex-wrap">
          <span>Urutkan:</span>
          <button
            type="button"
            onClick={() => { setSortBy('volume'); setCurrentPage(1); }}
            className={`px-3 py-1.5 min-h-[44px] lg:min-h-[34px] rounded border border-[#e1e5ec] cursor-pointer ${
              sortBy === 'volume' ? 'bg-[#1a56c4] text-white font-semibold' : 'bg-white text-[#1f2937]'
            }`}
          >
            Volume (Kg)
          </button>
          <button
            type="button"
            onClick={() => { setSortBy('susut'); setCurrentPage(1); }}
            className={`px-3 py-1.5 min-h-[44px] lg:min-h-[34px] rounded border border-[#e1e5ec] cursor-pointer ${
              sortBy === 'susut' ? 'bg-[#1a56c4] text-white font-semibold' : 'bg-white text-[#1f2937]'
            }`}
          >
            Susut Terbesar (%)
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#fafbfd] text-[#6b7280] font-semibold">
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Jenis Cengkeh</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Jumlah Data</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Gld. Kering (Kg)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Rj. Kering (Kg)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Selisih (%)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Susut Dryer (%)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Total Susut (%)</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Kapasitas (%)</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((r, i) => {
              const pClass = getPctClass(r.totalSusutPct);
              return (
                <tr key={r.label || i} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937] font-medium">{r.label}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{r.jumlahData}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec1(r.gldKering)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec1(r.rjKering)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec2(r.selisihPct)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {formatDec2(r.susutDryerPct)}
                  </td>
                  <td className={`py-2 px-2.5 text-right border-b border-[#e1e5ec] font-mono font-medium ${
                    pClass === 'pct-high' ? 'text-[#c0392b] font-bold' : pClass === 'pct-low' ? 'text-[#1b8a5a] font-bold' : 'text-[#1f2937]'
                  }`}>
                    {formatDec2(r.totalSusutPct)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#6b7280] font-mono">
                    {formatDec2(r.kapasitasPct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#6b7280] pt-1 no-print">
          <div>
            Menampilkan {pagedRows.length} dari {filtered.length} varian · Halaman {currentPage} / {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
              aria-label="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
              aria-label="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ===== 3. DATA EXPLORER BATCH TABLE =====
interface BatchExplorerProps {
  rows: RawRowCengkeh[];
  onToggleVerify?: (srcRow: number) => void;
}

export const BatchExplorerTableRekapCengkeh: React.FC<BatchExplorerProps> = React.memo(({ rows, onToggleVerify }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterSumber, setFilterSumber] = useState<'semua' | 'dhp' | 'master'>('semua');
  const [filterJalur, setFilterJalur] = useState<'semua' | 'silo' | 'manual'>('semua');
  const pageSize = 15;

  // Hitung jumlah per sumber dan jalur
  const countDhp = useMemo(() => rows.filter((r) => r.sumber === 'DHP').length, [rows]);
  const countMaster = useMemo(() => rows.filter((r) => r.sumber !== 'DHP').length, [rows]);
  const countSilo = useMemo(() => rows.filter((r) => r.jalurSilo === 'Silo').length, [rows]);
  const countManual = useMemo(() => rows.filter((r) => r.jalurSilo !== 'Silo').length, [rows]);

  // Urutan data: default tanggal terbaru (Tanggal Rendam) selalu berada paling atas
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const dateA = (a.tanggal && a.tanggal !== 'Belum Tercatat') ? cleanDate(a.tanggal) : '';
      const dateB = (b.tanggal && b.tanggal !== 'Belum Tercatat') ? cleanDate(b.tanggal) : '';

      // Jika salah satu belum tercatat, batch aktif live diletakkan paling atas saat desc
      if (!dateA && dateB) return sortOrder === 'desc' ? -1 : 1;
      if (dateA && !dateB) return sortOrder === 'desc' ? 1 : -1;

      const dateDiff = dateB.localeCompare(dateA);
      if (dateDiff !== 0) {
        return sortOrder === 'desc' ? dateDiff : -dateDiff;
      }
      return sortOrder === 'desc' ? b.srcRow - a.srcRow : a.srcRow - b.srcRow;
    });
  }, [rows, sortOrder]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sorted.filter((r) => {
      if (filterSumber === 'dhp' && r.sumber !== 'DHP') return false;
      if (filterSumber === 'master' && r.sumber === 'DHP') return false;

      if (filterJalur === 'silo' && r.jalurSilo !== 'Silo') return false;
      if (filterJalur === 'manual' && r.jalurSilo === 'Silo') return false;

      if (!q) return true;
      return (
        r.srcRow.toString().includes(q) ||
        r.tanggal.includes(q) ||
        r.jenis.toLowerCase().includes(q) ||
        r.bulan.toLowerCase().includes(q) ||
        r.tahun.includes(q) ||
        (r.jalurSilo && r.jalurSilo.toLowerCase().includes(q)) ||
        (r.dhpPartaiId && r.dhpPartaiId.toLowerCase().includes(q))
      );
    });
  }, [sorted, filterSumber, filterJalur, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const pagedRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nomor partai, tanggal, jenis cengkeh..."
              className="w-full pl-8 pr-3 py-1.5 min-h-[44px] lg:min-h-[36px] rounded-md border border-[#e1e5ec] text-xs bg-white text-[#1f2937] placeholder-[#6b7280]"
            />
          </div>

          {/* Filter Sumber Data: Semua, DHP, Master Sheet */}
          <div className="inline-flex flex-wrap rounded-lg border border-[#e1e5ec] p-0.5 bg-slate-50 gap-0.5">
            <button
              type="button"
              onClick={() => { setFilterSumber('semua'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 min-h-[44px] lg:min-h-[32px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterSumber === 'semua'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Data ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterSumber('dhp'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 min-h-[44px] lg:min-h-[32px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterSumber === 'dhp'
                  ? 'bg-amber-50 text-amber-800 shadow-2xs font-bold border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Integrasi DHP ({countDhp})
            </button>
            <button
              type="button"
              onClick={() => { setFilterSumber('master'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 min-h-[44px] lg:min-h-[32px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterSumber === 'master'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Rekap ({countMaster})
            </button>
          </div>

          {/* Filter Jalur: Silo vs Manual */}
          <div className="inline-flex flex-wrap rounded-lg border border-[#e1e5ec] p-0.5 bg-slate-50 gap-0.5">
            <button
              type="button"
              onClick={() => { setFilterJalur('semua'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 min-h-[44px] lg:min-h-[32px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterJalur === 'semua'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Jalur
            </button>
            <button
              type="button"
              onClick={() => { setFilterJalur('silo'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 min-h-[44px] lg:min-h-[32px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterJalur === 'silo'
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌿 Silo ({countSilo})
            </button>
            <button
              type="button"
              onClick={() => { setFilterJalur('manual'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 min-h-[44px] lg:min-h-[32px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterJalur === 'manual'
                  ? 'bg-slate-200 text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚡ Manual ({countManual})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] lg:min-h-[34px] rounded-md border border-[#e1e5ec] bg-white text-[#1f2937] hover:bg-slate-50 transition-colors font-medium text-xs cursor-pointer shadow-2xs"
            title="Ubah urutan tanggal data"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Urutan: <strong className="text-blue-700">{sortOrder === 'desc' ? 'Terbaru di Atas' : 'Terlama di Atas'}</strong>
            </span>
          </button>
        </div>

        <div className="text-[#6b7280] text-xs">
          Total {filtered.length} baris data (Ditampilkan: {sortOrder === 'desc' ? 'Terbaru → Terlama' : 'Terlama → Terbaru'})
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#fafbfd] text-[#6b7280] font-semibold">
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Baris #</th>
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Sumber</th>
              <th className="py-2 px-2.5 text-center border-b border-[#e1e5ec]">Jalur</th>
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Tanggal Rendam</th>
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Jenis Cengkeh</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Gld. Kering</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Rajang Basah</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Selisih</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Rajang Kering</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Susut Dryer</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Total Susut</th>
              <th className="py-2 px-2.5 text-center border-b border-[#e1e5ec] no-print">Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((r) => {
              const pClass = getPctClass(r.totalSusutPct);
              return (
                <tr key={`${r.sumber || 'master'}-${r.dhpPartaiId || r.srcRow}`} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] font-mono whitespace-nowrap">
                    {r.sumber === 'DHP' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        {r.dhpPartaiId || 'DHP Live'}
                      </span>
                    ) : (
                      <span className="text-[#6b7280]">#{r.srcRow}</span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">
                    {r.sumber === 'DHP' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>DHP Live {r.dhpPartaiId ? `(${r.dhpPartaiId})` : ''}</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Rekap Master
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-center border-b border-[#e1e5ec]">
                    {r.jalurSilo === 'Silo' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span>🌿</span>
                        <span>Silo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span>⚡</span>
                        <span>Manual</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937]">
                    {r.tanggal && r.tanggal !== 'Belum Tercatat' && !r.tanggal.includes('Belum') ? (
                      formatTanggalIndo(r.tanggal)
                    ) : (
                      <span className="text-amber-700 italic text-[11px] font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Belum Tercatat
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937] font-medium">
                    {cleanJenisCengkeh(r.jenis)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatKg(r.gldKering)}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatKg(r.rjBasah)}</td>
                  <td className={`py-2 px-2.5 text-right border-b border-[#e1e5ec] font-mono ${
                    r.selisihPct > 0 ? 'text-[#1b8a5a]' : r.selisihPct < 0 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {r.selisihPct > 0 ? `+${formatPct(r.selisihPct)}` : formatPct(r.selisihPct)}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatKg(r.rjKering)}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatPct(r.susutPct)}</td>
                  <td className={`py-2 px-2.5 text-right border-b border-[#e1e5ec] font-mono ${
                    pClass === 'pct-high' ? 'text-[#c0392b] font-bold' : pClass === 'pct-low' ? 'text-[#1b8a5a] font-bold' : 'text-[#1f2937]'
                  }`}>
                    {formatPct(r.totalSusutPct)}
                  </td>
                  <td className="py-2 px-2.5 text-center border-b border-[#e1e5ec] no-print">
                    <button
                      type="button"
                      onClick={() => onToggleVerify && onToggleVerify(r.srcRow)}
                      className={`no-print inline-flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[44px] lg:min-h-[30px] rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        r.verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{r.verified ? 'Verified' : 'Check'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[#6b7280] pt-1 no-print">
        <div>
          Halaman {currentPage} dari {totalPages}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
            aria-label="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
