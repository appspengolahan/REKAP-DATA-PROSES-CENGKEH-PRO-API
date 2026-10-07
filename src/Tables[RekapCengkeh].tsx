/**
 * Data Tables Component
 * File: Tables[RekapCengkeh].tsx
 * Styling: Exact Divisi Produksi I Visual Standard (Consistent with Index[RekapCengkeh].html)
 */
import React, { useState, useMemo } from 'react';
import { RekapItemCengkeh, RawRowCengkeh } from './types[RekapCengkeh]';
import { formatKg, formatPct, getPctClass, formatTanggalIndo, MONTH_ORDER } from './Code[RekapCengkeh]';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, ArrowUpDown } from 'lucide-react';

// ===== 1. TABEL REKAP BULANAN =====
interface TableBulanProps {
  data: RekapItemCengkeh[];
  initialSort?: 'desc' | 'asc';
}

export const TableBulanRekapCengkeh: React.FC<TableBulanProps> = ({ data, initialSort = 'desc' }) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(initialSort);

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

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-[#6b7280] text-xs bg-white">
        Tidak ada data bulanan untuk periode ini.
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 no-print">
        <span className="text-[11px]">
          Menampilkan <strong className="text-slate-800">{sortedData.length}</strong> periode bulan
        </span>
        <button
          type="button"
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1a56c4] bg-[#eef3fd] hover:bg-blue-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-blue-200"
          title="Klik untuk mengubah urutan periode bulan"
        >
          <ArrowUpDown className="w-3 h-3" />
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
            {sortedData.map((r, i) => {
              const pClass = getPctClass(r.totalSusutPct);
              return (
                <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937] font-semibold">{r.label}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{r.jumlahData}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.gldKering).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.rjKering).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.selisihPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.susutDryerPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2 px-2.5 text-right border-b border-[#e1e5ec] font-mono font-medium ${
                    pClass === 'pct-high' ? 'text-[#c0392b] font-bold' : pClass === 'pct-low' ? 'text-[#1b8a5a] font-bold' : 'text-[#1f2937]'
                  }`}>
                    {Number(r.totalSusutPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#6b7280] font-mono">
                    {Number(r.minPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#6b7280] font-mono">
                    {Number(r.maxPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===== 2. TABEL REKAP PER JENIS CENGKEH =====
interface TableJenisProps {
  data: RekapItemCengkeh[];
}

export const TableJenisRekapCengkeh: React.FC<TableJenisProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'susut'>('volume');

  const filtered = data
    .filter((d) => d.label.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'volume') return b.gldKering - a.gldKering;
      return b.totalSusutPct - a.totalSusutPct;
    });

  return (
    <div className="space-y-3">
      {/* Sub-filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs no-print">
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari jenis cengkeh..."
            className="pl-7 pr-3 py-1 rounded-md border border-[#e1e5ec] text-xs bg-white text-[#1f2937] placeholder-[#6b7280]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <span>Urutkan:</span>
          <button
            onClick={() => setSortBy('volume')}
            className={`px-2 py-0.5 rounded border border-[#e1e5ec] cursor-pointer ${
              sortBy === 'volume' ? 'bg-[#1a56c4] text-white font-semibold' : 'bg-white text-[#1f2937]'
            }`}
          >
            Volume (Kg)
          </button>
          <button
            onClick={() => setSortBy('susut')}
            className={`px-2 py-0.5 rounded border border-[#e1e5ec] cursor-pointer ${
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
            {filtered.map((r, i) => {
              const pClass = getPctClass(r.totalSusutPct);
              return (
                <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937] font-medium">{r.label}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{r.jumlahData}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.gldKering).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.rjKering).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.selisihPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">
                    {Number(r.susutDryerPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2 px-2.5 text-right border-b border-[#e1e5ec] font-mono font-medium ${
                    pClass === 'pct-high' ? 'text-[#c0392b] font-bold' : pClass === 'pct-low' ? 'text-[#1b8a5a] font-bold' : 'text-[#1f2937]'
                  }`}>
                    {Number(r.totalSusutPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#6b7280] font-mono">
                    {Number(r.kapasitasPct).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===== 3. DATA EXPLORER BATCH TABLE =====
interface BatchExplorerProps {
  rows: RawRowCengkeh[];
  onToggleVerify?: (srcRow: number) => void;
}

export const BatchExplorerTableRekapCengkeh: React.FC<BatchExplorerProps> = ({ rows, onToggleVerify }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.srcRow.toString().includes(q) ||
      r.tanggal.includes(q) ||
      r.jenis.toLowerCase().includes(q) ||
      r.bulan.toLowerCase().includes(q) ||
      r.tahun.includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nomor partai, tanggal, jenis cengkeh..."
            className="pl-7 pr-3 py-1.5 rounded-md border border-[#e1e5ec] text-xs bg-white text-[#1f2937] placeholder-[#6b7280]"
          />
        </div>
        <div className="text-[#6b7280] text-xs">
          Total {filtered.length} baris data
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#fafbfd] text-[#6b7280] font-semibold">
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Baris #</th>
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Tanggal Rendam</th>
              <th className="py-2 px-2.5 text-left border-b border-[#e1e5ec]">Jenis Cengkeh</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Gld. Kering</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Rajang Basah</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Selisih</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Rajang Kering</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Susut Dryer</th>
              <th className="py-2 px-2.5 text-right border-b border-[#e1e5ec]">Total Susut</th>
              <th className="py-2 px-2.5 text-center border-b border-[#e1e5ec]">Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((r) => {
              const pClass = getPctClass(r.totalSusutPct);
              return (
                <tr key={r.srcRow} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#6b7280] font-mono">#{r.srcRow}</td>
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937]">{formatTanggalIndo(r.tanggal)}</td>
                  <td className="py-2 px-2.5 text-left border-b border-[#e1e5ec] text-[#1f2937] font-medium">{r.jenis}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatKg(r.gldKering)}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatKg(r.rjBasah)}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1b8a5a] font-mono">+{formatPct(r.selisihPct)}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatKg(r.rjKering)}</td>
                  <td className="py-2 px-2.5 text-right border-b border-[#e1e5ec] text-[#1f2937] font-mono">{formatPct(r.susutPct)}</td>
                  <td className={`py-2 px-2.5 text-right border-b border-[#e1e5ec] font-mono ${
                    pClass === 'pct-high' ? 'text-[#c0392b] font-bold' : pClass === 'pct-low' ? 'text-[#1b8a5a] font-bold' : 'text-[#1f2937]'
                  }`}>
                    {formatPct(r.totalSusutPct)}
                  </td>
                  <td className="py-2 px-2.5 text-center border-b border-[#e1e5ec]">
                    <button
                      type="button"
                      onClick={() => onToggleVerify && onToggleVerify(r.srcRow)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        r.verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded border border-[#e1e5ec] disabled:opacity-40 hover:bg-[#eef3fd] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
